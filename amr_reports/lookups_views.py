from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count
from .models import LabResult

COMMON_ORGANISMS = [
    "E.coli","Klebsiella","Staphylococcus aureus","Pseudomonas aeruginosa",
    "Enterococcus faecalis","Streptococcus pneumoniae","Salmonella"
]
COMMON_ANTIBIOTICS = [
    "Ampicillin","Penicillin","Ciprofloxacin","Meropenem",
    "Ceftriaxone","Vancomycin","Gentamicin"
]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def organisms(request):
    # merge top 30 seen in data with common list (dedup, keep order)
    top = list(
        LabResult.objects.values_list('organism', flat=True)
        .annotate(n=Count('id')).order_by('-n')[:30]
    )
    seen = set()
    merged = [o for o in (top + COMMON_ORGANISMS) if not (o in seen or seen.add(o))]
    return Response(merged)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def antibiotics(request):
    top = list(
        LabResult.objects.values_list('antibiotic', flat=True)
        .annotate(n=Count('id')).order_by('-n')[:30]
    )
    seen = set()
    merged = [a for a in (top + COMMON_ANTIBIOTICS) if not (a in seen or seen.add(a))]
    return Response(merged)
