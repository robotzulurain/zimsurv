from django.db import models

class LabResult(models.Model):
    patient_id    = models.CharField(max_length=50)
    sex           = models.CharField(max_length=1)
    age           = models.IntegerField()
    specimen_type = models.CharField(max_length=50)
    organism      = models.CharField(max_length=100)
    antibiotic    = models.CharField(max_length=100)
    ast_result    = models.CharField(max_length=1)  # R/I/S
    test_date     = models.DateField()
    host_type     = models.CharField(max_length=20)
    facility      = models.CharField(max_length=100)
    patient_type  = models.CharField(max_length=20, default="UNKNOWN")  # INPATIENT/OUTPATIENT/UNKNOWN
    created_at    = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient_id} {self.organism} {self.antibiotic} {self.ast_result}"
