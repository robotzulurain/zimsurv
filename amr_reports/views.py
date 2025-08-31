from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny

from .models import LabResult
from .serializers import LabResultSerializer
from .validators import validate_lab_result
from .permissions import IsViewerReadOnlyElseDataEntryOrAdmin


# ✅ Manual lab result entry (protected with token)
class ManualLabResultView(generics.ListCreateAPIView):
    queryset = LabResult.objects.all()
    serializer_class = LabResultSerializer
    permission_classes = [IsViewerReadOnlyElseDataEntryOrAdmin]

    def get_queryset(self):
        queryset = super().get_queryset()
        sex = self.request.query_params.get('sex')
        if sex:
            queryset = queryset.filter(sex=sex)
        return queryset

    def perform_create(self, serializer):
        # ✅ Validate input before saving (WHO GLASS rules)
        validate_lab_result(self.request.data)
        serializer.save()


# ✅ Token-based login view (returns token + username)
class CustomAuthToken(ObtainAuthToken):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'username': user.username
        }, status=status.HTTP_200_OK)

from rest_framework import generics
from .models import LabResult
from .serializers import LabResultSerializer

class LabResultListView(generics.ListAPIView):
    queryset = LabResult.objects.all().order_by('-test_date')
    serializer_class = LabResultSerializer
    permission_classes = []  # Optional: add authentication later
