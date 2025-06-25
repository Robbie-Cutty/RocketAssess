from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError
from .models import Organization, Teacher, Student
from .email_utils import send_welcome_email
import re


def validate_registration_data(data, user_type):
    """
    Validate registration data for different user types
    
    Args:
        data: Registration data
        user_type: 'organization', 'teacher', or 'student'
    
    Returns:
        tuple: (validated_data, error_response) - if error_response is not None, validation failed
    """
    
    if user_type == 'organization':
        required_fields = ['org_code', 'name']
        for field in required_fields:
            if not data.get(field):
                return None, Response(
                    {'error': f'{field.replace("_", " ").title()} is required.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check for existing organization
        if Organization.objects.filter(org_code=data['org_code']).exists():
            return None, Response(
                {'error': 'Organization code already exists.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return data, None
    
    elif user_type == 'teacher':
        required_fields = ['name', 'email', 'password', 'org_code']
        for field in required_fields:
            if not data.get(field):
                return None, Response(
                    {'error': f'{field.replace("_", " ").title()} is required.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check for existing teacher
        if Teacher.objects.filter(email=data['email']).exists():
            return None, Response(
                {'error': 'Email already registered.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate organization exists
        try:
            org = Organization.objects.get(org_code=data['org_code'])
            data['org'] = org
        except Organization.DoesNotExist:
            return None, Response(
                {'error': 'Organization not found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        return data, None
    
    elif user_type == 'student':
        required_fields = ['student_id', 'name', 'email', 'password', 'org_id']
        for field in required_fields:
            if not data.get(field):
                return None, Response(
                    {'error': f'{field.replace("_", " ").title()} is required.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Check for existing student
        if Student.objects.filter(email=data['email']).exists():
            return None, Response(
                {'error': 'Email already registered.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if Student.objects.filter(student_id=data['student_id']).exists():
            return None, Response(
                {'error': 'Student ID already registered.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate organization exists
        try:
            org = Organization.objects.get(id=data['org_id'])
            data['org'] = org
        except Organization.DoesNotExist:
            return None, Response(
                {'error': 'Organization not found.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        return data, None
    
    return None, Response(
        {'error': 'Invalid user type.'}, 
        status=status.HTTP_400_BAD_REQUEST
    )


def create_user(data, user_type):
    """
    Create user object based on user type
    
    Args:
        data: Validated registration data
        user_type: 'organization', 'teacher', or 'student'
    
    Returns:
        tuple: (user_object, error_response) - if error_response is not None, creation failed
    """
    
    try:
        if user_type == 'organization':
            user = Organization.objects.create(
                org_code=data['org_code'],
                name=data['name'],
                website=data.get('website', ''),
                email=data.get('email', ''),
                phone=data.get('phone', ''),
                city=data.get('city', '')
            )
            
            # Send welcome email if email is provided
            if user.email:
                send_welcome_email(user, 'organization')
            
            return user, None
        
        elif user_type == 'teacher':
            user = Teacher.objects.create(
                org=data['org'],
                teacher_id=data.get('teacher_id', f"T{Teacher.objects.count() + 1}"),
                name=data['name'],
                email=data['email'],
                password=make_password(data['password']),
                gender=data.get('gender', '')
            )
            
            return user, None
        
        elif user_type == 'student':
            user = Student.objects.create(
                org=data['org'],
                invited_by=data.get('invited_by'),
                student_id=data['student_id'],
                name=data['name'],
                email=data['email'],
                password=make_password(data['password']),
                gender=data.get('gender', ''),
                grade=data.get('grade', '')
            )
            
            return user, None
    
    except IntegrityError as e:
        return None, Response(
            {'error': 'Database error: ' + str(e)}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    except Exception as e:
        return None, Response(
            {'error': 'Unexpected error: ' + str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def get_registration_response(user, user_type):
    """
    Get standardized registration response data
    
    Args:
        user: Created user object
        user_type: Type of user
    
    Returns:
        dict: Standardized response data
    """
    
    if user_type == 'organization':
        return {
            'message': 'Organization registered successfully.',
        }
    
    elif user_type == 'teacher':
        return {
            'message': 'Teacher registered successfully.',
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
            'message': 'Student registered successfully.',
            'student': {
                'id': user.id,
                'student_id': user.student_id,
                'name': user.name,
                'email': user.email,
                'org_id': user.org_id,
            }
        }
    
    return {'message': 'Registration successful.'} 