from django.db.models import Q
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LabResult

def _apply_filters(qs, request):
    host_type  = (request.GET.get('host_type') or '').strip().lower()
    specimen   = (request.GET.get('specimen') or request.GET.get('specimen_type') or '').strip()
    organism   = (request.GET.get('organism') or '').strip()
    antibiotic = (request.GET.get('antibiotic') or '').strip()
    q          = (request.GET.get('q') or '').strip()
    df = parse_date(request.GET.get('date_from') or '')
    dt = parse_date(request.GET.get('date_to') or '')

    if host_type and host_type not in ('all','all hosts'):
        qs = qs.filter(host_type__iexact=host_type)
    if specimen and specimen.lower()!='all':
        qs = qs.filter(specimen_type__iexact=specimen)
    if organism and organism.lower()!='all organisms':
        qs = qs.filter(organism__iexact=organism)
    if antibiotic and antibiotic.lower()!='all antibiotics':
        qs = qs.filter(antibiotic__iexact=antibiotic)
    if df: qs = qs.filter(test_date__gte=df)
    if dt: qs = qs.filter(test_date__lte=dt)
    if q:
        qs = qs.filter(
            Q(patient_id__icontains=q) |
            Q(organism__icontains=q) |
            Q(antibiotic__icontains=q) |
            Q(specimen_type__icontains=q)
        )
    return qs

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def lab_results_list(request):
    qs = LabResult.objects.select_related('facility').order_by('-test_date','-id')
    qs = _apply_filters(qs, request)

    data = []
    for r in qs[:500]:
        data.append({
            "patient_id": r.patient_id,
            "sex": r.sex,
            "age": r.age,
            "specimen": r.specimen_type,
            "organism": r.organism,
            "antibiotic": r.antibiotic,
            "ast": r.ast_result,
            "date": r.test_date.isoformat() if r.test_date else None,
            "host": r.host_type,
            "facility": (r.facility.name if r.facility else None),
        })
    return Response({"count": qs.count(), "results": data})
