from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import LabResult
from .serializers import LabResultSerializer

class ManualLabResultEntry(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LabResultSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
