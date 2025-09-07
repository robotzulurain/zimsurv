from django.contrib import admin
from .models import LabResult

@admin.register(LabResult)
class LabResultAdmin(admin.ModelAdmin):
    list_display  = ("patient_id","organism","antibiotic","ast_result","sex","age","test_date","facility","host_type")
    list_filter   = ("organism","antibiotic","ast_result","sex","host_type","facility")
    search_fields = ("patient_id","organism","antibiotic","facility")
    readonly_fields = ()
