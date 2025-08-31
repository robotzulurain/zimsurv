from django.db.models import Count
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Facility, LabResult
from .permissions import IsViewerReadOnlyElseDataEntryOrAdmin

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_facilities(request):
    """
    Returns existing facilities with coordinates and basic counts.
    """
    qs = Facility.objects.all().order_by('name')
    rows = []
    for f in qs:
        total = LabResult.objects.filter(facility=f).count()
        rows.append({
            "id": f.id,
            "name": f.name,
            "city": f.city or "",
            "lat": f.lat,
            "lon": f.lon,
            "total": total,
        })
    return Response(rows)

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsViewerReadOnlyElseDataEntryOrAdmin])
def set_coords(request):
    """
    POST JSON: {"name":"Mpilo","lat":-20.15,"lon":28.58,"city":"Bulawayo"}
    Creates or updates facility coordinates.
    """
    name = (request.data.get('name') or "").strip()
    if not name:
        return Response({"error":"name is required"}, status=status.HTTP_400_BAD_REQUEST)

    lat = request.data.get('lat', None)
    lon = request.data.get('lon', None)
    city = (request.data.get('city') or "").strip()

    fac, _ = Facility.objects.get_or_create(name=name)
    if city:
        fac.city = city
    if lat is not None:
        try: fac.lat = float(lat)
        except ValueError: return Response({"error":"lat must be numeric"}, status=400)
    if lon is not None:
        try: fac.lon = float(lon)
        except ValueError: return Response({"error":"lon must be numeric"}, status=400)
    fac.save()
    return Response({"id": fac.id, "name": fac.name, "city": fac.city, "lat": fac.lat, "lon": fac.lon})
