from pathlib import Path
from .models import LabResult
import csv

def upload_csv_to_db(csv_path: Path):
    """
    Reads a narrow template CSV and writes to DB.
    Returns dict: {'status': 'ok', 'created': n, 'errors': [...]}
    """
    created = 0
    errors = []
    with csv_path.open(newline='', encoding='utf-8') as f:
        rdr = csv.DictReader(f)
        for i, row in enumerate(rdr, start=1):
            try:
                LabResult.objects.create(
                    patient_id=row.get('patient_id',''),
                    age=int(row.get('age',0)),
                    sex=row.get('sex','U'),
                    specimen_type=row.get('specimen_type',''),
                    organism=row.get('organism',''),
                    antibiotic=row.get('antibiotic',''),
                    ast_result=row.get('ast_result',''),
                    test_date=row.get('test_date',''),
                    host_type=row.get('host_type',''),
                    facility=row.get('facility',''),
                    patient_type=row.get('patient_type',''),
                    animal_species=row.get('animal_species',''),
                    environment_type=row.get('environment_type','')
                )
                created += 1
            except Exception as e:
                errors.append(f"row {i}: {str(e)}")
    return {'status':'ok', 'created': created, 'errors': errors}
