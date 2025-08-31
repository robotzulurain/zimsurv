from collections import defaultdict
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
    df = parse_date(request.GET.get('date_from') or '')
    dt = parse_date(request.GET.get('date_to') or '')

    if organism and organism.lower() != 'all organisms':
        qs = qs.filter(organism__iexact=organism)
    if antibiotic and antibiotic.lower() != 'all antibiotics':
        qs = qs.filter(antibiotic__iexact=antibiotic)
    if specimen and specimen.lower() != 'all':
        qs = qs.filter(specimen_type__iexact=specimen)
    if host_type and host_type not in ('all', 'all hosts'):
        qs = qs.filter(host_type__iexact=host_type)
    if df: qs = qs.filter(test_date__gte=df)
    if dt: qs = qs.filter(test_date__lte=dt)
    return qs

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def antibiogram_matrix(request):
    qs = _apply_filters(LabResult.objects.all(), request)

    orgs, abxs = [], []
    bucket = defaultdict(lambda: {"S":0,"I":0,"R":0,"N":0})
    for r in qs.only('organism','antibiotic','ast_result'):
        o = r.organism or "Unknown"
        a = r.antibiotic or "Unknown"
        if o not in orgs: orgs.append(o)
        if a not in abxs: abxs.append(a)
        key = (o,a)
        val = (r.ast_result or "").upper()
        if val.startswith("S"): bucket[key]["S"] += 1
        elif val.startswith("I"): bucket[key]["I"] += 1
        elif val.startswith("R"): bucket[key]["R"] += 1
        bucket[key]["N"] += 1

    matrix = []
    for o in orgs:
        row = []
        for a in abxs:
            N = bucket[(o,a)]["N"]
            R = bucket[(o,a)]["R"]
            pctR = round(100.0 * R / N, 2) if N else None
            row.append({
                "S": bucket[(o,a)]["S"],
                "I": bucket[(o,a)]["I"],
                "R": bucket[(o,a)]["R"],
                "N": N,
                "pctR": pctR
            })
        matrix.append(row)

    return Response({"organisms": orgs, "antibiotics": abxs, "matrix": matrix})
