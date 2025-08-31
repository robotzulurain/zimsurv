from collections import defaultdict
from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LabResult

def _filtered(qs, request):
    organism   = (request.GET.get('organism') or '').strip()
    antibiotic = (request.GET.get('antibiotic') or '').strip()
    specimen   = (request.GET.get('specimen_type') or '').strip()
    host_type  = (request.GET.get('host_type') or '').strip().lower()
    df = parse_date(request.GET.get('date_from') or '')
    dt = parse_date(request.GET.get('date_to') or '')
    q  = (request.GET.get('q') or '').strip()

    if organism and organism.lower() != 'all organisms':
        qs = qs.filter(organism__iexact=organism)
    if antibiotic and antibiotic.lower() != 'all antibiotics':
        qs = qs.filter(antibiotic__iexact=antibiotic)
    if specimen and specimen.lower() != 'all':
        qs = qs.filter(specimen_type__iexact=specimen)
    if host_type and host_type not in ('all', 'all hosts'):
        qs = qs.filter(host_type__iexact=host_type)
    if df:
        qs = qs.filter(test_date__gte=df)
    if dt:
        qs = qs.filter(test_date__lte=dt)
    if q:
        qs = qs.filter(
            Q(patient_id__icontains=q)|
            Q(organism__icontains=q)|
            Q(antibiotic__icontains=q)|
            Q(specimen_type__icontains=q)
        )
    return qs

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def counts_summary(request):
    qs = _filtered(LabResult.objects.all(), request)
    total = qs.count()
    patients = qs.values('patient_id').distinct().count()
    organisms = qs.exclude(organism__isnull=True).exclude(organism__exact='').values('organism').distinct().count()
    return Response({
        "total_results": total,
        "unique_patients": patients,
        "organisms_count": organisms,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resistance_time_trend(request):
    qs = _filtered(LabResult.objects.all(), request)
    rows = defaultdict(lambda: {"S":0,"I":0,"R":0,"Total":0})
    for r in qs.only('test_date','organism','antibiotic','ast_result'):
        month_str = r.test_date.strftime("%Y-%m") if r.test_date else "Unknown"
        o = r.organism or "Unknown"
        a = r.antibiotic or "Unknown"
        key = (month_str, o, a)
        if (r.ast_result or "").upper().startswith("S"): rows[key]["S"] += 1
        elif (r.ast_result or "").upper().startswith("I"): rows[key]["I"] += 1
        elif (r.ast_result or "").upper().startswith("R"): rows[key]["R"] += 1
        rows[key]["Total"] += 1
    out = []
    for (m,o,a), v in sorted(rows.items(), key=lambda x: x[0]):
        out.append({"month": m, "organism": o, "antibiotic": a,
                    "S": v["S"], "I": v["I"], "R": v["R"], "Total": v["Total"]})
    return Response(out)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_quality_summary(request):
    qs = _filtered(LabResult.objects.all(), request)
    missing = {
      "patient_id": qs.filter(Q(patient_id__isnull=True)|Q(patient_id__exact='')).count(),
      "sex": qs.filter(Q(sex__isnull=True)|Q(sex__exact='')).count(),
      "age": qs.filter(Q(age__isnull=True)).count(),
      "specimen": qs.filter(Q(specimen_type__isnull=True)|Q(specimen_type__exact='')).count(),
      "organism": qs.filter(Q(organism__isnull=True)|Q(organism__exact='')).count(),
      "antibiotic": qs.filter(Q(antibiotic__isnull=True)|Q(antibiotic__exact='')).count(),
      "ast_result": qs.filter(Q(ast_result__isnull=True)|Q(ast_result__exact='')).count(),
      "test_date": qs.filter(Q(test_date__isnull=True)).count(),
    }
    invalid = {
      "ast_result": qs.exclude(ast_result__iregex=r'^(S|I|R)').count(),
      "future_dates": qs.filter(test_date__gt=parse_date("2100-01-01")).count(),
      "age_out_of_range": qs.filter(Q(age__lt=0)|Q(age__gt=120)).count(),
    }
    by_specimen = (qs.values('specimen_type')
                     .annotate(count=Count('id'))
                     .order_by('-count'))
    return Response({
      "total": qs.count(),
      "missing": missing,
      "invalid": invalid,
      "by_specimen": list(by_specimen),
    })
