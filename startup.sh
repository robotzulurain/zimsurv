#!/bin/bash
python manage.py migrate
python manage.py create_admin_user
python manage.py collectstatic --noinput
gunicorn your_project.wsgi:application --bind 0.0.0.0:$PORT
