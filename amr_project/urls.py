from django.contrib import admin
from .views import index, healthz
from django.urls import path, include

urlpatterns = [
    path('', index, name='index'),
    path('healthz', healthz, name='healthz'),
    path('admin/', admin.site.urls),
    # include amr_reports routes (adds /api/data-entry/ and /api/data-entry/bulk/)
    path('', include('amr_reports.urls')),
]
