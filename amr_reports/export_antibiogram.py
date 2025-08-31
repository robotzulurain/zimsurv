import csv
from django.http import HttpResponse
from django.utils.dateparse import parse_date
from django.db.models import Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import LabResult

def _apply_filters(qs, request):
    organism   = (request.GET.get('organism') or '').strip()
    antibiotic = (request.GET.get('antibiotic') or '').strip()
    df = parse_date(request.GET.get('date_from') or '')
    dt = parse_date(request.GET.get('date_to') or '')
    if organism:   qs = qs.filter(organism__iexact=organism)
    if antibiotic: qs = qs.filter(antibiotic__iexact=antibiotic)
    if df: qs = qs.filter(test_date__gte=df)
    if dt: qs = qs.filter(test_date__lte=dt)
    return qs

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_antibiogram_csv(request):
    qs = _apply_filters(LabResult.objects.all(), request)
    rows = (qs.values('organism','antibiotic')
              .annotate(
                  n=Count('id'),
                  r=Count('id', filter=Q(ast_result='R')),
                  i=Count('id', filter=Q(ast_result='I')),
                  s=Count('id', filter=Q(ast_result='S')),
              )
              .order_by('organism','antibiotic'))

    resp = HttpResponse(content_type='text/csv')
    resp['Content-Disposition'] = 'attachment; filename=antibiogram.csv'
    w = csv.writer(resp)
    w.writerow(['organism','antibiotic','n','R','I','S','%R'])
    for r in rows:
        pctR = round((r['r'] * 100.0 / r['n']), 2) if r['n'] else 0.0
        w.writerow([r['organism'], r['antibiotic'], r['n'], r['r'], r['i'], r['s'], pctR])
    return resp
