from django.db import models

class LabResult(models.Model):
    patient_id = models.CharField(max_length=50)
    sex = models.CharField(max_length=1, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    age = models.IntegerField()
    specimen_type = models.CharField(max_length=100)
    collection_date = models.DateField()
    organism_isolated = models.CharField(max_length=100)
    antibiotic_tested = models.CharField(max_length=100)
    susceptibility = models.CharField(max_length=1, choices=[('S', 'Susceptible'), ('I', 'Intermediate'), ('R', 'Resistant')])
    method = models.CharField(max_length=20, choices=[('MIC', 'MIC'), ('Disk diffusion', 'Disk Diffusion'), ('Etest', 'Etest')])
    laboratory = models.CharField(max_length=100)
    facility_location = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.patient_id} - {self.organism_isolated} - {self.antibiotic_tested}"
