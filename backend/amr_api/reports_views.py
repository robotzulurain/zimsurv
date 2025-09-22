from datetime import datetime
from django.db.models import Count, Q
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from .models import LabResult

def _norm(x): return (x or "").strip().lower()
def _is_all(x): return (x is None) or (_norm(x) == "all")
def _iso(s):
    try: return datetime.fromisoformat((s or "").strip())
    except: return None

def _apply_filters(qs, request):
    fac = request.GET.get('facility'); org = request.GET.get('organism')
    abx = request.GET.get('antibiotic'); host = request.GET.get('host')
    start = _iso(request.GET.get('start')); end = _iso(request.GET.get('end'))
    if fac and not _is_all(fac): qs = qs.filter(facility=fac)
    if org and not _is_all(org): qs = qs.filter(organism=org)
    if abx and not _is_all(abx): qs = qs.filter(antibiotic=abx)
    if host and not _is_all(host): qs = qs.filter(host_type=host)
    if start: qs = qs.filter(test_date__gte=start.date())
    if end:   qs = qs.filter(test_date__lte=end.date())
    return qs

@api_view(['GET'])
@permission_classes([AllowAny])
def report_summary(request):
    qs = _apply_filters(LabResult.objects.all(), request)
    n = qs.count()
    if n == 0:
        rows = [
            {"month":"2025-01","tests":120,"pctR":0.34},
            {"month":"2025-02","tests":140,"pctR":0.31},
            {"month":"2025-03","tests":160,"pctR":0.36},
        ]
        return Response({"rows": rows, "demo": True})
    # real data: month and resistance
    from django.db.models.functions import TruncMonth
    agg = qs.annotate(m=TruncMonth('test_date')).values('m').annotate(
        tests=Count('id'),
        R=Count('id', filter=Q(ast_result='R'))
    ).order_by('m')
    rows = []
    for a in agg:
        tests = a['tests'] or 0
        pctR = (a['R'] or 0)/tests if tests else 0.0
        rows.append({"month": a['m'].strftime("%Y-%m"), "tests": tests, "pctR": pctR})
    return Response({"rows": rows})

@api_view(['GET'])
@permission_classes([AllowAny])
def report_facility_league(request):
    qs = _apply_filters(LabResult.objects.all(), request)
    n = qs.count()
    if n == 0:
        return Response({"rows":[
            {"facility":"Harare Central Lab","tests":50,"pctR":0.28,"completeness":"A"},
            {"facility":"Bulawayo NatLab","tests":40,"pctR":0.33,"completeness":"B"},
        ], "demo": True})
    agg = qs.values('facility').annotate(
        tests=Count('id'),
        R=Count('id', filter=Q(ast_result='R')),
    ).order_by('-tests')
    rows = []
    for a in agg:
        tests = a['tests'] or 0
        pctR = (a['R'] or 0)/tests if tests else 0.0
        rows.append({"facility":a['facility'], "tests":tests, "pctR":pctR, "completeness":"–"})
    return Response({"rows": rows})

@api_view(['GET'])
@permission_classes([AllowAny])
def report_antibiogram(request):
    qs = _apply_filters(LabResult.objects.all(), request)
    n = qs.count()
    if n == 0:
        return Response({"rows":[
            {"organism":"E. coli","antibiotic":"Ciprofloxacin","R":18,"I":4,"S":38,"total":60,"pctR":0.30},
            {"organism":"K. pneumoniae","antibiotic":"Ceftriaxone","R":12,"I":3,"S":45,"total":60,"pctR":0.20},
        ], "demo": True})
    agg = qs.values('organism','antibiotic').annotate(
        total=Count('id'),
        R=Count('id', filter=Q(ast_result='R')),
        I=Count('id', filter=Q(ast_result='I')),
        S=Count('id', filter=Q(ast_result='S')),
    ).order_by('-total')
    rows = []
    for a in agg:
        total=a['total'] or 0; pctR=(a['R'] or 0)/total if total else 0.0
        rows.append({"organism":a['organism'],"antibiotic":a['antibiotic'],"R":a['R'],"I":a['I'],"S":a['S'],"total":total,"pctR":pctR})
    return Response({"rows": rows})
