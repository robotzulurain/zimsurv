from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, authentication

from .models import LabResult
from .serializers import LabResultSerializer

class DataEntryCreate(APIView):
    """
    POST /api/data-entry/
    Body: single LabResult JSON
    """
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        ser = LabResultSerializer(data=request.data)
        if ser.is_valid():
            obj = ser.save()
            return Response(LabResultSerializer(obj).data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)


class DataEntryBulk(APIView):
    """
    POST /api/data-entry/bulk/
    Body: {"rows": [<LabResult JSON>, ...]}
    """
    authentication_classes = [authentication.TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        rows = request.data.get("rows", [])
        if not isinstance(rows, list) or not rows:
            return Response({"detail": "rows must be a non-empty list"}, status=status.HTTP_400_BAD_REQUEST)

        ser = LabResultSerializer(data=rows, many=True)
        if ser.is_valid():
            objs = ser.save()  # creates many
            return Response(
                {"created": len(objs), "samples": LabResultSerializer(objs[:5], many=True).data},
                status=status.HTTP_201_CREATED
            )
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)
