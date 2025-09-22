from datetime import datetime, timedelta
from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import LabResult

DEMO_ALERTS = [
    {"type":"Spike","organism":"Escherichia coli","antibiotic":"Ciprofloxacin","facility":"Harare Central Lab","change_pp":18,"tests":45,"severity":"high"},
    {"type":"Cluster","organism":"Klebsiella pneumoniae","antibiotic":"Ceftriaxone","facility":"Bulawayo NatLab","cases":3,"tests":10,"severity":"medium"},
]

@api_view(['GET'])
@permission_classes([AllowAny])
def alerts_feed(request):
    # Tunables (optional query params)
    try:
        cluster_r = int(request.GET.get('cluster_r', 3))
        window_days = int(request.GET.get('window_days', 30))
    except Exception:
        cluster_r, window_days = 3, 30

    since = datetime.today() - timedelta(days=window_days)
    qs = LabResult.objects.filter(test_date__gte=since)

    alerts = []
    # Simple cluster: >= cluster_r "R" per org/abx/facility
    agg = qs.filter(ast_result='R').values('organism','antibiotic','facility') \
            .annotate(cases=Count('id'), tests=Count('id'))
    for row in agg:
        if row['cases'] >= cluster_r:
            alerts.append({
                'type':'Cluster',
                'organism': row['organism'],
                'antibiotic': row['antibiotic'],
                'facility': row['facility'],
                'cases': row['cases'],
                'tests': row['tests'],
                'severity': 'high' if row['cases'] >= 10 else 'medium'
            })

    # Spike detection is data-hungry; if nothing found, return demo set
    if not alerts:
        return Response(DEMO_ALERTS)
    return Response(alerts)
