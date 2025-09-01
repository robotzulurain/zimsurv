from django.http import JsonResponse
from django.db import connection

TABLE = "amr_reports_labresult"

def _table_exists():
    with connection.cursor() as cur:
        cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name=%s", [TABLE])
        return bool(cur.fetchone())

def _cols():
    with connection.cursor() as cur:
        cur.execute(f"PRAGMA table_info({TABLE})")
        return {row[1] for row in cur.fetchall()}  # names

def _distinct(col):
    with connection.cursor() as cur:
        cur.execute(f"SELECT DISTINCT {col} FROM {TABLE} WHERE {col} IS NOT NULL AND TRIM({col}) <> '' ORDER BY {col} ASC")
        return [r[0] for r in cur.fetchall() if r and r[0] is not None]

def filter_options(request):
    """
    Returns distinct values per filter, only for columns that actually exist.
    {
      host: [...], organism: [...], antibiotic: [...],
      facility: [...], city: [...]
    }
    """
    if not _table_exists():
        return JsonResponse({"host": [], "organism": [], "antibiotic": [], "facility": [], "city": []})

    cols = _cols()

    # Choose reasonable aliases from likely column names
    host_col      = "host_type" if "host_type" in cols else None
    organism_col  = "organism" if "organism" in cols else None
    antibiotic_col= "antibiotic" if "antibiotic" in cols else None
    facility_col  = "facility" if "facility" in cols else None
    city_col      = "city" if "city" in cols else None

    data = {
        "host": _distinct(host_col) if host_col else [],
        "organism": _distinct(organism_col) if organism_col else [],
        "antibiotic": _distinct(antibiotic_col) if antibiotic_col else [],
        "facility": _distinct(facility_col) if facility_col else [],
        "city": _distinct(city_col) if city_col else [],
    }
    return JsonResponse(data)
