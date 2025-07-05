from django.contrib import admin
from .models import Organization, Teacher, Student, Test, Question, Submission, SubmissionAnswer, TestInvite, StudentInvite

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('org_code', 'name', 'website', 'email', 'phone', 'city', 'created_at')
    search_fields = ('org_code', 'name', 'email', 'city')
    list_filter = ('city',)

@admin.register(Teacher)
class TeacherAdmin(admin.ModelAdmin):
    list_display = ('teacher_id', 'name', 'email', 'org', 'created_at')
    search_fields = ('teacher_id', 'name', 'email')
    list_filter = ('org',)

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('student_id', 'name', 'email', 'org', 'grade', 'created_at')
    search_fields = ('student_id', 'name', 'email')
    list_filter = ('org', 'grade')

@admin.register(Test)
class TestAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'subject', 'teacher', 'created_at')
    search_fields = ('name', 'subject')
    list_filter = ('teacher', 'subject')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'text', 'test', 'point_value')
    search_fields = ('text',)
    list_filter = ('test',)

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ('id', 'test', 'student', 'score', 'submitted_at')
    search_fields = ('test__name', 'student__name', 'student__email')
    list_filter = ('test', 'student')

@admin.register(SubmissionAnswer)
class SubmissionAnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'submission', 'question', 'selected_key')
    search_fields = ('question__text',)
    list_filter = ('submission', 'question')

@admin.register(TestInvite)
class TestInviteAdmin(admin.ModelAdmin):
    list_display = ('id', 'test', 'teacher_name', 'student_email', 'title', 'subject', 'created_at', 'added_to_tests')
    search_fields = ('student_email', 'teacher_name', 'title')
    list_filter = ('test', 'subject', 'added_to_tests')

@admin.register(StudentInvite)
class StudentInviteAdmin(admin.ModelAdmin):
    list_display = ('id', 'teacher', 'email', 'created_at')
    search_fields = ('email', 'teacher__name')
    list_filter = ('teacher',)
