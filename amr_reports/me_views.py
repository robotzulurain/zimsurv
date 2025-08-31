from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    user = request.user
    groups = list(user.groups.values_list('name', flat=True))
    role = 'Admin' if (user.is_staff or user.is_superuser or 'Admin' in groups) else ('DataEntry' if 'DataEntry' in groups else 'Viewer')
    return Response({
        "username": user.username,
        "is_staff": user.is_staff,
        "is_superuser": user.is_superuser,
        "groups": groups,
        "role": role
    })
