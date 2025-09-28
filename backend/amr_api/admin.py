from django.contrib import admin
from .models import LabResult

@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    # Show only core fields that exist on the model
    list_display = ("patient_id", "organism", "test_date", "host_type", "facility")
    list_filter = ("host_type", "test_date", "facility")
    search_fields = ("patient_id", "organism", "facility")
    ordering = ("-test_date",)
