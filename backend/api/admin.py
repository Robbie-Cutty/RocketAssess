from django.contrib import admin
from .models import Organization

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ('org_code', 'name', 'website', 'email', 'phone', 'city', 'created_at')
    search_fields = ('org_code', 'name', 'email', 'city')
    list_filter = ('city',)
