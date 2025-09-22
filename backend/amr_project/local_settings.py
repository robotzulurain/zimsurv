# Safe admin + CORS enablement without rewriting your main settings.py

# --- INSTALLED_APPS ---
try:
    INSTALLED_APPS
except NameError:
    INSTALLED_APPS = []

def _add_app(name):
    global INSTALLED_APPS
    if name not in INSTALLED_APPS:
        INSTALLED_APPS.append(name)

for app in [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",      # you already use this
    "rest_framework",   # keep DRF available
    "amr_api",          # your app
]:
    _add_app(app)

# --- MIDDLEWARE ---
try:
    MIDDLEWARE
except NameError:
    MIDDLEWARE = []

def _ensure_first(name):
    global MIDDLEWARE
    if name in MIDDLEWARE:
        MIDDLEWARE.remove(name)
    MIDDLEWARE.insert(0, name)

def _ensure(name):
    global MIDDLEWARE
    if name not in MIDDLEWARE:
        MIDDLEWARE.append(name)

# CORS near top (before CommonMiddleware)
_ensure_first("corsheaders.middleware.CorsMiddleware")
# Common Django middlewares (add if missing)
_ensure("django.middleware.security.SecurityMiddleware")
_ensure("django.contrib.sessions.middleware.SessionMiddleware")
_ensure("django.middleware.common.CommonMiddleware")
_ensure("django.middleware.csrf.CsrfViewMiddleware")
_ensure("django.contrib.auth.middleware.AuthenticationMiddleware")
_ensure("django.contrib.messages.middleware.MessageMiddleware")

# --- CORS / CSRF (dev) ---
CORS_ALLOWED_ORIGINS = list(set([
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]))
CSRF_TRUSTED_ORIGINS = list(set([
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]))

# --- Static (admin needs this; dev server serves it automatically) ---
STATIC_URL = "/static/"

# --- Allow dev hosts ---
try:
    ALLOWED_HOSTS
except NameError:
    ALLOWED_HOSTS = []
if "*" not in ALLOWED_HOSTS:
    ALLOWED_HOSTS = list(set(ALLOWED_HOSTS + ["127.0.0.1", "localhost"]))
