from django.contrib import admin
from django.urls import path, include
from .views import index, healthz

urlpatterns = [
    path('healthz', healthz, name='healthz'),
    path('', index, name='index'),

    # API app
    path('', include('amr_reports.urls')),

    # Admin (optional)
    path('admin/', admin.site.urls),
]
