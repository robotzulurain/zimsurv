from django.contrib import admin
from .models import LabResult

@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    list_display = ("id", "test_date", "facility", "host_type",
                    "patient_id", "sex", "age",
                    "specimen_type", "organism", "antibiotic", "ast_result")
    list_filter = ("host_type", "facility", "sex", "patient_type",
                   "organism", "antibiotic", "ast_result", "test_date")
    search_fields = ("patient_id", "facility", "organism", "antibiotic")
    date_hierarchy = "test_date"
    ordering = ("-test_date", "facility")
