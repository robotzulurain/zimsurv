from django.http import JsonResponse
from django.db import connection

def _q1(sql):
    with connection.cursor() as cur:
        cur.execute(sql)
        return cur.fetchone()[0]

def counts_summary(request):
    """
    Returns { total_results, unique_patients, organisms_count }
    """
    try:
        total = _q1("SELECT COUNT(*) FROM amr_reports_labresult")
        uniq  = _q1("SELECT COUNT(DISTINCT patient_id) FROM amr_reports_labresult")
        orgs  = _q1("SELECT COUNT(DISTINCT organism) FROM amr_reports_labresult")
        return JsonResponse({
            "total_results": total,
            "unique_patients": uniq,
            "organisms_count": orgs
        })
    except Exception as e:
        return JsonResponse({"detail": f"counts_summary error: {e}"}, status=500)

# ----- safe placeholders so other tabs don't 500 -----

def resistance_time_trend(request):
    # TODO: replace with real data; keeping shape stable for the UI
    return JsonResponse({"series": []})

def antibiogram(request):
    # TODO: replace with real data
    return JsonResponse({"rows": []})

def data_quality(request):
    # TODO: replace with real checks
    return JsonResponse({"issues": []})

def facilities_geo(request):
    # Minimal GeoJSON so maps tab doesn't crash
    return JsonResponse({"type":"FeatureCollection","features":[]})

def lab_results(request):
    # Return recent rows; keep it small
    try:
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
    except Exception as e:
        return JsonResponse({"detail": f"lab_results error: {e}"}, status=500)
