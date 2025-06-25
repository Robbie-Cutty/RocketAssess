from rest_framework import serializers
from .models import Organization, Teacher, Test, Question
import re
import requests
from django.core.validators import EmailValidator
from django.core.exceptions import ValidationError
import html

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'

    def validate_website(self, value):
        if value:
            # Sanitize input
            value = html.escape(value.strip())
            # Only allow .edu, .org, .ca domains
            if not re.search(r'\.(edu|org|ca)(/|$)', value):
                raise serializers.ValidationError('Website must end with .edu, .org, or .ca')
            # Check if the website is reachable
            try:
                resp = requests.get(value, timeout=5)
                if resp.status_code != 200:
                    raise serializers.ValidationError('Website is not reachable (status code {}).'.format(resp.status_code))
            except Exception:
                raise serializers.ValidationError('Website is not reachable or does not exist.')
        return value

    def validate_org_code(self, value):
        # Sanitize and validate org code
        value = html.escape(value.strip().upper())
        if not re.match(r'^[A-Z0-9]{3,10}$', value):
            raise serializers.ValidationError('Organization code must be 3-10 characters, letters and numbers only.')
        if Organization.objects.filter(org_code=value).exists():
            raise serializers.ValidationError('Organization code already exists.')
        return value

    def validate_name(self, value):
        # Sanitize organization name
        value = html.escape(value.strip())
        if len(value) < 2 or len(value) > 100:
            raise serializers.ValidationError('Organization name must be between 2 and 100 characters.')
        if Organization.objects.filter(name=value).exists():
            raise serializers.ValidationError('Organization name already exists.')
        return value

    def validate_email(self, value):
        if value:
            value = value.strip().lower()
            email_validator = EmailValidator()
            try:
                email_validator(value)
            except ValidationError:
                raise serializers.ValidationError('Invalid email format.')
        return value

    def validate_phone(self, value):
        if value:
            # Sanitize phone number
            value = re.sub(r'[^\d+\-\(\)\s]', '', value.strip())
            if len(value) < 10:
                raise serializers.ValidationError('Phone number must be at least 10 digits.')
        return value

class TeacherSerializer(serializers.ModelSerializer):
    org_code = serializers.CharField(write_only=True, required=False)
    org = serializers.PrimaryKeyRelatedField(queryset=Organization.objects.all(), required=False)

    class Meta:
        model = Teacher
        fields = '__all__'

    def validate(self, data):
        org = data.get('org')
        org_code = data.get('org_code')
        if not org and not org_code:
            raise serializers.ValidationError('Either org or org_code must be provided.')
        if not org and org_code:
            try:
                data['org'] = Organization.objects.get(org_code=org_code)
            except Organization.DoesNotExist:
                raise serializers.ValidationError('Organization with this code does not exist.')
        return data

    def create(self, validated_data):
        validated_data.pop('org_code', None)
        return super().create(validated_data)

    def validate_name(self, value):
        value = html.escape(value.strip())
        if len(value) < 2 or len(value) > 100:
            raise serializers.ValidationError('Name must be between 2 and 100 characters.')
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        email_validator = EmailValidator()
        try:
            email_validator(value)
        except ValidationError:
            raise serializers.ValidationError('Invalid email format.')
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters long.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter.')
        if not re.search(r'\d', value):
            raise serializers.ValidationError('Password must contain at least one number.')
        return value

    def validate_teacher_id(self, value):
        value = html.escape(value.strip())
        if not re.match(r'^[A-Z0-9]{3,20}$', value):
            raise serializers.ValidationError('Teacher ID must be 3-20 characters, letters and numbers only.')
        return value

class TestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Test
        fields = '__all__'

    def validate_name(self, value):
        value = html.escape(value.strip())
        if len(value) < 3 or len(value) > 200:
            raise serializers.ValidationError('Test name must be between 3 and 200 characters.')
        return value

    def validate_subject(self, value):
        if value:
            value = html.escape(value.strip())
            if len(value) > 100:
                raise serializers.ValidationError('Subject must be 100 characters or less.')
        return value

    def validate_description(self, value):
        if value:
            value = html.escape(value.strip())
            if len(value) > 1000:
                raise serializers.ValidationError('Description must be 1000 characters or less.')
        return value

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'

    def validate_text(self, value):
        value = html.escape(value.strip())
        if len(value) < 1 or len(value) > 1000:
            raise serializers.ValidationError('Question text must be between 1 and 1000 characters.')
        return value

    def validate_option_a(self, value):
        value = html.escape(value.strip())
        if len(value) < 1 or len(value) > 255:
            raise serializers.ValidationError('Option A must be between 1 and 255 characters.')
        return value

    def validate_option_b(self, value):
        value = html.escape(value.strip())
        if len(value) < 1 or len(value) > 255:
            raise serializers.ValidationError('Option B must be between 1 and 255 characters.')
        return value

    def validate_option_c(self, value):
        value = html.escape(value.strip())
        if len(value) < 1 or len(value) > 255:
            raise serializers.ValidationError('Option C must be between 1 and 255 characters.')
        return value

    def validate_option_d(self, value):
        value = html.escape(value.strip())
        if len(value) < 1 or len(value) > 255:
            raise serializers.ValidationError('Option D must be between 1 and 255 characters.')
        return value

    def validate_correct_answer(self, value):
        if value not in ['A', 'B', 'C', 'D']:
            raise serializers.ValidationError('Correct answer must be A, B, C, or D.')
        return value

    def validate_point_value(self, value):
        if value < 1 or value > 100:
            raise serializers.ValidationError('Point value must be between 1 and 100.')
        return value

    def validate(self, data):
        # Ensure all options are different
        options = [data.get('option_a'), data.get('option_b'), data.get('option_c'), data.get('option_d')]
        if len(set(options)) != 4:
            raise serializers.ValidationError('All options must be different.')
        return data
