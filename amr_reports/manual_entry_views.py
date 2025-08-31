from datetime import datetime
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import LabResult
from .facility_utils import ensure_facility

SEX_MAP = {"male":"M","female":"F","m":"M","f":"F"}

def _parse_date(s):
    s = (s or "").strip()
    if not s: return None
    # try dd/mm/yyyy then yyyy-mm-dd
    for fmt in ("%d/%m/%Y", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt).date()
        except Exception:
            pass
    return None

class ManualLabResultView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"detail":"Method \"GET\" not allowed."}, status=405)

    def post(self, request):
        d = request.data if isinstance(request.data, dict) else {}

        # Facility ForeignKey handling
        fac_name = (d.get("facility") or "").strip()
        city     = (d.get("city") or "").strip()
        facility = ensure_facility(fac_name, city) if fac_name else None

        try:
            r = LabResult(
                patient_id = (d.get("patient_id") or "").strip(),
                sex        = SEX_MAP.get((d.get("sex") or "").strip().lower(), (d.get("sex") or "").strip()),
                age        = int(d["age"]) if str(d.get("age","")).strip() != "" else None,
                specimen_type = (d.get("specimen_type") or d.get("specimen") or "").strip(),
                organism      = (d.get("organism") or "").strip(),
                antibiotic    = (d.get("antibiotic") or "").strip(),
                ast_result    = (d.get("ast_result") or d.get("ast") or "").strip().upper()[0:1],  # S/I/R
                test_date     = _parse_date(d.get("test_date")),
                host_type     = (d.get("host_type") or "human").strip().lower(),
                facility      = facility,  # ForeignKey instance (or None if not provided)
            )
            if r.ast_result not in ("S","I","R"):
                return Response({"error":"ast_result must be S, I or R"}, status=400)
            if not r.patient_id or not r.specimen_type or not r.organism or not r.antibiotic:
                return Response({"error":"patient_id, specimen_type, organism, antibiotic are required"}, status=400)
            # If your model requires facility (null=False), enforce name
            # if r.facility is None:
            #     return Response({"error":"facility is required"}, status=400)

            r.save()
            return Response({"ok":True, "id": r.id}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"{e.__class__.__name__}: {e}"}, status=400)
