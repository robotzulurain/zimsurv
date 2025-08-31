from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LabResult

def _apply_filters(qs, request):
    organism   = (request.GET.get('organism') or '').strip()
    antibiotic = (request.GET.get('antibiotic') or '').strip()
    specimen   = (request.GET.get('specimen_type') or '').strip()
    host_type  = (request.GET.get('host_type') or '').strip().lower()
    date_from  = parse_date(request.GET.get('date_from') or '')
    date_to    = parse_date(request.GET.get('date_to') or '')
    search     = (request.GET.get('q') or '').strip()

    if organism:   qs = qs.filter(organism__iexact=organism)
    if antibiotic: qs = qs.filter(antibiotic__iexact=antibiotic)
    if specimen:   qs = qs.filter(specimen_type__iexact=specimen)
    if host_type:  qs = qs.filter(host_type__iexact=host_type)
    if date_from:  qs = qs.filter(test_date__gte=date_from)
    if date_to:    qs = qs.filter(test_date__lte=date_to)
    if search:
        qs = qs.filter(
            Q(patient_id__icontains=search) |
            Q(organism__icontains=search)   |
            Q(antibiotic__icontains=search)
        )
    return qs

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def facilities_geo(request):
    qs = _apply_filters(LabResult.objects.select_related('facility'), request)

    # Site-level counts for features (facilities with coords)
    sited = (qs.exclude(facility__isnull=True)
               .exclude(facility__lat__isnull=True)
               .exclude(facility__lon__isnull=True)
               .values('facility__name','facility__city','facility__lat','facility__lon')
               .annotate(
                    total=Count('id'),
                    R=Count('id', filter=Q(ast_result='R')),
                    I=Count('id', filter=Q(ast_result='I')),
                    S=Count('id', filter=Q(ast_result='S')),
               ))

    features = []
    for r in sited:
        total = r['total'] or 1
        pctR = round((r['R'] * 100.0) / total, 2)
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [r['facility__lon'], r['facility__lat']]},
            "properties": {
                "facility": r['facility__name'],
                "city": r['facility__city'] or "",
                "total": r['total'],
                "R": r['R'],
                "I": r['I'],
                "S": r['S'],
                "pctR": pctR,
            }
        })

    # Unsited bucket (no coords)
    unsited_qs = qs.filter(
        Q(facility__isnull=True) |
        Q(facility__lat__isnull=True) |
        Q(facility__lon__isnull=True)
    )
    unsited = {
        "facility": "Unspecified",
        "city": "",
        "total": unsited_qs.count(),
        "R": unsited_qs.filter(ast_result='R').count(),
        "I": unsited_qs.filter(ast_result='I').count(),
        "S": unsited_qs.filter(ast_result='S').count(),
    }
    if unsited["total"]:
        unsited["pctR"] = round((unsited["R"] * 100.0) / unsited["total"], 2)
    else:
        unsited["pctR"] = None

    return Response({
        "type": "FeatureCollection",
        "features": features,
        "unsited": [unsited] if unsited["total"] else []
    })
