from django.contrib import admin
from django.urls import path, include
from .views import index, healthz

urlpatterns = [
    path('', index, name='index'),
    path('healthz', healthz, name='healthz'),
    path('', include('amr_reports.urls')),
    path('admin/', admin.site.urls),
]
