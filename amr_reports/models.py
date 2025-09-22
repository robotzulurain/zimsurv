from django.db import models
from django.contrib.auth.models import User

class LabResult(models.Model):
    patient_id     = models.CharField(max_length=64, db_index=True, null=True, blank=True)
    sex            = models.CharField(max_length=10, null=True, blank=True)
    age            = models.PositiveIntegerField(null=True, blank=True)
    specimen_type  = models.CharField(max_length=64, db_index=True, null=True, blank=True)
    organism       = models.CharField(max_length=128, db_index=True, null=True, blank=True)
    antibiotic     = models.CharField(max_length=128, db_index=True, null=True, blank=True)
    ast_result     = models.CharField(max_length=1, db_index=True, null=True, blank=True)  # "S","I","R" validated in views
    test_date      = models.DateField(db_index=True, null=True, blank=True)
    facility       = models.CharField(max_length=128, db_index=True, null=True, blank=True)
    host_type      = models.CharField(max_length=16, db_index=True, null=True, blank=True) # HUMAN/ANIMAL/ENVIRONMENT
    patient_type   = models.CharField(max_length=16, null=True, blank=True)
    animal_species = models.CharField(max_length=64, null=True, blank=True)

    # NEW: who created this row
    created_by     = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="labresults")

    class Meta:
        indexes = [
            models.Index(fields=["organism","antibiotic"]),
            models.Index(fields=["facility","test_date"]),
        ]

    def __str__(self):
        return f"{self.patient_id or '-'} {self.organism or '-'} {self.antibiotic or '-'} {self.ast_result or '-'} @ {self.test_date or '-'}"
