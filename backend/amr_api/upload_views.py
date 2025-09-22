from datetime import datetime
import csv

from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response

from .models import LabResult

# helper casters (tolerant)
def _int(x, default=None):
    try:
        return int(x)
    except Exception:
        return default

def _date(x):
    x = (x or "").strip()
    if not x:
        return None
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(x, fmt).date()
        except Exception:
            pass
    return None  # let model validation fail if required

@api_view(["POST"])
@parser_classes([MultiPartParser])
def upload_csv(request):
    """
    Accepts a CSV with headers (case-insensitive):
    patient_id,sex,age,specimen_type,organism,antibiotic,ast_result,
    test_date,facility,host_type,patient_type
    """
    f = request.FILES.get("file")
    if not f:
        return Response({"error": "No file uploaded"}, status=400)

    # Decode file (utf-8) and read CSV
    try:
        lines = f.read().decode("utf-8").splitlines()
    except Exception:
        return Response({"error": "File must be UTF-8 text CSV"}, status=400)

    reader = csv.DictReader(lines)
    # normalize headers to lower-case
    fieldnames = [h.lower().strip() for h in (reader.fieldnames or [])]
    reader.fieldnames = fieldnames

    required = {"patient_id","sex","age","specimen_type","organism","antibiotic",
                "ast_result","test_date","facility","host_type"}
    missing = [h for h in required if h not in fieldnames]
    if missing:
        return Response({"error": f"Missing columns: {', '.join(missing)}"}, status=400)

    created = 0
    skipped = 0
    errors  = []

    for i, row in enumerate(reader, start=2):  # start=2 => account for header line 1
        try:
            lr = LabResult(
                patient_id   = (row.get("patient_id") or "").strip(),
                sex          = (row.get("sex") or "").strip() or "UNKNOWN",
                age          = _int(row.get("age"), default=None),
                specimen_type= (row.get("specimen_type") or "").strip(),
                organism     = (row.get("organism") or "").strip(),
                antibiotic   = (row.get("antibiotic") or "").strip(),
                ast_result   = (row.get("ast_result") or "").strip().upper(),
                test_date    = _date(row.get("test_date")),
                facility     = (row.get("facility") or "").strip(),
                host_type    = (row.get("host_type") or "").strip().upper() or "HUMAN",
                patient_type = (row.get("patient_type") or "UNKNOWN").strip().upper(),
            )
            lr.save()
            created += 1
        except Exception as e:
            skipped += 1
            errors.append(f"line {i}: {e}")

    return Response({
        "message": f"Uploaded {created} rows. Skipped {skipped}.",
        "errors": errors[:10]  # cap to avoid huge payloads
    })
