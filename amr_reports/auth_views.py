from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def whoami(request):
    user = request.user
    role = getattr(user, "role", None)  # adapt to your model if needed
    return Response({"user": {"username": user.username, "role": role}})
