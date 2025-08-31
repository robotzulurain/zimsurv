from rest_framework.generics import ListAPIView
from rest_framework import permissions
from rest_framework.pagination import PageNumberPagination
from .models import LabResult
from .serializers import LabResultSerializer
from django.db.models import Q

class LabResultPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 200

class LabResultsList(ListAPIView):
    serializer_class = LabResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = LabResultPagination

    def get_queryset(self):
        qs = LabResult.objects.all().order_by('-test_date', '-id')
        p = self.request.query_params

        organism = p.get('organism')
        antibiotic = p.get('antibiotic')
        sex = p.get('sex')  # M or F
        specimen = p.get('specimen_type')
        date_from = p.get('date_from')  # YYYY-MM-DD
        date_to = p.get('date_to')      # YYYY-MM-DD
        search = p.get('search')

        if organism:
            qs = qs.filter(organism__iexact=organism.strip())
        if antibiotic:
            qs = qs.filter(antibiotic__iexact=antibiotic.strip())
        if sex:
            qs = qs.filter(sex=sex.strip().upper())
        if specimen:
            qs = qs.filter(specimen_type__iexact=specimen.strip())
        if date_from:
            qs = qs.filter(test_date__gte=date_from)
        if date_to:
            qs = qs.filter(test_date__lte=date_to)
        if search:
            qs = qs.filter(
                Q(patient_id__icontains=search) |
                Q(organism__icontains=search) |
                Q(antibiotic__icontains=search)
            )
        return qs
