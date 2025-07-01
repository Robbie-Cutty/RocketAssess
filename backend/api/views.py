from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import OrganizationSerializer, TestSerializer, QuestionSerializer, TeacherSerializer
from .models import Organization, Teacher, Test, Question, Student, StudentInvite, TestInvite, Submission, SubmissionAnswer
from django.db import IntegrityError
from django.core.mail import send_mail
from django.conf import settings
import re
from rest_framework.permissions import AllowAny
from rest_framework.generics import UpdateAPIView, DestroyAPIView
from rest_framework.decorators import api_view
from django.contrib.auth.models import User
from django.utils.crypto import get_random_string
from django.contrib.auth.hashers import make_password, check_password
from datetime import datetime, timedelta
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
from django.db.models import Sum
from django.core.cache import cache
from django.db.models import Prefetch
import logging
from .auth_utils import authenticate_user, get_user_response_data, login_required
from .registration_utils import validate_registration_data, create_user, get_registration_response
from .email_utils import send_teacher_invite_email
from .db_utils import (
    get_cached_teacher_tests, get_cached_test_questions, get_cached_question_pool,
    check_duplicate_question, clear_test_cache, clear_teacher_cache
)
from django.db import transaction
from rest_framework.exceptions import PermissionDenied

logger = logging.getLogger(__name__)

# JWT Configuration
# JWT_SECRET_KEY = settings.SECRET_KEY
# JWT_ALGORITHM = 'HS256'
# JWT_EXPIRATION_HOURS = 24

# def generate_jwt_token(user_data, user_type):
#     """Generate JWT token for user"""
#     payload = {
#         'user_id': user_data.get('id'),
#         'email': user_data.get('email'),
#         'user_type': user_type,
#         'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
#         'iat': datetime.utcnow()
#     }
#     return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

# def verify_jwt_token(token):
#     """Verify and decode JWT token"""
#     try:
#         payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
#         return payload
#     except jwt.ExpiredSignatureError:
#         return None
#     except jwt.InvalidTokenError:
#         return None

# def require_auth(user_type=None):
#     """Decorator to require authentication"""
#     def decorator(view_func):
#         @wraps(view_func)
#         def wrapper(request, *args, **kwargs):
#             auth_header = request.headers.get('Authorization')
#             if not auth_header or not auth_header.startswith('Bearer '):
#                 return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
#             
#             token = auth_header.split(' ')[1]
#             payload = verify_jwt_token(token)
#             if not payload:
#                 return Response({'error': 'Invalid or expired token'}, status=status.HTTP_401_UNAUTHORIZED)
#             
#             if user_type and payload.get('user_type') != user_type:
#                 return Response({'error': 'Insufficient permissions'}, status=status.HTTP_403_FORBIDDEN)
#             
#             request.user_payload = payload
#             return view_func(request, *args, **kwargs)
#         return wrapper
#     return decorator

# Utility function to set login state
def set_login_state(user, user_type, state):
    if user_type == 'organization':
        Organization.objects.filter(pk=user.pk).update(is_logged_in=state)
    elif user_type == 'teacher':
        Teacher.objects.filter(pk=user.pk).update(is_logged_in=state)
    elif user_type == 'student':
        Student.objects.filter(pk=user.pk).update(is_logged_in=state)

def check_authentication(request):
    email = None
    user_type = None
    
    # First try to get from HTTP headers (set by axios interceptor)
    email = request.META.get('HTTP_X_USER_EMAIL')
    user_type = request.META.get('HTTP_X_USER_TYPE')
    
    # If not in headers, try to get from request data/params (fallback)
    if not email or not user_type:
        # DRF Request
        if hasattr(request, 'query_params') and hasattr(request, 'data'):
            email = request.data.get('email') or request.query_params.get('email')
            user_type = request.data.get('user_type') or request.query_params.get('user_type')
        # Regular Django Request
        else:
            email = request.POST.get('email') or request.GET.get('email')
            user_type = request.POST.get('user_type') or request.GET.get('user_type')
    
    if not email or not user_type:
        raise PermissionDenied("Authentication required")
    
    # Check if user exists and is logged in
    if user_type == 'student':
        try:
            student = Student.objects.get(email=email)
            if not student.is_logged_in:
                raise PermissionDenied("User not logged in")
        except Student.DoesNotExist:
            raise PermissionDenied("Student not found")
    elif user_type == 'teacher':
        try:
            teacher = Teacher.objects.get(email=email)
            if not teacher.is_logged_in:
                raise PermissionDenied("User not logged in")
        except Teacher.DoesNotExist:
            raise PermissionDenied("Teacher not found")
    elif user_type == 'organization':
        try:
            org = Organization.objects.get(org_code=email)
            if not org.is_logged_in:
                raise PermissionDenied("User not logged in")
        except Organization.DoesNotExist:
            raise PermissionDenied("Organization not found")
    else:
        raise PermissionDenied("Invalid user type")

class OrganizationRegisterView(APIView):
    def post(self, request):
        # This endpoint is public (for registration), so no role check needed
        serializer = OrganizationSerializer(data=request.data)
        if serializer.is_valid():
            try:
                org = serializer.save()
                # Send welcome email if email is provided
                if org.email:
                    subject = f"Welcome to Rocket Assess, {org.name}!"
                    html_message = f"""
                    <html>
                    <body>
                        <h2>Welcome to <span style='color:#2563eb;'>Rocket Assess</span>!</h2>
                        <p>Dear <b>{org.name}</b>,</p>
                        <p>Your organization has been successfully registered with the following details:</p>
                        <ul>
                            <li><b>Organization Code:</b> {org.org_code}</li>
                            <li><b>Organization Name:</b> {org.name}</li>
                            <li><b>Website:</b> {org.website or 'N/A'}</li>
                            <li><b>City:</b> {org.city or 'N/A'}</li>
                        </ul>
                        <p>You can now invite teachers and students to join your organization and start using Rocket Assess for online assessments.</p>
                        <p style='margin-top:2em;'>Best regards,<br><b>Rocket Assess Team</b></p>
                    </body>
                    </html>
                    """
                    send_mail(
                        subject,
                        '',  # plain text message (optional)
                        f"Rocket Assess",
                        [org.email],
                        html_message=html_message,
                        fail_silently=False,
                    )
                return Response({'message': 'Organization registered successfully.'}, status=status.HTTP_201_CREATED)
            except IntegrityError as e:
                return Response({'error': 'Database error: ' + str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': 'Unexpected error: ' + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class OrganizationLoginView(APIView):
    def post(self, request):
        # This endpoint is public (for login), so no role check needed
        org_code = request.data.get('org_code')
        email = request.data.get('email')
        user, error_response = authenticate_user('organization', email, org_code=org_code)
        if error_response:
            return error_response
        set_login_state(user, 'organization', True)
        response_data = get_user_response_data(user, 'organization')
        return Response(response_data, status=status.HTTP_200_OK)

class TeacherInviteView(APIView):
    def dispatch(self, request, *args, **kwargs):
        check_authentication(request)
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        # Check if user is a teacher
        user_type = request.META.get('HTTP_X_USER_TYPE')
        if user_type != 'teacher':
            return Response({
                'error': f'Access denied. This endpoint requires teacher privileges. You are authenticated as: {user_type}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        emails = request.data.get('emails', [])
        if not isinstance(emails, list) or not emails:
            return Response({'error': 'A list of emails is required.'}, status=status.HTTP_400_BAD_REQUEST)
        results = []
        for email in emails:
            if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
                results.append({'email': email, 'status': 'invalid'})
                continue
            try:
                # Simulate invite link (in real app, generate a secure tokenized link)
                invite_link = 'http://192.168.1.71:5173/teacher-register?email=' + email
                success = send_teacher_invite_email(email, invite_link)
                if success:
                    results.append({'email': email, 'status': 'sent'})
                else:
                    results.append({'email': email, 'status': 'error', 'error': 'Failed to send email'})
            except Exception as e:
                results.append({'email': email, 'status': 'error', 'error': str(e)})
        return Response({'results': results}, status=status.HTTP_200_OK)

class TeacherListView(APIView):
    def dispatch(self, request, *args, **kwargs):
        check_authentication(request)
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        # Check if user is a teacher
        user_type = request.META.get('HTTP_X_USER_TYPE')
        if user_type != 'teacher':
            return Response({
                'error': f'Access denied. This endpoint requires teacher privileges. You are authenticated as: {user_type}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        org_code = request.query_params.get('org_code')
        if not org_code:
            return Response({'error': 'Organization code is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            org = Organization.objects.get(org_code=org_code)
            teachers = Teacher.objects.filter(org=org).values('id', 'teacher_id', 'name', 'email', 'gender', 'created_at')
            return Response(list(teachers), status=status.HTTP_200_OK)
        except Organization.DoesNotExist:
            return Response({'error': 'Organization not found.'}, status=status.HTTP_404_NOT_FOUND)

class TeacherRegisterView(APIView):
    def post(self, request):
        # This endpoint is public (for registration), so no role check needed
        serializer = TeacherSerializer(data=request.data)
        if serializer.is_valid():
            try:
                org = None
                org_code = serializer.validated_data.get('org_code')
                org_pk = serializer.validated_data.get('org')
                if org_code:
                    org = Organization.objects.get(org_code=org_code)
                elif org_pk:
                    org = Organization.objects.get(pk=org_pk)
                else:
                    return Response({'error': 'Organization not specified.'}, status=status.HTTP_400_BAD_REQUEST)
                teacher = Teacher.objects.create(
                    org_id=org.id,
                    teacher_id=serializer.validated_data.get('teacher_id', f"T{Teacher.objects.count() + 1}"),
                    name=serializer.validated_data['name'],
                    email=serializer.validated_data['email'],
                    password=make_password(serializer.validated_data['password']),
                    gender=serializer.validated_data.get('gender', '')
                )
                return Response({
                    'message': 'Teacher registered successfully.',
                    'teacher': {
                        'id': teacher.id,
                        'teacher_id': teacher.teacher_id,
                        'name': teacher.name,
                        'email': teacher.email,
                        'org_id': teacher.org_id,
                    }
                }, status=status.HTTP_201_CREATED)
            except Organization.DoesNotExist:
                return Response({'error': 'Organization not found.'}, status=status.HTTP_404_NOT_FOUND)
            except IntegrityError as e:
                return Response({'error': 'Database error: ' + str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': 'Unexpected error: ' + str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TeacherLoginView(APIView):
    def post(self, request):
        # This endpoint is public (for login), so no role check needed
        email = request.data.get('email')
        password = request.data.get('password')
        user, error_response = authenticate_user('teacher', email, password=password)
        if error_response:
            return error_response
        set_login_state(user, 'teacher', True)
        response_data = get_user_response_data(user, 'teacher')
        return Response(response_data, status=status.HTTP_200_OK)

class TestCreateView(APIView):
    def dispatch(self, request, *args, **kwargs):
        check_authentication(request)
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        # Check if user is a teacher
        user_type = request.META.get('HTTP_X_USER_TYPE')
        if user_type != 'teacher':
            return Response({
                'error': f'Access denied. This endpoint requires teacher privileges. You are authenticated as: {user_type}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = TestSerializer(data=request.data)
        if serializer.is_valid():
            test = serializer.save()
            return Response(TestSerializer(test).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TestListView(APIView):
    def dispatch(self, request, *args, **kwargs):
        check_authentication(request)
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        # Check if user is a teacher
        email = request.META.get('HTTP_X_USER_EMAIL')
        user_type = request.META.get('HTTP_X_USER_TYPE')
        
        if user_type != 'teacher':
            return Response({
                'error': f'Access denied. This endpoint requires teacher privileges. You are authenticated as: {user_type}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        teacher_id = request.query_params.get('teacher_id')
        if not teacher_id:
            return Response({'error': 'Teacher ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        tests = get_cached_teacher_tests(teacher_id)
        if tests is None:
            return Response({'error': 'Teacher not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(tests, status=status.HTTP_200_OK)

class QuestionCreateView(APIView):
    def dispatch(self, request, *args, **kwargs):
        check_authentication(request)
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        # Check if user is a teacher
        user_type = request.META.get('HTTP_X_USER_TYPE')
        if user_type != 'teacher':
            return Response({
                'error': f'Access denied. This endpoint requires teacher privileges. You are authenticated as: {user_type}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = QuestionSerializer(data=request.data)
        if serializer.is_valid():
            # Check for duplicate questions using shared utility
            if check_duplicate_question(
                serializer.validated_data['test'].id,
                serializer.validated_data['text']
            ):
                return Response({'error': 'This question already exists in this test.'}, status=status.HTTP_400_BAD_REQUEST)
            
            question = serializer.save()
            # Clear cache for this test
            clear_test_cache(question.test.id)
            return Response(QuestionSerializer(question).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class QuestionListView(APIView):
    def dispatch(self, request, *args, **kwargs):
        check_authentication(request)
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        # Allow both teachers and students to access questions
        user_type = request.META.get('HTTP_X_USER_TYPE')
        if user_type not in ['teacher', 'student']:
            return Response({
                'error': f'Access denied. This endpoint requires teacher or student privileges. You are authenticated as: {user_type}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        test_id = request.query_params.get('test_id')
        if not test_id:
            return Response({'error': 'Test ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        # For students, verify they have access to this test
        if user_type == 'student':
            student_email = request.META.get('HTTP_X_USER_EMAIL')
            if not student_email:
                return Response({'error': 'Student email required.'}, status=status.HTTP_400_BAD_REQUEST)
            from .models import TestInvite
            if not TestInvite.objects.filter(test_id=test_id, student_email=student_email).exists():
                return Response({'error': 'Access denied. You are not invited to this test.'}, status=status.HTTP_403_FORBIDDEN)
        
        questions = get_cached_test_questions(test_id)
        return Response(questions, status=status.HTTP_200_OK)

class QuestionUpdateView(UpdateAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    
    def dispatch(self, request, *args, **kwargs):
        check_authentication(request)
        return super().dispatch(request, *args, **kwargs)
    
    def patch(self, request, *args, **kwargs):
        # Check if user is a teacher
        user_type = request.META.get('HTTP_X_USER_TYPE')
        if user_type != 'teacher':
            return Response({
                'error': f'Access denied. This endpoint requires teacher privileges. You are authenticated as: {user_type}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().patch(request, *args, **kwargs)

class QuestionDeleteView(DestroyAPIView):
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    
    def dispatch(self, request, *args, **kwargs):
        check_authentication(request)
        return super().dispatch(request, *args, **kwargs)
    
    def delete(self, request, *args, **kwargs):
        # Check if user is a teacher
        user_type = request.META.get('HTTP_X_USER_TYPE')
        if user_type != 'teacher':
            return Response({
                'error': f'Access denied. This endpoint requires teacher privileges. You are authenticated as: {user_type}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().delete(request, *args, **kwargs)

class QuestionPoolView(APIView):
    def dispatch(self, request, *args, **kwargs):
        check_authentication(request)
        return super().dispatch(request, *args, **kwargs)
    
    def get(self, request):
        # Check if user is a teacher
        user_type = request.META.get('HTTP_X_USER_TYPE')
        if user_type != 'teacher':
            return Response({
                'error': f'Access denied. This endpoint requires teacher privileges. You are authenticated as: {user_type}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        teacher_id = request.query_params.get('teacher_id')
        subject = request.query_params.get('subject', '')
        if not teacher_id:
            return Response({'error': 'Teacher ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 10))
        
        data = get_cached_question_pool(teacher_id, subject, page, page_size)
        if data is None:
            return Response({'error': 'Teacher not found.'}, status=status.HTTP_404_NOT_FOUND)
        
        return Response(data, status=status.HTTP_200_OK)

# Utility endpoint to delete all but one of each case-insensitive duplicate question per test
@api_view(['POST'])
@login_required
def deduplicate_questions(request):
    deleted = 0
    for test in Test.objects.all():
        seen = {}
        for q in Question.objects.filter(test=test):
            key = q.text.strip().lower()
            if key in seen:
                q.delete()
                deleted += 1
            else:
                seen[key] = q.id
    return Response({'deleted': deleted}, status=200)

@api_view(['GET'])
@login_required
def teacher_org_info(request):
    teacher_id = request.query_params.get('teacher_id')
    if not teacher_id:
        return Response({'error': 'Teacher ID required'}, status=400)
    try:
        teacher = Teacher.objects.get(id=teacher_id)
        org_name = teacher.org.name if teacher.org else ''
        return Response({'org_name': org_name, 'teacher_name': teacher.name, 'email': teacher.email})
    except Teacher.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=404)

class StudentRegisterView(APIView):
    def post(self, request):
        # This endpoint is public (for registration), so no role check needed
        # Get all fields from the request
        student_id = request.data.get('student_id')
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        org_id = request.data.get('org_id')
        invited_by_id = request.data.get('invited_by')
        gender = request.data.get('gender', '')
        grade = request.data.get('grade', '')

        # Validate required fields
        if not all([student_id, name, email, password, org_id]):
            return Response({'error': 'All fields are required.'}, status=status.HTTP_400_BAD_REQUEST)
        if Student.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)
        if Student.objects.filter(student_id=student_id).exists():
            return Response({'error': 'Student ID already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            org = Organization.objects.get(id=org_id)
            invited_by = Teacher.objects.get(id=invited_by_id) if invited_by_id else None

            # Create Student object
            student = Student.objects.create(
                org=org,
                invited_by=invited_by,
                student_id=student_id,
                name=name,
                email=email,
                password=make_password(password),
                gender=gender,
                grade=grade
            )

            # Optionally, also create a Django User for login
            if not User.objects.filter(username=email).exists():
                User.objects.create_user(username=email, email=email, password=password, first_name=name)

            return Response({'status': 'Student registered.'}, status=status.HTTP_201_CREATED)
        except Organization.DoesNotExist:
            return Response({'error': 'Organization not found.'}, status=status.HTTP_404_NOT_FOUND)
        except Teacher.DoesNotExist:
            return Response({'error': 'Inviter (teacher) not found.'}, status=status.HTTP_404_NOT_FOUND)
        except IntegrityError:
            return Response({'error': 'Registration failed.'}, status=status.HTTP_400_BAD_REQUEST)

class StudentInviteView(APIView):
    def dispatch(self, request, *args, **kwargs):
        check_authentication(request)
        return super().dispatch(request, *args, **kwargs)
    
    def post(self, request):
        # Check if user is a teacher
        user_type = request.META.get('HTTP_X_USER_TYPE')
        if user_type != 'teacher':
            return Response({
                'error': f'Access denied. This endpoint requires teacher privileges. You are authenticated as: {user_type}'
            }, status=status.HTTP_403_FORBIDDEN)
        
        emails = request.data.get('emails', [])
        teacher_id = request.data.get('teacher_id')
        if not isinstance(emails, list) or not emails:
            return Response({'error': 'A list of emails is required.'}, status=status.HTTP_400_BAD_REQUEST)
        results = []
        for email in emails:
            if not re.match(r'^[^@\s]+@[^@\s]+\.[^@\s]+$', email):
                results.append({'email': email, 'status': 'invalid'})
                continue
            # Check if already registered
            if Student.objects.filter(email=email).exists():
                results.append({'email': email, 'status': 'registered'})
                continue
            # Check if already invited
            if StudentInvite.objects.filter(teacher_id=teacher_id, email=email).exists():
                results.append({'email': email, 'status': 'already_invited'})
                continue
            try:
                # Fetch org_code for the teacher
                teacher = Teacher.objects.get(id=teacher_id)
                org_code = teacher.org.org_code if teacher and teacher.org else ''
                invite_link = f'http://192.168.1.71:5173/student-register?email={email}&org_code={org_code}'
                subject = 'You are invited to join Rocket Assess as a Student'
                html_message = f"""
                <html><body>
                <p>Hello,</p>
                <p>You have been invited to join Rocket Assess as a student. Click the link below to register:</p>
                <p><a href='{invite_link}'>{invite_link}</a></p>
                <p>If you did not expect this invitation, you can ignore this email.</p>
                <p>Best regards,<br>Rocket Assess Team</p>
                </body></html>
                """
                send_mail(
                    subject,
                    '',
                    f"Rocket Assess <{settings.EMAIL_HOST_USER}>",
                    [email],
                    html_message=html_message,
                    fail_silently=False,
                )
                # Record the invite
                StudentInvite.objects.create(teacher_id=teacher_id, email=email)
                results.append({'email': email, 'status': 'sent'})
            except Exception as e:
                results.append({'email': email, 'status': 'error', 'error': str(e)})
        return Response({'results': results}, status=status.HTTP_200_OK)

@api_view(['GET'])
@login_required
def organization_lookup(request):
    org_code = request.GET.get('org_code')
    if not org_code:
        return Response({'error': 'org_code is required'}, status=400)
    try:
        org = Organization.objects.get(org_code=org_code)
        return Response({'id': org.id, 'name': org.name, 'org_code': org.org_code})
    except Organization.DoesNotExist:
        return Response({'error': 'Organization not found'}, status=404)

class StudentLoginView(APIView):
    def post(self, request):
        # This endpoint is public (for login), so no role check needed
        email = request.data.get('email')
        password = request.data.get('password')
        user, error_response = authenticate_user('student', email, password=password)
        if error_response:
            return error_response
        set_login_state(user, 'student', True)
        response_data = get_user_response_data(user, 'student')
        return Response(response_data, status=status.HTTP_200_OK)

@api_view(['GET'])
@login_required
def student_profile(request):
    email = request.GET.get('email')
    if not email:
        return Response({'error': 'Email required'}, status=400)
    try:
        student = Student.objects.get(email=email)
        return Response({
            'name': student.name,
            'email': student.email,
            'organization_name': student.org.name if student.org else '',
        })
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)

@api_view(['GET'])
@login_required
def invited_students(request):
    teacher_id = request.GET.get('teacher_id')
    if not teacher_id:
        return Response({'error': 'teacher_id required'}, status=400)
    invites = StudentInvite.objects.filter(teacher_id=teacher_id).order_by('-created_at')
    results = []
    for invite in invites:
        student = Student.objects.filter(email=invite.email).first()
        registered = bool(student)
        name = student.name if student else ''
        results.append({
            'email': invite.email,
            'name': name,
            'registered': registered,
            'invited_at': invite.created_at,
        })
    return Response({'invited_students': results})

@api_view(['GET'])
@login_required
def teacher_students(request):
    teacher_id = request.GET.get('teacher_id')
    if not teacher_id or not teacher_id.isdigit():
        return JsonResponse({'error': 'Invalid teacher_id'}, status=400)
    teacher_id = int(teacher_id)
    if not teacher_id:
        return Response({'error': 'teacher_id required'}, status=400)
    try:
        teacher = Teacher.objects.get(id=teacher_id)
        students = Student.objects.filter(org=teacher.org).order_by('name')
        results = []
        for s in students:
            results.append({
                'name': s.name,
                'grade': s.grade,
                'email': s.email,
                'account_state': 'Registered',
            })
        return Response({'students': results})
    except Teacher.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=404)

@csrf_exempt
@api_view(['POST'])
@login_required
def invite_test(request):
    data = request.data
    
    teacher_name = data.get('teacher_name')
    students = data.get('students', [])
    time_to_start = data.get('time_to_start')
    duration_minutes = int(data.get('duration_minutes', 60))
    title = data.get('title')
    description = data.get('description')
    subject = data.get('subject')
    point_value = data.get('point_value')
    test_id = data.get('test_id')  # New field

    # Improved error handling
    if not teacher_name or not teacher_name.strip():
        return Response({'error': 'Teacher name is required.'}, status=400)
    if not students or not isinstance(students, list) or len(students) == 0:
        return Response({'error': 'At least one student must be selected.'}, status=400)
    if not time_to_start:
        return Response({'error': 'Start time is required.'}, status=400)
    if not title:
        return Response({'error': 'Test title is required.'}, status=400)
    if not subject:
        return Response({'error': 'Test subject is required.'}, status=400)
    if point_value is None or point_value == '':
        return Response({'error': 'Point value is required.'}, status=400)

    # Get the test object if test_id is provided
    test = None
    if test_id:
        try:
            test = Test.objects.get(id=test_id)
        except Test.DoesNotExist:
            return Response({'error': f'Test with ID {test_id} not found.'}, status=404)

    # Calculate end_time
    try:
        start_dt = datetime.fromisoformat(time_to_start)
        end_dt = start_dt + timedelta(minutes=duration_minutes)
    except Exception as e:
        return Response({'error': 'Invalid time format.'}, status=400)

    # Anti-duplicate logic
    duplicates = []
    for student_email in students:
        if TestInvite.objects.filter(
            title=title,
            student_email=student_email,
            time_to_start=start_dt
        ).exists():
            duplicates.append(student_email)
    if duplicates:
        return Response({
            'error': 'Duplicate invite(s) detected.',
            'duplicates': duplicates
        }, status=409)

    # If no duplicates, proceed to create invites
    results = []
    for student_email in students:
        try:
            invite = TestInvite.objects.create(
                test=test,  # Link to the test
                teacher_name=teacher_name,
                student_email=student_email,
                time_to_start=start_dt,
                duration_minutes=duration_minutes,
                title=title,
                description=description,
                subject=subject,
                point_value=point_value,
                end_time=end_dt,
            )
            results.append({'email': student_email, 'status': 'invited'})
        except Exception as e:
            results.append({'email': student_email, 'status': 'error', 'error': str(e)})

    return Response({'results': results}, status=200)

@api_view(['GET'])
@login_required
def test_detail(request):
    test_id = request.GET.get('test_id')
    if not test_id:
        return Response({'error': 'Test ID is required.'}, status=400)
    try:
        test = Test.objects.get(id=test_id)
        questions = Question.objects.filter(test=test).order_by('created_at')
        # Get the first TestInvite for this test to get duration and end_time
        from .models import TestInvite
        invite = TestInvite.objects.filter(test=test).order_by('time_to_start').first()
        duration_minutes = invite.duration_minutes if invite else None
        end_time = invite.end_time if invite else None
        return Response({
            'id': test.id,
            'title': test.name,
            'subject': test.subject,
            'description': test.description,
            'duration_minutes': duration_minutes,
            'end_time': end_time,
            'questions': [
                {
                    'id': q.id,
                    'text': q.text,
                    'option_a': q.option_a,
                    'option_b': q.option_b,
                    'option_c': q.option_c,
                    'option_d': q.option_d,
                    'point_value': q.point_value,
                }
                for q in questions
            ]
        })
    except Test.DoesNotExist:
        return Response({'error': 'Test not found.'}, status=404)

@api_view(['GET'])
@login_required
def list_test_invites(request):
    from .models import TestInvite
    invites = TestInvite.objects.all().values()
    return Response(list(invites))

@api_view(['GET'])
@login_required
def student_test_invites(request):
    email = request.GET.get('email')
    added = request.GET.get('added')
    
    if not email:
        return Response({'error': 'Email is required.'}, status=400)
    
    # Try to get from cache first
    cache_key = f'student_invites_{email}_{added}'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data, status=200)
    
    qs = TestInvite.objects.filter(student_email=email).select_related('test')
    
    if added == 'true':
        qs = qs.filter(added_to_tests=True)
    elif added == 'false':
        qs = qs.filter(added_to_tests=False)
    
    invites = qs.order_by('-time_to_start')
    results = [
        {
            'id': invite.id,
            'test_id': invite.test.id if invite.test else None,
            'title': invite.title,
            'subject': invite.subject,
            'description': invite.description,
            'time_to_start': invite.time_to_start,
            'duration_minutes': invite.duration_minutes,
            'point_value': invite.point_value,
            'end_time': invite.end_time,
        }
        for invite in invites
    ]
    
    data = {'invites': results}
    
    # Cache for 2 minutes
    cache.set(cache_key, data, 120)
    
    return Response(data)

@api_view(['POST'])
@login_required
def mark_invite_added(request):
    invite_id = request.data.get('invite_id')
    if not invite_id:
        return Response({'error': 'invite_id required'}, status=400)
    try:
        invite = TestInvite.objects.get(id=invite_id)
        invite.added_to_tests = True
        invite.save()
        return Response({'success': True})
    except TestInvite.DoesNotExist:
        return Response({'error': 'Invite not found'}, status=404)

@csrf_exempt
@api_view(['POST'])
@login_required
def submit_test(request):
    """
    Submit a test with student answers and calculate score
    """
    try:
        data = request.data
        test_id = data.get('test_id')
        student_email = data.get('student_email')
        answers = data.get('answers', {})  # {question_id: selected_answer}
        duration = data.get('duration', 0)  # in seconds
        
        if not test_id or not student_email:
            return Response({'error': 'test_id and student_email are required'}, status=400)
        
        # Get the test and student
        try:
            test = Test.objects.get(id=test_id)
            student = Student.objects.get(email=student_email)
        except (Test.DoesNotExist, Student.DoesNotExist):
            return Response({'error': 'Test or student not found'}, status=400)
        
        # Check if student already submitted this test
        if Submission.objects.filter(test=test, student=student).exists():
            return Response({'error': 'Test already submitted'}, status=400)
        
        # Get all questions for this test
        questions = Question.objects.filter(test=test)
        
        # Calculate score
        total_points = 0
        earned_points = 0
        
        # Create submission
        submission = Submission.objects.create(
            test=test,
            student=student,
            duration=duration,
            score=0  # Will be updated after calculation
        )
        
        # Process each answer
        for question in questions:
            total_points += question.point_value
            selected_answer = answers.get(str(question.id))
            
            if selected_answer and selected_answer == question.correct_answer:
                earned_points += question.point_value
            
            # Save the answer (even if incorrect)
            if selected_answer:
                SubmissionAnswer.objects.create(
                    submission=submission,
                    question=question,
                    selected_key=selected_answer
                )
        
        # Calculate final score
        final_score = (earned_points / total_points * 100) if total_points > 0 else 0
        submission.score = final_score
        submission.save()
        
        return Response({
            'success': True,
            'submission_id': submission.id,
            'score': float(final_score),
            'total_points': total_points,
            'earned_points': earned_points
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@login_required
def student_completed_tests(request):
    """
    Get completed tests for a student
    """
    email = request.GET.get('email')
    if not email:
        return Response({'error': 'Email is required.'}, status=400)
    
    try:
        student = Student.objects.get(email=email)
        submissions = Submission.objects.filter(student=student).select_related('test')
        
        results = []
        for submission in submissions:
            results.append({
                'test_id': submission.test.id,
                'test_title': submission.test.name,
                'test_subject': submission.test.subject,
                'submission_id': submission.id,
                'score': float(submission.score) if submission.score else 0,
                'submitted_at': submission.submitted_at,
                'duration': submission.duration
            })
        
        return Response(results)
        
    except Student.DoesNotExist:
        return Response({'error': 'Student not found'}, status=404)

@api_view(['GET'])
@login_required
def submission_detail(request, submission_id):
    role = request.GET.get('role')
    if role == 'teacher':
        pass
    elif role == 'student':
        student_email = request.GET.get('email')
        if not student_email:
            return Response({'error': 'Student email required for access control'}, status=400)
    else:
        return Response({'error': 'Role required (student or teacher)'}, status=400)
    try:
        submission = Submission.objects.select_related('test', 'student').get(id=submission_id)
        if role == 'student' and submission.student.email != student_email:
            return Response({'error': 'Access denied. You can only view your own submissions.'}, status=403)
        answers = SubmissionAnswer.objects.filter(submission=submission).select_related('question')
        questions = []
        for ans in answers:
            q = ans.question
            questions.append({
                'id': q.id,
                'text': q.text,
                'option_a': q.option_a,
                'option_b': q.option_b,
                'option_c': q.option_c,
                'option_d': q.option_d,
                'correct_answer': q.correct_answer,
                'selected_answer': ans.selected_key,
                'is_correct': ans.selected_key == q.correct_answer
            })
        return Response({
            'test': {
                'id': submission.test.id,
                'title': submission.test.name,
                'subject': submission.test.subject,
                'description': getattr(submission.test, 'description', ''),
            },
            'student': {
                'name': submission.student.name,
                'email': submission.student.email,
            },
            'score': float(submission.score) if submission.score else 0,
            'submitted_at': submission.submitted_at,
            'duration': submission.duration,
            'questions': questions
        })
    except Submission.DoesNotExist:
        return Response({'error': 'Submission not found'}, status=404)

@api_view(['GET'])
@login_required
def test_submissions(request):
    test_id = request.GET.get('test_id')
    if not test_id:
        return Response({'error': 'test_id is required'}, status=400)
    
    # Try to get from cache first
    cache_key = f'test_submissions_{test_id}'
    cached_data = cache.get(cache_key)
    if cached_data:
        return Response(cached_data, status=200)
    
    submissions = Submission.objects.filter(test_id=test_id).select_related('student')
    
    # Build a mapping from student email to TestInvite for this test
    invites = {inv.student_email: inv for inv in TestInvite.objects.filter(test_id=test_id)}
    
    results = []
    for s in submissions:
        invite = invites.get(s.student.email)
        results.append({
            'submission_id': s.id,
            'student_id': s.student.id,
            'student_name': s.student.name,
            'student_email': s.student.email,
            'score': float(s.score) if s.score else 0,
            'duration': s.duration,
            'submitted_at': s.submitted_at,
            'scheduled_start': invite.time_to_start if invite else None,
            'scheduled_end': invite.end_time if invite else None,
            'scheduled_duration': invite.duration_minutes if invite else None,
        })
    
    # Sort by score descending for ranking
    results.sort(key=lambda x: x['score'], reverse=True)
    
    data = {'submissions': results}
    
    # Cache for 1 minute
    cache.set(cache_key, data, 60)
    
    return Response(data)

@api_view(['GET'])
@login_required
def test_attendance(request):
    test_id = request.GET.get('test_id')
    if not test_id:
        return Response({'error': 'test_id is required'}, status=400)
    # Get all invited students for this test
    invites = TestInvite.objects.filter(test_id=test_id)
    invited_emails = set(inv.student_email for inv in invites)
    # Get all students who submitted
    submitted_emails = set(Submission.objects.filter(test_id=test_id).values_list('student__email', flat=True))
    # Fetch all students in one query for efficiency
    students = {s.email: s.name for s in Student.objects.filter(email__in=invited_emails)}
    attendance = []
    for inv in invites:
        attendance.append({
            'student_email': inv.student_email,
            'student_name': students.get(inv.student_email, ''),
            'invited': True,
            'submitted': inv.student_email in submitted_emails
        })
    return Response({'attendance': attendance})

@api_view(['GET', 'PUT'])
@login_required
def organization_profile(request):
    if request.method == 'GET':
        org_code = request.GET.get('org_code')
        if not org_code:
            return Response({'error': 'org_code is required'}, status=400)
        try:
            org = Organization.objects.get(org_code=org_code)
            return Response({
                'org_code': org.org_code,
                'name': org.name,
                'website': org.website,
                'email': org.email,
                'phone': org.phone,
                'city': org.city,
                'created_at': org.created_at.isoformat() if org.created_at else None,
            })
        except Organization.DoesNotExist:
            return Response({'error': 'Organization not found'}, status=404)
    
    elif request.method == 'PUT':
        org_code = request.data.get('org_code')
        if not org_code:
            return Response({'error': 'org_code is required'}, status=400)
        
        try:
            org = Organization.objects.get(org_code=org_code)
            
            # Update fields if provided
            if 'name' in request.data:
                org.name = request.data['name']
            if 'website' in request.data:
                org.website = request.data['website']
            if 'email' in request.data:
                org.email = request.data['email']
            if 'phone' in request.data:
                org.phone = request.data['phone']
            if 'city' in request.data:
                org.city = request.data['city']
            
            org.save()
            
            return Response({
                'message': 'Organization profile updated successfully',
                'org_code': org.org_code,
                'name': org.name,
                'website': org.website,
                'email': org.email,
                'phone': org.phone,
                'city': org.city,
                'created_at': org.created_at.isoformat() if org.created_at else None,
            })
        except Organization.DoesNotExist:
            return Response({'error': 'Organization not found'}, status=404)
        except Exception as e:
            return Response({'error': f'Update failed: {str(e)}'}, status=400)

@api_view(['GET'])
def health_check(request):
    """Health check endpoint for monitoring"""
    try:
        # Check database connectivity
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        
        # Check Redis connectivity (skip if Redis not available)
        try:
            cache.set('health_check', 'ok', 60)
            cache_result = cache.get('health_check')
            cache_status = 'connected' if cache_result == 'ok' else 'disconnected'
        except:
            cache_status = 'not_configured'
        
        return Response({
            'status': 'healthy',
            'database': 'connected',
            'cache': cache_status,
            'timestamp': datetime.now().isoformat()
        }, status=200)
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return Response({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }, status=500)

@api_view(['GET'])
@login_required
def teacher_analytics(request):
    """Get analytics data for teacher dashboard"""
    teacher_id = request.GET.get('teacher_id')
    if not teacher_id:
        return Response({'error': 'Teacher ID required'}, status=400)
    
    try:
        teacher = Teacher.objects.get(id=teacher_id)
        
        # Get teacher's tests
        tests = Test.objects.filter(teacher=teacher)
        total_tests = tests.count()
        
        # Count total questions
        total_questions = Question.objects.filter(test__teacher=teacher).count()
        
        # Count students in teacher's organization
        total_students = Student.objects.filter(org=teacher.org).count()
        
        # Calculate average score as a percentage
        submissions = Submission.objects.filter(test__teacher=teacher)
        percent_sum = 0
        percent_count = 0
        for submission in submissions:
            if submission.score is not None:
                test = submission.test
                total_points = Question.objects.filter(test=test).aggregate(Sum('point_value'))['point_value__sum'] or 0
                if total_points > 0:
                    percent = float(submission.score) / float(total_points) * 100
                    percent_sum += percent
                    percent_count += 1
        average_score = round(percent_sum / percent_count, 1) if percent_count > 0 else 0
        
        return Response({
            'total_tests': total_tests,
            'total_questions': total_questions,
            'total_students': total_students,
            'average_score': average_score,
            'total_submissions': submissions.count()
        })
        
    except Teacher.DoesNotExist:
        return Response({'error': 'Teacher not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)

class LogoutView(APIView):
    """Logout endpoint to invalidate server-side sessions"""
    
    def post(self, request):
        # This endpoint is public (for logout), so no role check needed
        email = request.data.get('email')
        user_type = request.data.get('user_type')
        if email and user_type:
            if user_type == 'organization':
                Organization.objects.filter(email=email).update(is_logged_in=False)
            elif user_type == 'teacher':
                Teacher.objects.filter(email=email).update(is_logged_in=False)
            elif user_type == 'student':
                Student.objects.filter(email=email).update(is_logged_in=False)
        # Clear any server-side session data
        if hasattr(request, 'session'):
            request.session.flush()
        
        # Clear any cached user data
        if email and user_type:
            # Clear user-specific cache entries
            cache_key = f"user_{user_type}_{email}"
            cache.delete(cache_key)
            
            # Clear teacher-specific caches if applicable
            if user_type == 'teacher':
                teacher_pk = request.data.get('teacher_pk')
                if teacher_pk:
                    cache.delete(f"teacher_tests_{teacher_pk}")
                    cache.delete(f"teacher_questions_{teacher_pk}")
        
        # Set cache control headers in response
        response = Response({'message': 'Logged out successfully'}, status=status.HTTP_200_OK)
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response

class VerifyAuthView(APIView):
    """Verify if user authentication is still valid"""
    
    def post(self, request):
        # This endpoint is public (for auth verification), so no role check needed
        # Try to get from HTTP headers first (new system)
        email = request.META.get('HTTP_X_USER_EMAIL')
        user_type = request.META.get('HTTP_X_USER_TYPE')
        
        # If not in headers, try to get from request body (fallback)
        if not email or not user_type:
            email = request.data.get('email')
            user_type = request.data.get('user_type')
        
        if not email or not user_type:
            response = Response({'error': 'Email and user_type required'}, status=status.HTTP_400_BAD_REQUEST)
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response
        
        try:
            if user_type == 'organization':
                org = Organization.objects.get(email=email)
                is_valid = org.is_logged_in
            elif user_type == 'teacher':
                teacher = Teacher.objects.get(email=email)
                is_valid = teacher.is_logged_in
            elif user_type == 'student':
                student = Student.objects.get(email=email)
                is_valid = student.is_logged_in
            else:
                is_valid = False
        except (Organization.DoesNotExist, Teacher.DoesNotExist, Student.DoesNotExist):
            is_valid = False
        
        if is_valid:
            response = Response({'valid': True, 'user_type': user_type}, status=status.HTTP_200_OK)
        else:
            response = Response({'valid': False, 'error': 'Invalid authentication'}, status=status.HTTP_401_UNAUTHORIZED)
        
        # Set cache control headers
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        
        return response 