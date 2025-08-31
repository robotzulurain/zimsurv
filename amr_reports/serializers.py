from rest_framework import serializers
from .models import LabResult, Facility

class FacilityField(serializers.SlugRelatedField):
    # Ensure DRF has a queryset; still allow name-based get_or_create on write
    def __init__(self, **kwargs):
        super().__init__(slug_field='name', queryset=Facility.objects.all(), **kwargs)

    def to_internal_value(self, data):
        if data in (None, "",):
            return None
        name = str(data).strip()
        obj, _ = Facility.objects.get_or_create(name=name)
        return obj

class LabResultSerializer(serializers.ModelSerializer):
    facility = FacilityField(required=False, allow_null=True)

    class Meta:
        model = LabResult
        fields = '__all__'
