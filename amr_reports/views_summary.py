from django.http import JsonResponse
from django.db import connection
from datetime import datetime

# --- helpers ---
def _q(sql, params=None):
    with connection.cursor() as cur:
        cur.execute(sql, params or [])
        return cur.fetchall()

def _q1(sql, params=None, default=0):
    rows = _q(sql, params)
    return rows[0][0] if rows and rows[0] and rows[0][0] is not None else default

# --- Home counts ---
def counts_summary(request):
    try:
        total = _q1("SELECT COUNT(*) FROM amr_reports_labresult")
        uniq  = _q1("SELECT COUNT(DISTINCT patient_id) FROM amr_reports_labresult")
        orgs  = _q1("SELECT COUNT(DISTINCT organism) FROM amr_reports_labresult")
        return JsonResponse({"total_results": total, "unique_patients": uniq, "organisms_count": orgs})
    except Exception as e:
        return JsonResponse({"total_results": 0, "unique_patients": 0, "organisms_count": 0, "detail": str(e)})

# --- Trends: monthly resistance, with optional filters ---
def resistance_time_trend(request):
    organism  = request.GET.get("organism")
    antibiotic = request.GET.get("antibiotic")
    host      = request.GET.get("host")

    sql = """
    SELECT strftime('%Y-%m', test_date) AS month,
           COUNT(*) AS total,
           SUM(CASE WHEN ast_result='R' THEN 1 ELSE 0 END) AS resistant
    FROM amr_reports_labresult
    WHERE 1=1
    """
    params = []
    if organism:
        sql += " AND organism = ?"
        params.append(organism)
    if antibiotic:
        sql += " AND antibiotic = ?"
        params.append(antibiotic)
    if host:
        sql += " AND host_type = ?"
        params.append(host)

    sql += " GROUP BY month ORDER BY month"

    try:
        rows = _q(sql, params)
        out = []
        for m, total, resistant in rows:
            total = total or 0
            resistant = resistant or 0
            pct = round((resistant/total)*100, 2) if total else 0
            out.append({"month": m, "total": total, "resistant": resistant, "percent_R": pct})
        return JsonResponse(out, safe=False)
    except Exception as e:
        return JsonResponse([], safe=False)

# --- Resistance compare/heatmap source: by organism+antibiotic (optionally host) ---
def antibiogram(request):
    host = request.GET.get("host")
    sql = """
    SELECT organism, antibiotic,
           COUNT(*) AS total,
           SUM(CASE WHEN ast_result='R' THEN 1 ELSE 0 END) AS resistant
    FROM amr_reports_labresult
    WHERE 1=1
    """
    params = []
    if host:
        sql += " AND host_type = ?"
        params.append(host)

    sql += " GROUP BY organism, antibiotic ORDER BY organism, antibiotic"

    try:
        rows = _q(sql, params)
        out = []
        for org, abx, total, resistant in rows:
            total = total or 0
            resistant = resistant or 0
            pct = round((resistant/total)*100, 2) if total else 0
            out.append({"organism": org, "antibiotic": abx, "total": total, "resistant": resistant, "percent_R": pct})
        return JsonResponse(out, safe=False)
    except Exception as e:
        return JsonResponse([], safe=False)

# --- Sex & Age matrix with filters ---
AGE_BANDS = [
    ("0-4",   0,  4),
    ("5-14",  5, 14),
    ("15-24", 15,24),
    ("25-34", 25,34),
    ("35-44", 35,44),
    ("45-54", 45,54),
    ("55-64", 55,64),
    ("65+",   65,200),
]

def sex_age_matrix(request):
    organism  = request.GET.get("organism")
    antibiotic = request.GET.get("antibiotic")
    host      = request.GET.get("host")

    # Build a per-band count by sex
    def band_sql(min_age, max_age):
        base = """
        SELECT sex, COUNT(*) FROM amr_reports_labresult
        WHERE age BETWEEN ? AND ?
        """
        params = [min_age, max_age]
        if organism:
            base += " AND organism = ?"
            params.append(organism)
        if antibiotic:
            base += " AND antibiotic = ?"
            params.append(antibiotic)
        if host:
            base += " AND host_type = ?"
            params.append(host)
        base += " GROUP BY sex"
        return base, params

    try:
        result = []
        for label, a_min, a_max in AGE_BANDS:
            sql, params = band_sql(a_min, a_max)
            rows = _q(sql, params)
            by_sex = {"M":0, "F":0, "U":0}  # treat unknown/non-M/F as U
            total = 0
            for sex, cnt in rows:
                s = sex or "U"
                s = s if s in ("M","F") else "U"
                by_sex[s] += cnt
                total += cnt
            result.append({"band": label, "M": by_sex["M"], "F": by_sex["F"], "U": by_sex["U"], "total": total})
        return JsonResponse(result, safe=False)
    except Exception as e:
        return JsonResponse([], safe=False)

# --- Data quality (kept simple) ---
def data_quality(request):
    try:
        # missing counts per column
        cols = ["patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","test_date","host_type"]
        missing = {}
        for c in cols:
            missing[c] = _q1(f"SELECT COUNT(*) FROM amr_reports_labresult WHERE {c} IS NULL OR TRIM(COALESCE({c},''))=''", default=0)

        # duplicates (very simple: same patient_id + test_date + antibiotic)
        dup = _q1("""
            SELECT COUNT(*) FROM (
              SELECT patient_id, test_date, antibiotic, COUNT(*) as n
              FROM amr_reports_labresult
              GROUP BY patient_id, test_date, antibiotic
              HAVING n > 1
            ) t
        """, default=0)
        return JsonResponse({"missing": missing, "duplicates": dup})
    except Exception as e:
        return JsonResponse({"missing": {}, "duplicates": 0})
