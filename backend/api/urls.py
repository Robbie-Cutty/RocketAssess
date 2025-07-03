from django.urls import path
from . import views

urlpatterns = [
    # Health check
    path('health/', views.health_check, name='health-check'),
    
    # Authentication endpoints
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('verify-auth/', views.VerifyAuthView.as_view(), name='verify-auth'),
    
    # Organization endpoints
    path('register-organization/', views.OrganizationRegisterView.as_view(), name='register-organization'),
    path('login-organization/', views.OrganizationLoginView.as_view(), name='login-organization'),
    path('invite-teachers/', views.TeacherInviteView.as_view(), name='invite-teachers'),
    path('teachers/', views.TeacherListView.as_view(), name='list-teachers'),
    
    # Teacher endpoints
    path('register-teacher/', views.TeacherRegisterView.as_view(), name='register-teacher'),
    path('login-teacher/', views.TeacherLoginView.as_view(), name='login-teacher'),
    
    # Test endpoints
    path('test-create/', views.TestCreateView.as_view(), name='create-test'),
    path('test-list/', views.TestListView.as_view(), name='list-tests'),
    
    # Question endpoints
    path('question-create/', views.QuestionCreateView.as_view(), name='create-question'),
    path('question-list/', views.QuestionListView.as_view(), name='list-questions'),
    path('questions/<int:pk>/', views.QuestionDetailView.as_view(), name='question-detail'),
    path('question-pool/', views.QuestionPoolView.as_view(), name='question-pool'),
    path('deduplicate-questions/', views.deduplicate_questions, name='deduplicate-questions'),
    
    # Student endpoints
    path('students/register/', views.StudentRegisterView.as_view(), name='register-student'),
    path('login-student/', views.StudentLoginView.as_view(), name='login-student'),
    path('invite-students/', views.StudentInviteView.as_view(), name='invite-students'),
    path('organization-lookup/', views.organization_lookup, name='organization-lookup'),
    path('student-profile/', views.student_profile, name='student-profile'),
    path('invited-students/', views.invited_students, name='invited-students'),
    path('teacher-students/', views.teacher_students, name='teacher-students'),
    
    # Test invite and submission endpoints
    path('invite-test/', views.invite_test, name='invite-test'),
    path('test-detail/', views.test_detail, name='test-detail'),
    path('list-test-invites/', views.list_test_invites, name='list-test-invites'),
    path('test-invites/', views.list_test_invites, name='test-invites-alias'),
    path('student-test-invites/', views.student_test_invites, name='student-test-invites'),
    path('mark-invite-added/', views.mark_invite_added, name='mark-invite-added'),
    path('submit-test/', views.submit_test, name='submit-test'),
    path('student-completed-tests/', views.student_completed_tests, name='student-completed-tests'),
    path('submission-detail/<int:submission_id>/', views.submission_detail, name='submission-detail'),
    path('test-submissions/', views.test_submissions, name='test-submissions'),
    path('test-attendance/', views.test_attendance, name='test-attendance'),
    
    # Profile endpoints
    path('organization-profile/', views.organization_profile, name='organization-profile'),
    path('teacher-org-info/', views.teacher_org_info, name='teacher-org-info'),
    path('teacher-analytics/', views.teacher_analytics, name='teacher-analytics'),
    
    path('start-test/', views.start_test, name='start-test'),
]
