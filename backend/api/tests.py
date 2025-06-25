from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Organization, Teacher, Test, Question, Student, TestInvite, Submission
from django.contrib.auth.hashers import make_password
from datetime import datetime, timedelta
import jwt
from django.conf import settings
import requests
from unittest.mock import patch, MagicMock

class BaseTestCase(APITestCase):
    def setUp(self):
        # Create test organization
        self.org = Organization.objects.create(
            org_code='TEST001',
            name='Test Organization',
            email='test@test.edu',
            website='https://test.edu'
        )
        
        # Create test teacher
        self.teacher = Teacher.objects.create(
            org=self.org,
            teacher_id='T001',
            name='Test Teacher',
            email='teacher@test.edu',
            password=make_password('ValidPass123')
        )
        
        # Create test student
        self.student = Student.objects.create(
            org=self.org,
            student_id='S001',
            name='Test Student',
            email='student@test.edu',
            password=make_password('ValidPass123')
        )
        
        # Create test
        self.test = Test.objects.create(
            teacher=self.teacher,
            name='Test Quiz',
            subject='Mathematics',
            description='A test quiz'
        )
        
        # Create test question
        self.question = Question.objects.create(
            test=self.test,
            text='What is 2+2?',
            option_a='3',
            option_b='4',
            option_c='5',
            option_d='6',
            correct_answer='B',
            point_value=1
        )

    def generate_token(self, user_type, user_data):
        """Generate JWT token for testing"""
        payload = {
            'id': user_data.get('id'),
            'email': user_data.get('email'),
            'user_type': user_type,
            'exp': datetime.utcnow() + timedelta(hours=24),
            'iat': datetime.utcnow()
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')

class OrganizationTests(BaseTestCase):
    @patch('requests.get')
    def test_valid_registration(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        url = reverse('register-organization')
        data = {
            'org_code': 'ROCKET1',
            'name': 'Rocket Assess Org',
            'website': 'https://rocket.edu',
            'email': 'info@rocket.edu',
            'phone': '1234567890',
            'city': 'Toronto'
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print('test_valid_registration error:', response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('message', response.data)

    def test_invalid_website(self):
        url = reverse('register-organization')
        data = {
            'org_code': 'ROCKET2',
            'name': 'Rocket Assess Org 2',
            'website': 'https://rocket.com',
            'email': 'info@rocket.com',
            'phone': '1234567890',
            'city': 'Toronto'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('website', response.data)

    def test_duplicate_org_code(self):
        url = reverse('register-organization')
        data = {
            'org_code': 'TEST001',  # Already exists
            'name': 'Another Org',
            'email': 'another@test.edu'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('org_code', response.data)

    def test_organization_login(self):
        url = reverse('login-organization')
        data = {
            'org_code': 'TEST001',
            'email': 'test@test.edu'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('org', response.data)

class TeacherTests(BaseTestCase):
    def test_teacher_registration(self):
        url = reverse('register-teacher')
        data = {
            'teacher_id': 'T999',
            'name': 'New Teacher',
            'email': 'newteacher@test.edu',
            'password': 'NewPass123',
            'org_code': 'TEST001'
        }
        response = self.client.post(url, data, format='json')
        if response.status_code != status.HTTP_201_CREATED:
            print('test_teacher_registration error:', response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('teacher', response.data)

    def test_teacher_login(self):
        url = reverse('login-teacher')
        data = {
            'email': 'teacher@test.edu',
            'password': 'ValidPass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('teacher', response.data)

    def test_invalid_password(self):
        url = reverse('login-teacher')
        data = {
            'email': 'teacher@test.edu',
            'password': 'WrongPass'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

class StudentTests(BaseTestCase):
    def test_student_registration(self):
        url = reverse('register-student')
        data = {
            'student_id': 'S002',
            'name': 'New Student',
            'email': 'newstudent@test.edu',
            'password': 'NewPass123',
            'org_id': self.org.id,
            'gender': 'Male',
            'grade': '10'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_student_login(self):
        url = reverse('login-student')
        data = {
            'email': 'student@test.edu',
            'password': 'ValidPass123'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)
        self.assertIn('student', response.data)

class TestTests(BaseTestCase):
    def test_create_test(self):
        token = self.generate_token('teacher', {
            'id': self.teacher.id,
            'email': self.teacher.email
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('create-test')
        data = {
            'name': 'New Test',
            'subject': 'Science',
            'description': 'A new test',
            'teacher': self.teacher.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_list_tests(self):
        token = self.generate_token('teacher', {
            'id': self.teacher.id,
            'email': self.teacher.email
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('list-tests')
        response = self.client.get(url, {'teacher_id': self.teacher.id})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

class QuestionTests(BaseTestCase):
    def test_create_question(self):
        token = self.generate_token('teacher', {
            'id': self.teacher.id,
            'email': self.teacher.email
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('create-question')
        data = {
            'text': 'What is the capital of France?',
            'option_a': 'London',
            'option_b': 'Paris',
            'option_c': 'Berlin',
            'option_d': 'Madrid',
            'correct_answer': 'B',
            'point_value': 1,
            'test': self.test.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_duplicate_question_validation(self):
        token = self.generate_token('teacher', {
            'id': self.teacher.id,
            'email': self.teacher.email
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('create-question')
        data = {
            'text': 'What is 2+2?',  # Same as existing question
            'option_a': '3',
            'option_b': '4',
            'option_c': '5',
            'option_d': '6',
            'correct_answer': 'B',
            'point_value': 1,
            'test': self.test.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class TestInviteTests(BaseTestCase):
    def test_create_test_invite(self):
        token = self.generate_token('teacher', {
            'id': self.teacher.id,
            'email': self.teacher.email
        })
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        
        url = reverse('invite-test')
        data = {
            'teacher_name': 'Test Teacher',
            'students': ['student@test.edu'],
            'time_to_start': (datetime.now() + timedelta(hours=1)).isoformat(),
            'duration_minutes': 60,
            'title': 'Test Invite',
            'subject': 'Mathematics',
            'point_value': 10,
            'test_id': self.test.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('results', response.data)

class SubmissionTests(BaseTestCase):
    def setUp(self):
        super().setUp()
        # Create test invite
        self.invite = TestInvite.objects.create(
            test=self.test,
            teacher_name='Test Teacher',
            student_email='student@test.edu',
            time_to_start=datetime.now() - timedelta(hours=1),
            duration_minutes=60,
            title='Test Quiz',
            subject='Mathematics',
            point_value=10,
            end_time=datetime.now() + timedelta(hours=1)
        )

    def test_submit_test(self):
        url = reverse('submit-test')
        data = {
            'test_id': self.test.id,
            'student_email': 'student@test.edu',
            'answers': {str(self.question.id): 'B'},
            'duration': 300
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('score', response.data)

    def test_duplicate_submission(self):
        # Create first submission
        submission = Submission.objects.create(
            test=self.test,
            student=self.student,
            score=100.0
        )
        
        url = reverse('submit-test')
        data = {
            'test_id': self.test.id,
            'student_email': 'student@test.edu',
            'answers': {str(self.question.id): 'B'},
            'duration': 300
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

class SecurityTests(BaseTestCase):
    def test_unauthorized_access(self):
        """Test that unauthorized users cannot access protected endpoints"""
        url = reverse('list-tests')
        response = self.client.get(url, {'teacher_id': self.teacher.id})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token(self):
        """Test that invalid tokens are rejected"""
        self.client.credentials(HTTP_AUTHORIZATION='Bearer invalid-token')
        url = reverse('list-tests')
        response = self.client.get(url, {'teacher_id': self.teacher.id})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_xss_protection(self):
        """Test that XSS attempts are sanitized"""
        url = reverse('create-question')
        data = {
            'text': '<script>alert("xss")</script>What is 2+2?',
            'option_a': '3',
            'option_b': '4',
            'option_c': '5',
            'option_d': '6',
            'correct_answer': 'B',
            'point_value': 1,
            'test': self.test.id
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Verify the script tag was escaped
        question = Question.objects.filter(text__contains='What is 2+2?').first()
        if question:
            self.assertIn('&lt;script&gt;', question.text)

class ValidationTests(BaseTestCase):
    def test_password_validation(self):
        """Test password strength validation"""
        url = reverse('register-teacher')
        data = {
            'name': 'Test Teacher',
            'email': 'test@test.edu',
            'password': 'weak',  # Too weak
            'org_code': 'TEST001'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password', response.data)

    def test_email_validation(self):
        """Test email format validation"""
        url = reverse('register-teacher')
        data = {
            'name': 'Test Teacher',
            'email': 'invalid-email',
            'password': 'ValidPass123',
            'org_code': 'TEST001'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('email', response.data)

    def test_org_code_validation(self):
        """Test organization code format validation"""
        url = reverse('register-organization')
        data = {
            'org_code': 'INVALID!',  # Contains special characters
            'name': 'Test Org',
            'email': 'test@test.edu'
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('org_code', response.data)
