from django.db import models
from django.utils import timezone

class LabResult(models.Model):
    patient_id     = models.CharField(max_length=64, db_index=True, null=True, blank=True)
    sex            = models.CharField(max_length=10, blank=True, null=True)
    age            = models.PositiveIntegerField(null=True, blank=True)
    specimen_type  = models.CharField(max_length=64, db_index=True, null=True, blank=True)
    organism       = models.CharField(max_length=128, db_index=True, null=True, blank=True)
    antibiotic     = models.CharField(max_length=128, db_index=True, null=True, blank=True)
    ast_result     = models.CharField(
        max_length=1,
        choices=[("S","S"),("I","I"),("R","R")],
        db_index=True,
        null=True,
        blank=True
    )
    test_date      = models.DateField(db_index=True, null=True, blank=True)
    facility       = models.CharField(max_length=128, db_index=True, null=True, blank=True)
    host_type      = models.CharField(
        max_length=16,
        choices=[("HUMAN","HUMAN"),("ANIMAL","ANIMAL"),("ENVIRONMENT","ENVIRONMENT")],
        db_index=True,
        null=True,
        blank=True
    )
    patient_type   = models.CharField(max_length=16, blank=True, null=True)
    animal_species = models.CharField(max_length=64, blank=True, null=True)

    created_at     = models.DateTimeField(default=timezone.now, editable=False)

    class Meta:
        indexes = [
            models.Index(fields=["organism", "antibiotic"]),
            models.Index(fields=["facility", "test_date"]),
        ]

    def __str__(self):
        return f"{self.patient_id or '-'} {self.organism or '-'} {self.antibiotic or '-'} {self.ast_result or '-'} @ {self.test_date or '-'}"
