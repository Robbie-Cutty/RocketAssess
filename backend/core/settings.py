import os
import environ
from pathlib import Path
import dj_database_url

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(os.path.join(BASE_DIR, '../.env'))

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = env('SECRET_KEY', default='django-insecure-default-key-for-testing-only')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = env.bool('DEBUG', default=False)

# Update allowed hosts for production
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '192.168.1.71',  # Add your local IP
    # Add your production domain here
    env('ALLOWED_HOST', default=''),
    # Railway domains
    '.railway.app',
    '.up.railway.app',
    # DigitalOcean App Platform domains
    '.ondigitalocean.app',
    # Render.com domains
    '.onrender.com',
    'rocketassess.onrender.com',
    # Add any other domains you'll use
]

# Remove empty strings from ALLOWED_HOSTS
ALLOWED_HOSTS = [host for host in ALLOWED_HOSTS if host]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'api',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

# Database Configuration - Support both PostgreSQL (Render) and MySQL (Railway)
DATABASES = {
    'default': dj_database_url.config(
        default=f"postgresql://{env('DB_USER', default='postgres')}:{env('DB_PASSWORD', default='password')}@{env('DB_HOST', default='localhost')}:{env('DB_PORT', default='5432')}/{env('DB_NAME', default='rocketassess')}",
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# Override with MySQL if specifically using Railway
if env('USE_MYSQL', default=False):
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.mysql',
            'NAME': env('DB_NAME', default='railway'),
            'USER': env('DB_USER', default='root'),
            'PASSWORD': env('DB_PASSWORD', default=''),
            'HOST': env('DB_HOST', default='mysql.railway.internal'),
            'PORT': env('DB_PORT', default='3306'),
            'OPTIONS': {
                'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
                'charset': 'utf8mb4',
            },
            'CONN_MAX_AGE': 60,
            'CONN_HEALTH_CHECKS': True,
        }
    }

# # Use SQLite for quick local testing (commented out)
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.sqlite3',
#         'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
#     }
# }

# CORS Settings - More secure configuration
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://192.168.1.71:5173",  # Add IP address for frontend
    "https://robbie-cutty.github.io",  # GitHub Pages
])



CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-requested-with',
    'x-user-email',
    'x-user-type',
]

# Only allow all origins in development
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
else:
    CORS_ALLOW_ALL_ORIGINS = False

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'America/Los_Angeles'
USE_I18N = True
USE_TZ = False
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_DIRS = [
    os.path.join(BASE_DIR, 'static'),
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'api': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(os.path.join(BASE_DIR, 'logs'), exist_ok=True)

# Cache Configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.dummy.DummyCache',
    }
}

# Use database for session storage instead of Redis
SESSION_ENGINE = 'django.contrib.sessions.backends.db'

# Cache time to live is 15 minutes
CACHE_TTL = 60 * 15

EMAIL_BACKEND = env('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = env('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = env('EMAIL_PORT', default=587)
EMAIL_USE_TLS = env.bool('EMAIL_USE_TLS', default=True)
EMAIL_HOST_USER = env('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = env('EMAIL_HOST_PASSWORD', default='')

TIME_ZONE = 'America/Vancouver'

CSRF_TRUSTED_ORIGINS = [
    "http://192.168.1.71:5173",
    "http://localhost:5173",
]
