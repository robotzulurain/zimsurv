from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = '_bv*11&oq=^i95qdrvqu9=6q6an7xe&q=lt!vz0z(%@8^ti0-p'
DEBUG = True
ALLOWED_HOSTS = ['localhost', '127.0.0.1']


INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    'corsheaders',
    'rest_framework',
    'rest_framework.authtoken',

    'amr_reports',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'amr_project.urls'

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

WSGI_APPLICATION = 'amr_project.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

MEDIA_ROOT = BASE_DIR / "uploads"
MEDIA_URL = "/media/"

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

CORS_ALLOW_ALL_ORIGINS = True

# Filtering support
REST_FRAMEWORK['DEFAULT_FILTER_BACKENDS'] = [
    'django_filters.rest_framework.DjangoFilterBackend',
    'rest_framework.filters.OrderingFilter',
    'rest_framework.filters.SearchFilter',
]
# Allow all origins (for development only)
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ]
}
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

# --- AMR APP: CORS/CSRF/hosts for React dev server ---
try:
    INSTALLED_APPS.index('corsheaders')
except ValueError:
    INSTALLED_APPS += ['corsheaders']

# Ensure CorsMiddleware is near the top (right after SecurityMiddleware is ideal)
if 'corsheaders.middleware.CorsMiddleware' not in MIDDLEWARE:
    # put it at the top to be safe
    MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware'] + list(MIDDLEWARE)

CORS_ALLOWED_ORIGINS = list(set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]))

CSRF_TRUSTED_ORIGINS = list(set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]))

# Make sure localhost is allowed
ALLOWED_HOSTS = list(set(list(ALLOWED_HOSTS) + ["127.0.0.1", "localhost"]))

# Load local overrides if present
try:
    from .settings_local import *
except Exception:
    pass
