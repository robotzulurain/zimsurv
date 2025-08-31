from typing import Optional, Tuple
from django.db import transaction
from .models import Facility

# Try OpenStreetMap / Nominatim via geopy (optional). If unavailable, we still work.
try:
    from geopy.geocoders import Nominatim
    _geocoder = Nominatim(user_agent="amr_dashboard_geocoder", timeout=10)
except Exception:
    _geocoder = None

def _try_geocode(query: str, country_bias: str = "Zimbabwe") -> Optional[Tuple[float, float, str]]:
    """
    Return (lat, lon, display_name) or None.
    """
    if not _geocoder:
        return None
    try:
        loc = _geocoder.geocode(f"{query}, {country_bias}") or _geocoder.geocode(query)
        if loc and (loc.latitude is not None) and (loc.longitude is not None):
            return (float(loc.latitude), float(loc.longitude), loc.address or "")
    except Exception:
        pass
    return None

@transaction.atomic
def ensure_facility(name: Optional[str], city: Optional[str] = None) -> Optional[Facility]:
    """
    Takes a facility name (required if you want a Facility) and optional city string.
    - Finds or creates Facility(name=name).
    - If city given and facility.city is blank, set it.
    - If coords missing, try to geocode "name, city, Zimbabwe".
    Returns a Facility instance, or None if no name provided.
    """
    name = (name or "").strip()
    city = (city or "").strip() or None
    if not name:
        return None

    fac, created = Facility.objects.get_or_create(name=name)

    changed = False
    if city and not (fac.city or "").strip():
        fac.city = city
        changed = True

    # If we don't have coords, try to geocode
    if (fac.lat is None) or (fac.lon is None):
        query = ", ".join([p for p in [name, city] if p])
        geo = _try_geocode(query) if query else None
        if geo:
            lat, lon, display_name = geo
            fac.lat = lat
            fac.lon = lon
            # If no city stored, try a best-effort city parse from display_name
            if not fac.city:
                parts = display_name.split(",")
                if len(parts) >= 2:
                    fac.city = parts[-4].strip() if len(parts) >= 4 else parts[1].strip()
            changed = True

    if changed:
        fac.save(update_fields=["city", "lat", "lon"])

    return fac
