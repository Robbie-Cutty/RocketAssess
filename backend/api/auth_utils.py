from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import check_password
from .models import Organization, Teacher, Student
from functools import wraps


def authenticate_user(user_type, email, password=None, org_code=None):
    """
    Generic authentication function for all user types
    
    Args:
        user_type: 'organization', 'teacher', or 'student'
        email: User's email
        password: User's password (required for teacher/student)
        org_code: Organization code (required for organization)
    
    Returns:
        tuple: (user_object, error_response) - if error_response is not None, authentication failed
    """
    
    if user_type == 'organization':
        if not org_code:
            return None, Response(
                {'error': 'Organization code and email are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            org = Organization.objects.get(org_code=org_code, email=email)
            return org, None
        except Organization.DoesNotExist:
            return None, Response(
                {'error': 'Invalid organization code or email.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    elif user_type == 'teacher':
        if not password:
            return None, Response(
                {'error': 'Email and password are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            teacher = Teacher.objects.get(email=email)
            if not check_password(password, teacher.password):
                return None, Response(
                    {'error': 'Invalid email or password.'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            return teacher, None
        except Teacher.DoesNotExist:
            return None, Response(
                {'error': 'Invalid email or password.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    elif user_type == 'student':
        if not password:
            return None, Response(
                {'error': 'Email and password are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            student = Student.objects.get(email=email)
            if not check_password(password, student.password):
                return None, Response(
                    {'error': 'Invalid email or password.'}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )
            return student, None
        except Student.DoesNotExist:
            return None, Response(
                {'error': 'Invalid email or password.'}, 
                status=status.HTTP_401_UNAUTHORIZED
            )
    
    else:
        return None, Response(
            {'error': 'Invalid user type.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )


def get_user_response_data(user, user_type):
    """
    Get standardized response data for authenticated users
    
    Args:
        user: User object (Organization, Teacher, or Student)
        user_type: Type of user
    
    Returns:
        dict: Standardized response data
    """
    
    if user_type == 'organization':
        return {
            'org': {
                'org_code': user.org_code,
                'name': user.name,
                'email': user.email,
                'website': user.website,
                'city': user.city,
            }
        }
    
    elif user_type == 'teacher':
        return {
            'teacher': {
                'id': user.id,
                'teacher_id': user.teacher_id,
                'name': user.name,
                'email': user.email,
                'org_id': user.org_id,
            }
        }
    
    elif user_type == 'student':
        return {
            'student': {
                'id': user.id,
                'student_id': user.student_id,
                'name': user.name,
                'email': user.email,
                'org_id': user.org_id,
            }
        }
    
    return {}


def login_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        # Handle both function-based views and class-based views
        if hasattr(request, 'request'):
            # Class-based view (APIView) - request is the view instance, request.request is the actual request
            actual_request = request.request
        else:
            # Function-based view - request is the actual request
            actual_request = request
            
        # Get email and user_type from HTTP headers first (new system)
        email = actual_request.META.get('HTTP_X_USER_EMAIL')
        user_type = actual_request.META.get('HTTP_X_USER_TYPE')
        
        # Fallback to request data or query params (old system)
        if not email or not user_type:
            if hasattr(actual_request, 'data'):
                email = actual_request.data.get('email')
                user_type = actual_request.data.get('user_type')
            
            if not email or not user_type:
                # Try query parameters for GET requests
                if hasattr(actual_request, 'query_params'):
                    email = email or actual_request.query_params.get('email')
                    user_type = user_type or actual_request.query_params.get('user_type')
                elif hasattr(actual_request, 'GET'):
                    email = email or actual_request.GET.get('email')
                    user_type = user_type or actual_request.GET.get('user_type')
        
        if not email or not user_type:
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        user = None
        if user_type == 'organization':
            user = Organization.objects.filter(email=email).first()
        elif user_type == 'teacher':
            user = Teacher.objects.filter(email=email).first()
        elif user_type == 'student':
            user = Student.objects.filter(email=email).first()
        
        if not user or not getattr(user, 'is_logged_in', False):
            return Response({'error': 'Authentication required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        return view_func(request, *args, **kwargs)
    return _wrapped_view 