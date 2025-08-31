from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # include amr_reports routes (adds /api/data-entry/ and /api/data-entry/bulk/)
    path('', include('amr_reports.urls')),
]
