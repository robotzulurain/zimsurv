from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import LabResult

# Fallback lists
GLASS_ORGANISMS = [
    "E.coli","Klebsiella pneumoniae","Staphylococcus aureus",
    "Streptococcus pneumoniae","Salmonella","Shigella",
    "Neisseria gonorrhoeae","Acinetobacter baumannii",
    "Pseudomonas aeruginosa","Enterococcus faecalis"
]

COMMON_ANTIBIOTICS = [
    "Amoxicillin","Ampicillin","Ceftriaxone","Ciprofloxacin",
    "Gentamicin","Meropenem","Penicillin","Vancomycin"
]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def organisms_lookup(request):
    # distinct non-empty organisms in DB
    db = list(
        LabResult.objects
        .exclude(Q(organism__isnull=True) | Q(organism__exact=""))
        .values_list('organism', flat=True)
        .distinct()
    )
    # union with GLASS list, keep order roughly (GLASS first)
    seen = set()
    merged = []
    for name in GLASS_ORGANISMS + db:
        n = str(name).strip()
        if n and n not in seen:
            merged.append(n)
            seen.add(n)
    return Response(merged)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def antibiotics_lookup(request):
    db = list(
        LabResult.objects
        .exclude(Q(antibiotic__isnull=True) | Q(antibiotic__exact=""))
        .values_list('antibiotic', flat=True)
        .distinct()
    )
    seen = set()
    merged = []
    for name in COMMON_ANTIBIOTICS + db:
        n = str(name).strip()
        if n and n not in seen:
            merged.append(n)
            seen.add(n)
    return Response(merged)
