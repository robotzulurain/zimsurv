import io, csv, datetime as dt
from typing import List, Dict
import pandas as pd
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponseBadRequest
from django.db import transaction
from .models import LabResult

REQUIRED_COLS = ["patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","test_date","facility","host_type"]

def facilities_list(_request):
    names = list(LabResult.objects.exclude(facility__isnull=True).exclude(facility="").values_list("facility", flat=True).distinct())
    return JsonResponse(sorted(names), safe=False)

def _parse_date(s: str):
    if not s: return None
    s = str(s).strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try: return dt.datetime.strptime(s, fmt).date()
        except Exception: pass
    return None

def _coerce_row(d: Dict):
    out = {k: (d.get(k,"") if d.get(k,"")!="" else None) for k in REQUIRED_COLS}
    # normalize
    if out["sex"] in ("Male","male"): out["sex"]="M"
    if out["sex"] in ("Female","female"): out["sex"]="F"
    try: out["age"] = int(out["age"]) if out["age"] not in (None,"") else None
    except: out["age"] = None
    out["test_date"] = _parse_date(out["test_date"])
    if out["ast_result"]:
        out["ast_result"] = str(out["ast_result"]).strip().upper()[:1]  # S/I/R
    return out

def _save_rows(rows: List[Dict]):
    created = 0
    with transaction.atomic():
        objs = [LabResult(**_coerce_row(r)) for r in rows]
        LabResult.objects.bulk_create(objs, ignore_conflicts=True)
        created = len(objs)
    return created

@csrf_exempt
def upload_csv(request):
    f = request.FILES.get("csv_file")
    if not f: return HttpResponseBadRequest("csv_file required")
    try:
        data = f.read().decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(data))
        hdr = [h.strip() for h in reader.fieldnames or []]
        for col in REQUIRED_COLS:
            if col not in hdr: return HttpResponseBadRequest(f"Missing column: {col}")
        rows = [row for row in reader]
        n = _save_rows(rows)
        return JsonResponse({"ok": True, "created": n})
    except Exception as e:
        return HttpResponseBadRequest(str(e))

@csrf_exempt
def upload_excel(request):
    f = request.FILES.get("excel_file")
    if not f: return HttpResponseBadRequest("excel_file required")
    try:
        df = pd.read_excel(f, dtype=str)  # keep as strings, coerce later
        hdr = [c.strip() for c in df.columns.tolist()]
        for col in REQUIRED_COLS:
            if col not in hdr: return HttpResponseBadRequest(f"Missing column: {col}")
        rows = df.to_dict(orient="records")
        n = _save_rows(rows)
        return JsonResponse({"ok": True, "created": n})
    except Exception as e:
        return HttpResponseBadRequest(str(e))
