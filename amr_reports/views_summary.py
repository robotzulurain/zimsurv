from django.http import JsonResponse
from django.db import connection
from datetime import datetime

def _q1(sql, args=None):
    with connection.cursor() as cur:
        cur.execute(sql, args or [])
        row = cur.fetchone()
        return row[0] if row else 0

def counts_summary(request):
    """Simple totals used on Home."""
    try:
        total = _q1("SELECT COUNT(*) FROM amr_reports_labresult")
        uniq  = _q1("SELECT COUNT(DISTINCT patient_id) FROM amr_reports_labresult")
        orgs  = _q1("SELECT COUNT(DISTINCT organism) FROM amr_reports_labresult")
        return JsonResponse({"total_results": total, "unique_patients": uniq, "organisms_count": orgs})
    except Exception as e:
        return JsonResponse({"total_results": 0, "unique_patients": 0, "organisms_count": 0, "detail": f"counts_summary error: {e}"})

def resistance_time_trend(request):
    """
    Monthly trend of %R (by ast_result = 'R').
    Returns: {"window":"monthly","series":[{"month":"YYYY-MM","total":N,"resistant":R,"percent_R":float}, ...]}
    """
    try:
        with connection.cursor() as cur:
            # Make sure table & columns exist
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='amr_reports_labresult'")
            if not cur.fetchone():
                return JsonResponse({"window":"monthly","series":[]})

            cur.execute("PRAGMA table_info(amr_reports_labresult)")
            cols = {r[1] for r in cur.fetchall()}
            if "test_date" not in cols or "ast_result" not in cols:
                return JsonResponse({"window":"monthly","series":[]})

            # SQLite strftime('%Y-%m', test_date) buckets by month
            cur.execute("""
                SELECT strftime('%Y-%m', test_date) AS ym,
                       COUNT(*) AS total,
                       SUM(CASE WHEN ast_result='R' THEN 1 ELSE 0 END) AS r
                FROM amr_reports_labresult
                WHERE test_date IS NOT NULL
                GROUP BY ym
                ORDER BY ym
            """)
            series=[]
            for ym, total, r in cur.fetchall():
                total = total or 0
                r = r or 0
                pct = (r*100.0/total) if total else 0.0
                series.append({"month": ym, "total": total, "resistant": r, "percent_R": round(pct,2)})
            return JsonResponse({"window":"monthly","series": series})
    except Exception as e:
        return JsonResponse({"window":"monthly","series": [], "detail": f"resistance_time_trend error: {e}"}, status=200)

def antibiogram(request):
    """
    Heatmap source: organism x antibiotic %R.
    Returns: {"rows":[{"organism": "...", "antibiotic":"...", "n":N, "r":R, "percent_R": float}, ...]}
    """
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='amr_reports_labresult'")
            if not cur.fetchone():
                return JsonResponse({"rows": []})
            cur.execute("PRAGMA table_info(amr_reports_labresult)")
            cols = {r[1] for r in cur.fetchall()}
            needed = {"organism","antibiotic","ast_result"}
            if not needed.issubset(cols):
                return JsonResponse({"rows": []})

            cur.execute("""
                SELECT organism, antibiotic,
                       COUNT(*) AS n,
                       SUM(CASE WHEN ast_result='R' THEN 1 ELSE 0 END) AS r
                FROM amr_reports_labresult
                WHERE organism IS NOT NULL AND antibiotic IS NOT NULL
                GROUP BY organism, antibiotic
                HAVING n > 0
                ORDER BY organism, antibiotic
            """)
            rows=[]
            for organism, antibiotic, n, r in cur.fetchall():
                n = n or 0; r = r or 0
                pct = (r*100.0/n) if n else 0.0
                rows.append({"organism": organism, "antibiotic": antibiotic, "n": n, "r": r, "percent_R": round(pct,2)})
            return JsonResponse({"rows": rows})
    except Exception as e:
        return JsonResponse({"rows": [], "detail": f"antibiogram error: {e}"}, status=200)

def data_quality(request):
    """
    Basic data-quality metrics:
      - missing counts per important column
      - simple duplicate count by (patient_id, specimen_type, test_date)
    Returns: {"missing": {"patient_id": X, ...}, "duplicates": N}
    """
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='amr_reports_labresult'")
            if not cur.fetchone():
                return JsonResponse({"missing": {}, "duplicates": 0})

            cur.execute("PRAGMA table_info(amr_reports_labresult)")
            cols = {r[1] for r in cur.fetchall()}

            important = ["patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","test_date","host_type"]
            missing = {}
            for c in important:
                if c in cols:
                    cur.execute(f"SELECT COUNT(*) FROM amr_reports_labresult WHERE {c} IS NULL OR {c}=''")
                    missing[c] = cur.fetchone()[0]
            # dup key (only if all columns exist)
            key = ["patient_id","specimen_type","test_date"]
            if all(k in cols for k in key):
                cur.execute("""
                  SELECT SUM(cnt - 1) FROM (
                    SELECT patient_id, specimen_type, test_date, COUNT(*) AS cnt
                    FROM amr_reports_labresult
                    WHERE patient_id!='' AND specimen_type!='' AND test_date IS NOT NULL
                    GROUP BY 1,2,3
                    HAVING cnt > 1
                  )
                """)
                dups = cur.fetchone()[0] or 0
            else:
                dups = 0

            return JsonResponse({"missing": missing, "duplicates": dups})
    except Exception as e:
        return JsonResponse({"missing": {}, "duplicates": 0, "detail": f"data_quality error: {e}"}, status=200)

def facilities_geo(request):
    """
    If your DB has facility coords (columns: facility, latitude, longitude) we return GeoJSON-like.
    Otherwise, return a safe empty FeatureCollection plus counts by facility.
    """
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='amr_reports_labresult'")
            if not cur.fetchone():
                return JsonResponse({"type":"FeatureCollection","features": [], "by_facility": []})

            cur.execute("PRAGMA table_info(amr_reports_labresult)")
            cols = {r[1] for r in cur.fetchall()}

            # fallback: counts by facility (works even if no coords)
            by_facility=[]
            if "facility" in cols:
                cur.execute("""
                    SELECT facility, COUNT(*) AS n
                    FROM amr_reports_labresult
                    WHERE facility IS NOT NULL AND facility!=''
                    GROUP BY facility
                    ORDER BY n DESC, facility
                    LIMIT 200
                """)
                by_facility = [{"facility": f or "", "n": n or 0} for f,n in cur.fetchall()]

            # If latitude/longitude are present, emit features
            if {"facility","latitude","longitude"}.issubset(cols):
                cur.execute("""
                    SELECT facility, latitude, longitude, COUNT(*) AS n
                    FROM amr_reports_labresult
                    WHERE facility!='' AND latitude IS NOT NULL AND longitude IS NOT NULL
                    GROUP BY facility, latitude, longitude
                """)
                feats=[]
                for fac, lat, lon, n in cur.fetchall():
                    feats.append({
                        "type":"Feature",
                        "geometry":{"type":"Point","coordinates":[float(lon), float(lat)]},
                        "properties":{"facility": fac, "n": int(n)}
                    })
                return JsonResponse({"type":"FeatureCollection","features": feats, "by_facility": by_facility})

            # no coords → safe empty features + counts
            return JsonResponse({"type":"FeatureCollection","features": [], "by_facility": by_facility})
    except Exception as e:
        return JsonResponse({"type":"FeatureCollection","features": [], "by_facility": [], "detail": f"facilities_geo error: {e}"}, status=200)

# ---- Lab results (already wired) but keep defensive if imported elsewhere ----
def lab_results(request):
    """Return recent lab results selecting only columns that exist."""
    try:
        with connection.cursor() as cur:
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='amr_reports_labresult'")
            if not cur.fetchone():
                return JsonResponse({"results": []})

            cur.execute("PRAGMA table_info(amr_reports_labresult)")
            cols_in_db = {row[1] for row in cur.fetchall()}
            preferred = [
                "id","patient_id","sex","age","specimen_type","organism",
                "antibiotic","ast_result","test_date","host_type","facility"
            ]
            actual = [c for c in preferred if c in cols_in_db]
            if not actual:
                return JsonResponse({"results": []})
            sql = "SELECT " + ",".join(actual) + " FROM amr_reports_labresult ORDER BY test_date DESC, id DESC LIMIT 100"
            cur.execute(sql)
            rows = cur.fetchall()
            results = []
            for r in rows:
                d = dict(zip(actual, r))
                # coerce date to ISO
                if "test_date" in d and d["test_date"]:
                    try:
                        if isinstance(d["test_date"], str):
                            d["test_date"] = d["test_date"][:10]
                        else:
                            d["test_date"] = d["test_date"].isoformat()[:10]
                    except Exception:
                        pass
                results.append(d)
            return JsonResponse({"results": results})
    except Exception as e:
        return JsonResponse({"results": [], "detail": f"lab_results error: {e}"}, status=200)
