from django.db import models

class Facility(models.Model):
    name = models.CharField(max_length=120, unique=True)
    city = models.CharField(max_length=120, blank=True, default="")
    lat = models.FloatField(null=True, blank=True)
    lon = models.FloatField(null=True, blank=True)

    def __str__(self):
        return self.name

class LabResult(models.Model):
    patient_id = models.CharField(max_length=50)
    sex = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female')])
    age = models.PositiveIntegerField()
    specimen_type = models.CharField(max_length=100)
    organism = models.CharField(max_length=100)
    antibiotic = models.CharField(max_length=100)
    ast_result = models.CharField(
        max_length=1,
        choices=[('S', 'Susceptible'), ('I', 'Intermediate'), ('R', 'Resistant')],
        default='R'
    )
    test_date = models.DateField()

    # --- One Health fields ---
    host_type = models.CharField(
        max_length=16,
        choices=[('human','Human'),('animal','Animal'),('environment','Environment')],
        default='human'
    )
    facility = models.ForeignKey(
        Facility, null=True, blank=True, on_delete=models.SET_NULL, related_name='lab_results'
    )

    def __str__(self):
        return f"{self.patient_id} - {self.organism} - {self.antibiotic}"
