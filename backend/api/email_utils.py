from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def send_teacher_invite_email(email, invite_link):
    """
    Send teacher invitation email
    
    Args:
        email: Teacher's email address
        invite_link: Registration link for the teacher
    """
    subject = 'You are invited to join Rocket Assess as a Teacher'
    html_message = f"""
    <html><body>
    <p>Hello,</p>
    <p>You have been invited to join Rocket Assess as a teacher. Click the link below to complete your registration:</p>
    <p><a href='{invite_link}'>{invite_link}</a></p>
    <p>If you did not expect this invitation, you can ignore this email.</p>
    <p>Best regards,<br>Rocket Assess Team</p>
    </body></html>
    """
    
    try:
        send_mail(
            subject,
            '',  # plain text message (optional)
            f"Rocket Assess <{settings.EMAIL_HOST_USER}>",
            [email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send teacher invite email to {email}: {e}")
        return False


def send_student_invite_email(email, invite_link):
    """
    Send student invitation email
    
    Args:
        email: Student's email address
        invite_link: Registration link for the student
    """
    subject = 'You are invited to join Rocket Assess as a Student'
    html_message = f"""
    <html><body>
    <p>Hello,</p>
    <p>You have been invited to join Rocket Assess as a student. Click the link below to complete your registration:</p>
    <p><a href='{invite_link}'>{invite_link}</a></p>
    <p>If you did not expect this invitation, you can ignore this email.</p>
    <p>Best regards,<br>Rocket Assess Team</p>
    </body></html>
    """
    
    try:
        send_mail(
            subject,
            '',  # plain text message (optional)
            f"Rocket Assess <{settings.EMAIL_HOST_USER}>",
            [email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send student invite email to {email}: {e}")
        return False


def send_welcome_email(user, user_type):
    """
    Send welcome email to newly registered users
    
    Args:
        user: User object (Organization, Teacher, or Student)
        user_type: Type of user
    """
    
    if user_type == 'organization':
        subject = f"Welcome to Rocket Assess, {user.name}!"
        html_message = f"""
        <html>
        <body>
            <h2>Welcome to <span style='color:#2563eb;'>Rocket Assess</span>!</h2>
            <p>Dear <b>{user.name}</b>,</p>
            <p>Your organization has been successfully registered with the following details:</p>
            <ul>
                <li><b>Organization Code:</b> {user.org_code}</li>
                <li><b>Organization Name:</b> {user.name}</li>
                <li><b>Website:</b> {user.website or 'N/A'}</li>
                <li><b>City:</b> {user.city or 'N/A'}</li>
            </ul>
            <p>You can now invite teachers and students to join your organization and start using Rocket Assess for online assessments.</p>
            <p style='margin-top:2em;'>Best regards,<br><b>Rocket Assess Team</b></p>
        </body>
        </html>
        """
        
        try:
            send_mail(
                subject,
                '',  # plain text message (optional)
                f"Rocket Assess",
                [user.email],
                html_message=html_message,
                fail_silently=False,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {e}")
            return False
    
    return True


def send_test_invite_email(student_email, test_title, teacher_name, start_time, duration):
    """
    Send test invitation email to students
    
    Args:
        student_email: Student's email address
        test_title: Title of the test
        teacher_name: Name of the teacher
        start_time: Test start time
        duration: Test duration in minutes
    """
    subject = f'Test Invitation: {test_title}'
    html_message = f"""
    <html><body>
    <p>Hello,</p>
    <p>You have been invited to take a test by {teacher_name}.</p>
    <p><b>Test Details:</b></p>
    <ul>
        <li><b>Test:</b> {test_title}</li>
        <li><b>Start Time:</b> {start_time}</li>
        <li><b>Duration:</b> {duration} minutes</li>
    </ul>
    <p>Please log in to your student account to access the test.</p>
    <p>Best regards,<br>Rocket Assess Team</p>
    </body></html>
    """
    
    try:
        send_mail(
            subject,
            '',  # plain text message (optional)
            f"Rocket Assess <{settings.EMAIL_HOST_USER}>",
            [student_email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send test invite email to {student_email}: {e}")
        return False 