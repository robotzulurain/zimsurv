import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Core ---
SECRET_KEY = os.getenv("SECRET_KEY", "demo-secret")
DEBUG = os.getenv("DEBUG", "False").lower() == "true"

ALLOWED_HOSTS = ["127.0.0.1","localhost","amr-app.onrender.com"]

INSTALLED_APPS = [
    "drf_spectacular",
    
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework.authtoken",
    "amr_reports",
    "corsheaders",
]

MIDDLEWARE = [
    "amr_project.mw_cors_simple.SimpleCORSMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
]

ROOT_URLCONF = "amr_project.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "amr_project.wsgi.application"

# --- DB (SQLite by default) ---
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# --- Password validators ---
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- i18n ---
LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

# --- Static ---
STATIC_URL = "/static/"
STATIC_ROOT = os.path.join(BASE_DIR, "staticfiles")

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Behind proxy (Render)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# --- DRF ---
REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}


# === OpenAPI / API Docs ===
SPECTACULAR_SETTINGS = {
    "TITLE": "AMR Surveillance API",
    "DESCRIPTION": "GLASS-aligned AMR endpoints for Zimbabwe.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# === Jazzmin Admin Theme ===
## JAZZMIN_SETTINGS = {
#    "site_title": "AMR Admin",
#    "site_header": "Zimbabwe AMR Surveillance",
#    "site_brand": "AMR Admin",
#    "welcome_sign": "Welcome to the AMR Admin",
#    "changeform_format": "horizontal_tabs",
#}

## JAZZMIN_UI_TWEAKS = {
#    "theme": "darkly",  # change to 'litera' for light theme
#    "navbar": "navbar-dark navbar-primary",
#    "sidebar": "sidebar-dark-primary",
#    "actions_sticky_top": True,
#}

# === CORS ===
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"
