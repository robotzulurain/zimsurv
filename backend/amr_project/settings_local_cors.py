# --- Local CORS/CSRF for dev ---
# FRONTEND ORIGINS YOU USE
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5174",
    "http://localhost:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5175",
]

CORS_ALLOW_CREDENTIALS = True
# If you use fetch with credentials or Django's session, keep this True.

# Trusted for CSRF (needed when you do POST/PUT from the frontend)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5174",
    "http://localhost:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5175",
]

# Ensure the app & middleware are present exactly once
if 'corsheaders' not in INSTALLED_APPS:
    INSTALLED_APPS += ['corsheaders']

if 'corsheaders.middleware.CorsMiddleware' not in MIDDLEWARE:
    # Must be as high as possible, ideally right after SecurityMiddleware
    MIDDLEWARE = ['corsheaders.middleware.CorsMiddleware'] + MIDDLEWARE
