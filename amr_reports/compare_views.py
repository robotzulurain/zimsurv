from collections import defaultdict
from django.db.models import Count, Q
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LabResult

def _global_filters(request):
    """Filters that should apply in both modes (but we avoid forcing the 'compare' axis)."""
    host_type  = (request.GET.get('host_type') or '').strip().lower()
    specimen   = (request.GET.get('specimen_type') or '').strip()
    df = parse_date(request.GET.get('date_from') or '')
    dt = parse_date(request.GET.get('date_to') or '')
    q  = (request.GET.get('q') or '').strip()
    return host_type, specimen, df, dt, q

def _apply_globals(qs, host_type, specimen, df, dt, q):
    if host_type:
        qs = qs.filter(host_type__iexact=host_type)
    if specimen:
        qs = qs.filter(specimen_type__iexact=specimen)
    if df:
        qs = qs.filter(test_date__gte=df)
    if dt:
        qs = qs.filter(test_date__lte=dt)
    if q:
        qs = qs.filter(
            Q(patient_id__icontains=q) |
            Q(organism__icontains=q) |
            Q(antibiotic__icontains=q)
        )
    return qs

def _pctR(S, I, R):
    total = S + I + R
    return round(100.0 * R / total, 2) if total else 0.0

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def compare_resistance(request):
    """
    Returns rows like:
      [{"label":"Klebsiella","S":6,"I":5,"R":0,"total":11,"pctR":0.0}, ...]
    Modes:
      - mode=by_organism&antibiotic=Penicillin  → compare organisms for that antibiotic
      - mode=by_antibiotic&organism=E.coli     → compare antibiotics for that organism
    Also accepts host_type, specimen_type, date_from, date_to, q.
    """
    mode       = (request.GET.get('mode') or 'by_organism').strip()
    antibiotic = (request.GET.get('antibiotic') or '').strip()
    organism   = (request.GET.get('organism') or '').strip()

    host_type, specimen, df, dt, q = _global_filters(request)
    base = _apply_globals(LabResult.objects.all(), host_type, specimen, df, dt, q)

    out = []

    if mode == 'by_organism':
        # set of organisms visible under global filters (not forcing a chosen one)
        orgs = list(
            base.values_list('organism', flat=True)
                .exclude(organism__isnull=True).exclude(organism__exact='')
                .distinct()
        )
        # for counts, constrain to chosen antibiotic if provided
        qs = base
        if antibiotic:
            qs = qs.filter(antibiotic__iexact=antibiotic)

        agg = qs.values('organism', 'ast_result').annotate(n=Count('id'))
        buckets = defaultdict(lambda: {'S':0, 'I':0, 'R':0})
        for row in agg:
            res = (row['ast_result'] or '').upper()
            if res in ('S','I','R'):
                buckets[row['organism']][res] += row['n']

        # zero-fill
        for org in orgs:
            S = buckets[org]['S']
            I = buckets[org]['I']
            R = buckets[org]['R']
            out.append({
                'label': org or '',
                'S': S, 'I': I, 'R': R,
                'total': S+I+R,
                'pctR': _pctR(S,I,R)
            })

    else:  # by_antibiotic
        # set of antibiotics visible under global filters
        abxs = list(
            base.values_list('antibiotic', flat=True)
                .exclude(antibiotic__isnull=True).exclude(antibiotic__exact='')
                .distinct()
        )
        # for counts, constrain to chosen organism if provided
        qs = base
        if organism:
            qs = qs.filter(organism__iexact=organism)

        agg = qs.values('antibiotic', 'ast_result').annotate(n=Count('id'))
        buckets = defaultdict(lambda: {'S':0, 'I':0, 'R':0})
        for row in agg:
            res = (row['ast_result'] or '').upper()
            if res in ('S','I','R'):
                buckets[row['antibiotic']][res] += row['n']

        # zero-fill
        for abx in abxs:
            S = buckets[abx]['S']
            I = buckets[abx]['I']
            R = buckets[abx]['R']
            out.append({
                'label': abx or '',
                'S': S, 'I': I, 'R': R,
                'total': S+I+R,
                'pctR': _pctR(S,I,R)
            })

    # stable ordering: label then pctR desc (so big problems float up inside same label)
    out.sort(key=lambda r: (str(r['label']).lower(), -r['pctR']))
    return Response(out)
