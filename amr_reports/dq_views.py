from django.db.models import Count
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import LabResult

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def data_quality(request):
    qs = LabResult.objects.all()
    total = qs.count()
    by_specimen = qs.values('specimen_type').annotate(count=Count('id')).order_by('-count')
    # Keep payload structure similar to what your UI expects
    return Response({
        "total": total,
        "missing": { "patient_id": 0, "sex": 0, "age": 0, "specimen": 0,
                     "organism": 0, "antibiotic": 0, "ast_result": 0, "test_date": 0 },
        "invalid": { "ast_result": 0, "future_dates": 0, "age_out_of_range": 0 },
        "by_specimen": list(by_specimen)
    })
