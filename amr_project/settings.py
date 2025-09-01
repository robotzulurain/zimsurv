import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv("SECRET_KEY", "demo-secret")

# DEBUG comes from env (default False on Render)
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

# Allow hosts from env or default to Render + local
_allowed = os.getenv("ALLOWED_HOSTS", ".onrender.com,localhost,127.0.0.1")
ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    'amr-app.onrender.com',
    'stirring-alpaca-e31b52.netlify.app',
]

# Installed apps
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

# Database (SQLite by default, can be overridden with DATABASE_URL)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Trust proxy headers (needed on Render)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# CORS (for Netlify/React frontend)
CORS_ALLOW_ALL_ORIGINS = True


REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
CORS_ALLOWED_ORIGINS = [
    'https://stirring-alpaca-e31b52.netlify.app',
    'http://localhost:5173',
]

CORS_ALLOW_HEADERS = ['authorization', 'content-type', 'accept', 'origin']

# === DRF config ===
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
CORS_ALLOW_HEADERS = [
    "authorization",
    "content-type",
    "accept",
    "origin",
]

CSRF_TRUSTED_ORIGINS = [
    'https://stirring-alpaca-e31b52.netlify.app',
]

# === CORS (browser) ===
# Requires: pip install django-cors-headers
try:
    INSTALLED_APPS
except NameError:
    INSTALLED_APPS = []
if 'corsheaders' not in INSTALLED_APPS:
    INSTALLED_APPS += ['corsheaders']

try:
    MIDDLEWARE
except NameError:
    MIDDLEWARE = []
if 'corsheaders.middleware.CorsMiddleware' not in MIDDLEWARE:
    MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware'] + list(MIDDLEWARE)

# Allow your Netlify site and local dev
CORS_ALLOWED_ORIGINS = list(set([
    'https://stirring-alpaca-e31b52.netlify.app',
    'http://localhost:5173',
    'http://localhost:3000',
]))

# Allow Authorization header so Token auth works
from corsheaders.defaults import default_headers
CORS_ALLOW_HEADERS = list(set(list(default_headers) + [
    'authorization',
    'content-type',
    'accept',
    'origin',
]))

# Hosts that can serve Django (Render + local)
try:
    ALLOWED_HOSTS
except NameError:
    ALLOWED_HOSTS = []
for h in ['127.0.0.1', 'localhost', 'amr-app.onrender.com', 'stirring-alpaca-e31b52.netlify.app']:
    if h not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(h)

# ==== CORS DEBUG SETUP ====
# pip install django-cors-headers
if 'corsheaders' not in INSTALLED_APPS:
    INSTALLED_APPS += ['corsheaders']

if 'corsheaders.middleware.CorsMiddleware' not in MIDDLEWARE:
    MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware'] + list(MIDDLEWARE)

# TEMP: allow all origins while we debug (remove after it works)
CORS_ALLOW_ALL_ORIGINS = True

# Allow Authorization header so Token auth works
try:
    from corsheaders.defaults import default_headers
    CORS_ALLOW_HEADERS = list(default_headers) + ['authorization']
except Exception:
    CORS_ALLOW_HEADERS = ['authorization', 'content-type', 'accept', 'origin']

# Make sure your hosts include Render + Netlify + local
for _h in ['127.0.0.1', 'localhost', 'amr-app.onrender.com', 'stirring-alpaca-e31b52.netlify.app']:
    if _h not in ALLOWED_HOSTS:
        ALLOWED_HOSTS.append(_h)

# === CORS (debug-safe) ===
# Requires: django-cors-headers
if 'corsheaders' not in INSTALLED_APPS:
    INSTALLED_APPS += ['corsheaders']

# Put CorsMiddleware at the very top (before CommonMiddleware)
if 'corsheaders.middleware.CorsMiddleware' not in MIDDLEWARE:
    MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware'] + list(MIDDLEWARE)

# TEMP while we debug: allow everything (remove after it works)
CORS_ALLOW_ALL_ORIGINS = True

# Allow Authorization so Token auth works from the browser
try:
    from corsheaders.defaults import default_headers
    CORS_ALLOW_HEADERS = list(default_headers) + ['authorization']
except Exception:
    CORS_ALLOW_HEADERS = ['authorization','content-type','accept','origin']

# Helpful (not strictly required for GET)
CSRF_TRUSTED_ORIGINS = list(set((
    'http://localhost:3000',
    'http://localhost:5173',
    'https://stirring-alpaca-e31b52.netlify.app',
    *(CSRF_TRUSTED_ORIGINS if 'CSRF_TRUSTED_ORIGINS' in globals() else [])
)))
# Harmless to include; not required for CORS
ALLOWED_HOSTS = list(set((
    '127.0.0.1','localhost','amr-app.onrender.com','stirring-alpaca-e31b52.netlify.app',
    *ALLOWED_HOSTS
)))
