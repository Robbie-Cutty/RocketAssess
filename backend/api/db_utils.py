from django.core.cache import cache
from django.db.models import Prefetch
from .models import Test, Question, Teacher, Student, TestInvite
import logging

logger = logging.getLogger(__name__)


def get_cached_teacher_tests(teacher_id, cache_duration=300):
    """
    Get teacher's tests with caching
    
    Args:
        teacher_id: Teacher's ID
        cache_duration: Cache duration in seconds (default: 5 minutes)
    
    Returns:
        list: List of test data
    """
    cache_key = f'teacher_tests_{teacher_id}'
    tests = cache.get(cache_key)
    
    if tests is None:
        try:
            teacher = Teacher.objects.get(id=teacher_id)
            tests = Test.objects.filter(teacher=teacher).order_by('-created_at').values(
                'id', 'name', 'subject', 'description', 'created_at'
            )
            tests = list(tests)
            # Cache for specified duration
            cache.set(cache_key, tests, cache_duration)
        except Teacher.DoesNotExist:
            return None
    
    return tests


def get_cached_test_questions(test_id, cache_duration=600):
    """
    Get test questions with caching
    
    Args:
        test_id: Test ID
        cache_duration: Cache duration in seconds (default: 10 minutes)
    
    Returns:
        list: List of question data
    """
    cache_key = f'test_questions_{test_id}'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    questions = Question.objects.filter(test_id=test_id).order_by('created_at')
    data = [
        {
            'id': q.id,
            'text': q.text,
            'option_a': q.option_a,
            'option_b': q.option_b,
            'option_c': q.option_c,
            'option_d': q.option_d,
            'correct_answer': q.correct_answer,
            'point_value': q.point_value,
        }
        for q in questions
    ]
    
    # Cache for specified duration
    cache.set(cache_key, data, cache_duration)
    
    return data


def get_cached_question_pool(teacher_id, subject=None, page=1, page_size=10, cache_duration=300):
    """
    Get question pool with caching and pagination
    
    Args:
        teacher_id: Teacher's ID
        subject: Subject filter (optional)
        page: Page number (default: 1)
        page_size: Page size (default: 10)
        cache_duration: Cache duration in seconds (default: 5 minutes)
    
    Returns:
        dict: Paginated question data
    """
    cache_key = f'question_pool_{teacher_id}_{subject}_{page}_{page_size}'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    try:
        questions_qs = Question.objects.filter(
            test__teacher__id=int(teacher_id)
        ).select_related('test').order_by('-created_at').distinct()
        
        if subject:
            questions_qs = questions_qs.filter(test__subject=subject)
        
        total = questions_qs.count()
        start = (page - 1) * page_size
        end = start + page_size
        questions = questions_qs[start:end]
        
        data = {
            'results': [
                {
                    'id': q.id,
                    'text': q.text,
                    'option_a': q.option_a,
                    'option_b': q.option_b,
                    'option_c': q.option_c,
                    'option_d': q.option_d,
                    'correct_answer': q.correct_answer,
                    'point_value': q.point_value,
                    'test_name': q.test.name,
                    'test_subject': q.test.subject,
                }
                for q in questions
            ],
            'total': total,
            'page': page,
            'page_size': page_size,
            'total_pages': (total + page_size - 1) // page_size
        }
        
        # Cache for specified duration
        cache.set(cache_key, data, cache_duration)
        
        return data
    except ValueError:
        return None


def clear_teacher_cache(teacher_id):
    """
    Clear all cache entries for a specific teacher
    
    Args:
        teacher_id: Teacher's ID
    """
    cache_keys = [
        f'teacher_tests_{teacher_id}',
        f'question_pool_{teacher_id}_*',
    ]
    
    for key in cache_keys:
        if '*' in key:
            # Handle wildcard keys (would need more sophisticated cache clearing)
            pass
        else:
            cache.delete(key)


def clear_test_cache(test_id):
    """
    Clear cache entries for a specific test
    
    Args:
        test_id: Test's ID
    """
    cache_key = f'test_questions_{test_id}'
    cache.delete(cache_key)


def get_organization_teachers(org_code):
    """
    Get all teachers for an organization
    
    Args:
        org_code: Organization code
    
    Returns:
        list: List of teacher data
    """
    try:
        org = Organization.objects.get(org_code=org_code)
        teachers = Teacher.objects.filter(org=org).values(
            'id', 'teacher_id', 'name', 'email', 'gender', 'created_at'
        )
        return list(teachers)
    except Organization.DoesNotExist:
        return None


def get_organization_students(org_id):
    """
    Get all students for an organization
    
    Args:
        org_id: Organization ID
    
    Returns:
        list: List of student data
    """
    try:
        students = Student.objects.filter(org_id=org_id).order_by('name').values(
            'id', 'student_id', 'name', 'email', 'gender', 'grade', 'created_at'
        )
        return list(students)
    except Exception:
        return None


def check_duplicate_question(test_id, question_text):
    """
    Check if a question already exists in a test
    
    Args:
        test_id: Test ID
        question_text: Question text to check
    
    Returns:
        bool: True if duplicate exists, False otherwise
    """
    return Question.objects.filter(
        test_id=test_id,
        text__iexact=question_text.strip()
    ).exists()


def deduplicate_questions_for_test(test_id):
    """
    Remove duplicate questions for a specific test
    
    Args:
        test_id: Test ID
    
    Returns:
        int: Number of duplicates removed
    """
    deleted = 0
    seen = {}
    
    questions = Question.objects.filter(test_id=test_id).order_by('created_at')
    for question in questions:
        key = question.text.strip().lower()
        if key in seen:
            question.delete()
            deleted += 1
        else:
            seen[key] = question.id
    
    return deleted 