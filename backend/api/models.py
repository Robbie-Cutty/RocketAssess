from django.db import models
from datetime import datetime

class Organization(models.Model):
    org_code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    website = models.CharField(max_length=255, blank=True, null=True)
    email = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_logged_in = models.BooleanField(default=False)

    class Meta:
        db_table = 'organizations'

    def __str__(self):
        return f"{self.name} ({self.org_code})"

class Teacher(models.Model):
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='teachers')
    teacher_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=128)
    gender = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_logged_in = models.BooleanField(default=False)

    class Meta:
        db_table = 'teachers'

    def __str__(self):
        return f"{self.name} ({self.teacher_id})"

class Test(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='tests')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    subject = models.CharField(max_length=100, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tests'

    def __str__(self):
        return f"{self.name} (by {self.teacher.name})"

class Question(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='questions')
    text = models.TextField()
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    correct_answer = models.CharField(max_length=1, choices=[('A','A'),('B','B'),('C','C'),('D','D')])
    point_value = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'questions'

    def __str__(self):
        return f"Q: {self.text[:30]}... (Test: {self.test.name})"

class Student(models.Model):
    org = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='students')
    invited_by = models.ForeignKey('Teacher', null=True, blank=True, on_delete=models.SET_NULL, related_name='invited_students')
    student_id = models.CharField(max_length=20, unique=True)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    password = models.CharField(max_length=128)
    gender = models.CharField(max_length=10, blank=True, null=True)
    grade = models.CharField(max_length=10, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_logged_in = models.BooleanField(default=False)

    class Meta:
        db_table = 'students'

    def __str__(self):
        return f"{self.name} ({self.student_id})"

class StudentInvite(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    email = models.EmailField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('teacher', 'email')

class TestInvite(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='invites', null=True, blank=True)
    teacher_name = models.CharField(max_length=255)
    student_email = models.EmailField(null=True, blank=True)
    time_to_start = models.DateTimeField()
    duration_minutes = models.IntegerField()
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    subject = models.CharField(max_length=100)
    point_value = models.IntegerField()
    end_time = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    added_to_tests = models.BooleanField(default=False)

    class Meta:
        db_table = 'test_invites'
        indexes = [
            models.Index(fields=['time_to_start']),
            models.Index(fields=['student_email']),
        ]
        unique_together = (('test', 'student_email'),)

    def __str__(self):
        return f"Test: {self.title} for {self.teacher_name} (Student: {self.student_email or 'Not assigned'})"

class Submission(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='submissions')
    entered_at = models.DateTimeField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    duration = models.IntegerField(null=True, blank=True)
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)

    class Meta:
        db_table = 'submissions'

class SubmissionAnswer(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_key = models.CharField(max_length=5)

    class Meta:
        db_table = 'submission_answers'
