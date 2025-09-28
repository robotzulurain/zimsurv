import csv
from io import TextIOWrapper
from datetime import datetime
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from .models import LabResult

FIELDS = ["patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","test_date","host_type","facility","patient_type"]

def _parse_int(v, default=None):
    try:
        return int(v)
    except Exception:
        return default

def _parse_date(v):
    if not v: return None
    # Accept YYYY-MM-DD or dd/mm/yyyy
    try:
        if '-' in v: return datetime.strptime(v, '%Y-%m-%d').date()
        return datetime.strptime(v, '%d/%m/%Y').date()
    except Exception:
        return None

def _clean(row):
    row = {k:(row.get(k) or '').strip() for k in FIELDS}
    row['age'] = _parse_int(row['age'], 0)
    row['test_date'] = _parse_date(row['test_date']) or datetime.today().date()
    if row['patient_type'] == '': row['patient_type'] = 'UNKNOWN'
    return row

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def create_entry(request):
    # CSV upload?
    if request.FILES.get('file'):
        f = request.FILES['file']
        reader = csv.DictReader(TextIOWrapper(f.file, encoding='utf-8'))
        created = 0; errors = []
        for i, raw in enumerate(reader, start=1):
            row = _clean(raw)
            try:
                row.setdefault("environment_type", row.get("environment_type")) or None
                row.setdefault("animal_species", row.get("animal_species")) or None
                LabResult.objects.create(**row)
                created += 1
            except Exception as e:
                errors.append(f"Row {i}: {e}")
        return Response({'ok': True, 'created': created, 'errors': errors})
    # Single JSON object
    data = _clean(request.data)
    if data['age'] < 0 or data['age'] > 120:
        return Response({'ok': False, 'error': 'Age must be 0–120'}, status=400)
    try:
        data.setdefault("environment_type", data.get("environment_type")) or None
        data.setdefault("animal_species", data.get("animal_species")) or None
        LabResult.objects.create(**data)
        return Response({'ok': True})
    except Exception as e:
        return Response({'ok': False, 'error': str(e)}, status=400)
