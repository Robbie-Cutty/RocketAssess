from django.urls import path, include
from django.http import JsonResponse

urlpatterns = [
    path('', lambda request: JsonResponse({
        'message': 'Welcome to the Rocket Assess API!',
        'endpoints': {
            'register_organization': '/api/register-organization/'
        }
    })),
    path('api/', include('api.urls')),
]
