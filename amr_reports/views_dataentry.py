from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, authentication

from .serializers import LabResultSerializer

# Map incoming aliases -> serializer fields
FIELD_MAP = {
    "date": "test_date",
    "specimen": "specimen_type",
}

def normalize_row(row: dict) -> dict:
    if not isinstance(row, dict):
        return {}
    out = dict(row)
    # alias mapping (don't overwrite if canonical already provided)
    for src, dst in FIELD_MAP.items():
        if src in out and dst not in out:
            out[dst] = out[src]
    # age: '' -> None, and numeric cast
    if "age" in out and (out["age"] == "" or out["age"] is None):
        out["age"] = None
    elif "age" in out:
        try:
            out["age"] = int(out["age"])
        except Exception:
            pass
    return out


class DataEntryCreate(APIView):
    """
    POST /api/data-entry/
    Body: single LabResult JSON, accepts either:
      - test_date/specimen_type (canonical), or
      - date/specimen (aliases)
    """
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        data = normalize_row(request.data)
        ser = LabResultSerializer(data=data)
        if ser.is_valid():
            obj = ser.save()
            return Response(LabResultSerializer(obj).data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class DataEntryBulk(APIView):
    """
    POST /api/data-entry/bulk/
    Body: {"rows": [ {...}, {...} ]}
    Each row can use date/specimen OR test_date/specimen_type
    """
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        rows = request.data.get("rows", [])
        if not isinstance(rows, list) or not rows:
            return Response({"detail": "rows must be a non-empty list"},
                            status=status.HTTP_400_BAD_REQUEST)
        data = [normalize_row(r) for r in rows]
        ser = LabResultSerializer(data=data, many=True)
        if ser.is_valid():
            objs = ser.save()
            return Response({
                "created": len(objs),
                "samples": LabResultSerializer(objs[:5], many=True).data
            }, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
