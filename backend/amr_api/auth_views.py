from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from rest_framework.response import Response
from django.contrib.auth import authenticate
from rest_framework.authtoken.models import Token

def _role_for(user):
    # group-based first
    gset = set(user.groups.values_list('name', flat=True))
    if 'lab_tech' in gset: return 'lab_tech'
    if 'policymaker' in gset: return 'policymaker'
    # username fallbacks (for demo/dev)
    u = user.username.lower()
    if u in ('labtech','lab_tech','tech'): return 'lab_tech'
    if u in ('policy','policymaker'): return 'policymaker'
    return 'viewer'

@api_view(['POST'])
@permission_classes([AllowAny])
def token_view(request):
    u = (request.data.get('username') or '').strip()
    p = request.data.get('password') or ''
    user = authenticate(username=u, password=p)
    if not user:
        return Response({'detail':'Invalid credentials'}, status=400)
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        'token': token.key,
        'username': user.username,
        'role': _role_for(user),
    })

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def whoami(request):
    user = request.user
    return Response({
        'username': user.username,
        'role': _role_for(user),
    })
