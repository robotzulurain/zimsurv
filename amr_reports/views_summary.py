from django.http import JsonResponse
from django.db import connection, OperationalError, DatabaseError
from datetime import datetime

def _safe_execute_one(sql, args=None, default=0):
    try:
        with connection.cursor() as cur:
            cur.execute(sql, args or [])
            row = cur.fetchone()
            return row[0] if row else default
    except (OperationalError, DatabaseError, Exception):
        return default

def counts_summary(request):
    """
    Returns totals. Never raises: returns zeros on any DB issue.
    """
    total = _safe_execute_one("SELECT COUNT(*) FROM amr_reports_labresult", default=0)
    uniq  = _safe_execute_one("SELECT COUNT(DISTINCT patient_id) FROM amr_reports_labresult", default=0)
    orgs  = _safe_execute_one("SELECT COUNT(DISTINCT organism) FROM amr_reports_labresult", default=0)
    return JsonResponse({"total_results": total, "unique_patients": uniq, "organisms_count": orgs})

def resistance_time_trend(request):
    """
    Month-level resistant % over time. Returns empty list on any issue.
    """
    try:
        with connection.cursor() as cur:
            cur.execute("""
                SELECT strftime('%Y-%m', test_date) AS ym,
                       COUNT(*) AS total,
                       SUM(CASE WHEN ast_result='R' THEN 1 ELSE 0 END) AS resistant
                FROM amr_reports_labresult
                WHERE test_date IS NOT NULL
                GROUP BY ym
                ORDER BY ym
            """)
            rows = cur.fetchall()
        out = []
        for ym, total, resistant in rows:
            if not total:
                pct = 0.0
            else:
                pct = round((resistant or 0) * 100.0 / total, 2)
            out.append({"month": ym, "total": total or 0, "resistant": resistant or 0, "percent_R": pct})
        return JsonResponse(out, safe=False)
    except Exception:
        return JsonResponse([], safe=False)

def antibiogram(request):
    """
    Heatmap/compare data: organism x antibiotic %R. Empty list on error.
    """
    try:
        with connection.cursor() as cur:
            cur.execute("""
                SELECT organism, antibiotic,
                       SUM(CASE WHEN ast_result='R' THEN 1 ELSE 0 END) AS r_cnt,
                       COUNT(*) AS total
                FROM amr_reports_labresult
                WHERE organism IS NOT NULL AND antibiotic IS NOT NULL
                GROUP BY organism, antibiotic
            """)
            rows = cur.fetchall()
        out = []
        for organism, antibiotic, r_cnt, total in rows:
            pctR = round((r_cnt or 0) * 100.0 / total, 2) if total else 0.0
            out.append({"organism": organism, "antibiotic": antibiotic, "total": total or 0, "resistant": r_cnt or 0, "percent_R": pctR})
        return JsonResponse(out, safe=False)
    except Exception:
        return JsonResponse([], safe=False)

def data_quality(request):
    """
    Missing fields & duplicate patient_id approx. Returns safe defaults.
    """
    fields = ["patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","test_date","host_type"]
    missing = {f: 0 for f in fields}
    duplicates = 0
    try:
        with connection.cursor() as cur:
            for f in fields:
                cur.execute(f"SELECT COUNT(*) FROM amr_reports_labresult WHERE {f} IS NULL OR {f}=''", [])
                missing[f] = cur.fetchone()[0] or 0
            cur.execute("""
                SELECT SUM(cnt - 1) FROM (
                    SELECT patient_id, COUNT(*) AS cnt
                    FROM amr_reports_labresult
                    WHERE patient_id IS NOT NULL AND patient_id <> ''
                    GROUP BY patient_id
                    HAVING COUNT(*) > 1
                )
            """)
            row = cur.fetchone()
            duplicates = (row[0] if row and row[0] is not None else 0)
    except Exception:
        pass
    return JsonResponse({"missing": missing, "duplicates": duplicates})

def facilities_geo(request):
    """
    Minimal geo: group by facility with counts. Empty list on error.
    """
    try:
        with connection.cursor() as cur:
            cur.execute("""
                SELECT COALESCE(facility,'Unknown') AS fac, COUNT(*) AS cnt
                FROM amr_reports_labresult
                GROUP BY fac
                ORDER BY cnt DESC
                LIMIT 200
            """)
            rows = cur.fetchall()
        out = [{"facility": fac, "count": cnt} for fac, cnt in rows]
        return JsonResponse(out, safe=False)
    except Exception:
        return JsonResponse([], safe=False)

def lab_results(request):
    """
    Return recent lab results safely. Empty on any issue.
    """
    try:
        with connection.cursor() as cur:
            # Use only columns that are very likely to exist
            cur.execute("""
                SELECT id, patient_id, sex, age, specimen_type, organism, antibiotic, ast_result, test_date, host_type
                FROM amr_reports_labresult
                ORDER BY test_date DESC, id DESC
                LIMIT 200
            """)
            cols = [c[0] for c in cur.description]
            rows = cur.fetchall()
        results = [dict(zip(cols, r)) for r in rows]
        return JsonResponse({"results": results})
    except Exception:
        return JsonResponse({"results": []})
