from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
import csv

from .models import LabResult

@api_view(['POST'])
@parser_classes([MultiPartParser])
def upload_csv(request):
    file = request.FILES.get('file')
    if not file:
        return Response({"error": "No file uploaded"}, status=400)

    decoded = file.read().decode('utf-8').splitlines()
    reader = csv.DictReader(decoded)

    created = 0
    for row in reader:
        LabResult.objects.create(
            patient_id=row.get("patient_id"),
            sex=row.get("sex"),
            age=row.get("age"),
            specimen_type=row.get("specimen_type"),
            organism=row.get("organism"),
            antibiotic=row.get("antibiotic"),
            ast_result=row.get("ast_result"),
            test_date=row.get("test_date"),
            facility=row.get("facility"),
            host_type=row.get("host_type"),
            patient_type=row.get("patient_type", "UNKNOWN"),
        )
        created += 1

    return Response({"message": f"Uploaded {created} rows"})
