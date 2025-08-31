import os
from .settings import *
SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', SECRET_KEY)
DEBUG = os.getenv('DJANGO_DEBUG', 'True').lower() == 'true'
ALLOWED_HOSTS = [h.strip() for h in os.getenv('DJANGO_ALLOWED_HOSTS','127.0.0.1,localhost').split(',') if h.strip()]
if os.getenv('DB_ENGINE'):
    DATABASES['default'] = {
        'ENGINE': os.getenv('DB_ENGINE'),
        'NAME': os.getenv('DB_NAME', 'amrdb'),
        'USER': os.getenv('DB_USER', 'amruser'),
        'PASSWORD': os.getenv('DB_PASSWORD', ''),
        'HOST': os.getenv('DB_HOST', 'db'),
        'PORT': os.getenv('DB_PORT', '5432'),
    }
