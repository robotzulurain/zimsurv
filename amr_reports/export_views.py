import csv
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils.dateparse import parse_date
from django.db.models import Q
from .models import LabResult

def _apply_filters(qs, request):
    organism   = (request.GET.get('organism') or '').strip()
    antibiotic = (request.GET.get('antibiotic') or '').strip()
    specimen   = (request.GET.get('specimen_type') or '').strip()
    host_type  = (request.GET.get('host_type') or '').strip().lower()
    df = parse_date(request.GET.get('date_from') or '')
    dt = parse_date(request.GET.get('date_to') or '')
    q  = (request.GET.get('q') or '').strip()

    if organism:   qs = qs.filter(organism__iexact=organism)
    if antibiotic: qs = qs.filter(antibiotic__iexact=antibiotic)
    if specimen:   qs = qs.filter(specimen_type__iexact=specimen)
    if host_type:  qs = qs.filter(host_type__iexact=host_type)
    if df:         qs = qs.filter(test_date__gte=df)
    if dt:         qs = qs.filter(test_date__lte=dt)
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
def export_labresults_csv(request):
    qs = _apply_filters(LabResult.objects.all().order_by('test_date','id'), request)
    resp = HttpResponse(content_type='text/csv')
    resp['Content-Disposition'] = 'attachment; filename=lab_results_export.csv'
    w = csv.writer(resp)
    w.writerow(["patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","test_date","host_type","facility"])
    for r in qs.select_related('facility'):
        w.writerow([
            r.patient_id,
            r.sex,
            r.age,
            r.specimen_type,
            r.organism,
            r.antibiotic,
            r.ast_result,
            r.test_date.isoformat() if r.test_date else "",
            r.host_type or "",
            (r.facility.name if getattr(r, "facility", None) else "")
        ])
    return resp
