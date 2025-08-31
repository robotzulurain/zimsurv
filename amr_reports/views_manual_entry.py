from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import LabResultSerializer
from .models import LabResult

class ManualEntryAPIView(APIView):
    def post(self, request):
        serializer = LabResultSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        results = LabResult.objects.all()
        serializer = LabResultSerializer(results, many=True)
        return Response(serializer.data)
