from django.http import JsonResponse
from django.db import connection

def counts_summary(request):
    """
    Returns { total_results, unique_patients, organisms_count }
    Uses raw SQL against amr_reports_labresult.
    """
    with connection.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM amr_reports_labresult")
        total = cur.fetchone()[0]
        cur.execute("SELECT COUNT(DISTINCT patient_id) FROM amr_reports_labresult")
        uniq = cur.fetchone()[0]
        cur.execute("SELECT COUNT(DISTINCT organism) FROM amr_reports_labresult")
        orgs = cur.fetchone()[0]
    return JsonResponse({
        "total_results": total,
        "unique_patients": uniq,
        "organisms_count": orgs
    })

# --- safe placeholders so UI won't crash if these routes are hit ---

def resistance_time_trend(request):
    # shape your UI expects: you can expand later
    return JsonResponse({"series": []})

def antibiogram(request):
    # tabular heatmap input expected by your UI; fill later
    return JsonResponse({"rows": []})

def data_quality(request):
    # any issues/warnings; fill later
    return JsonResponse({"issues": []})

def facilities_geo(request):
    # minimal GeoJSON so the map tab doesn't error out
    return JsonResponse({"type":"FeatureCollection","features":[]})

def lab_results(request):
    # simple sample payload (first 50 rows) — expand later as needed
    with connection.cursor() as cur:
        cur.execute("""
            SELECT id, facility, patient_id, sex, age, specimen_type,
                   organism, antibiotic, ast_result, test_date, host_type
            FROM amr_reports_labresult
            ORDER BY id DESC
            LIMIT 50
        """)
        cols = [c[0] for c in cur.description]
        out = [dict(zip(cols, row)) for row in cur.fetchall()]
    return JsonResponse({"results": out})
