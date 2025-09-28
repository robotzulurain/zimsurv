from django.db import models

class LabResult(models.Model):
    # quick demo fields to store single antibiotic result per row (added for uploader compatibility)
    antibiotic = models.CharField(max_length=200, blank=True, null=True)
    ast_result = models.CharField(max_length=1, choices=[('S','S'),('I','I'),('R','R')], blank=True, null=True)

    HOST_TYPES = [
        ('HUMAN', 'Human'),
        ('ANIMAL', 'Animal'),
        ('ENVIRONMENT', 'Environment'),
    ]

    ENVIRONMENT_TYPES = [
        ('SOIL', 'Soil'),
        ('WATER', 'Water'),
        ('AIR', 'Air'),
        ('WOUND', 'Wound'),
        ('SPUTUM', 'Sputum'),
        ('STOOL', 'Stool'),
        ('URINE', 'Urine'),
        ('BLOOD', 'Blood'),
    ]

    ANIMAL_SPECIES = [
        ('CATTLE', 'Cattle'),
        ('POULTRY', 'Poultry'),
        ('GOATS', 'Goats'),
    ]

    patient_id = models.CharField(max_length=100)
    sex = models.CharField(max_length=10, blank=True, null=True)
    age = models.PositiveIntegerField(blank=True, null=True)
    specimen_type = models.CharField(max_length=100, blank=True, null=True)
    organism = models.CharField(max_length=100)
    test_date = models.DateField()
    host_type = models.CharField(max_length=20, choices=HOST_TYPES, default='HUMAN')
    facility = models.CharField(max_length=200, blank=True, null=True)
    patient_type = models.CharField(max_length=50, blank=True, null=True)

    # New fields
    animal_species = models.CharField(max_length=50, choices=ANIMAL_SPECIES, blank=True, null=True)
    environment_type = models.CharField(max_length=50, choices=ENVIRONMENT_TYPES, blank=True, null=True)

    def __str__(self):
        return f"{self.patient_id} - {self.organism}"
