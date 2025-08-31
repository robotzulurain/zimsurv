from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, authentication
from .serializers import LabResultSerializer

FIELD_MAP = {"date":"test_date","specimen":"specimen_type","ast":"ast_result","host":"host_type"}
CANONICAL_FIELDS = {"test_date","patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","host_type","facility"}

def normalize_row(row: dict) -> dict:
    if not isinstance(row, dict): return {}
    out = dict(row)
    for src,dst in FIELD_MAP.items():
        if src in out and dst not in out: out[dst]=out[src]
    # age: ensure integer, default 0 if missing/invalid (DB age NOT NULL)
    try:
        out["age"] = 0 if ("age" not in out or out["age"] in ("",None)) else int(out["age"])
    except Exception:
        out["age"] = 0
    safe_keys = set(CANONICAL_FIELDS) | {"patient_id","sex","age","specimen","date","ast","host"}
    safe = {k:v for k,v in out.items() if k in safe_keys}
    for src,dst in FIELD_MAP.items():
        if src in safe and dst not in safe: safe[dst]=safe[src]
    for src in list(FIELD_MAP.keys()): safe.pop(src, None)
    return safe

class DataEntryCreate(APIView):
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        try:
            data = normalize_row(request.data)
            ser = LabResultSerializer(data=data, partial=True)
            if ser.is_valid():
                obj = ser.save()
                return Response(LabResultSerializer(obj).data, status=status.HTTP_201_CREATED)
            return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"detail": f"server_error: {type(e).__name__}: {e}"}, status=500)

class DataEntryBulk(APIView):
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        rows = request.data.get("rows", [])
        if not isinstance(rows, list) or not rows:
            return Response({"detail":"rows must be a non-empty list"}, status=400)
        created, errors = [], []
        for idx, row in enumerate(rows):
            try:
                data = normalize_row(row)
                ser = LabResultSerializer(data=data, partial=True)
                if ser.is_valid():
                    obj = ser.save()
                    created.append(LabResultSerializer(obj).data)
                else:
                    errors.append({"index": idx, "errors": ser.errors})
            except Exception as e:
                errors.append({"index": idx, "errors": {"detail": f"server_error: {type(e).__name__}: {e}"}})
        code = 201 if created and not errors else 207
        return Response({"created_count":len(created),"errors_count":len(errors),"created":created[:5],"errors":errors[:10]}, status=code)
