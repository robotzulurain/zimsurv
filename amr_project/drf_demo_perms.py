REST_FRAMEWORK = {
    # Keep Token auth available (for future POSTs/admin)
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ],
    # Allow anyone to read GET endpoints (demo)
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
}
