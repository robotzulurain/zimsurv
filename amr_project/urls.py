from django.contrib import admin
from django.urls import path, include
from .views import index

urlpatterns = [
    path('', index, name='index'),            # landing JSON at /
    path('admin/', admin.site.urls),
    path('api/', include('amr_reports.urls')),
]
