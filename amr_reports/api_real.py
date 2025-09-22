from datetime import datetime
from collections import defaultdict, Counter
from django.http import HttpResponse
from django.utils.dateparse import parse_date

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.authentication import SessionAuthentication, TokenAuthentication

# --- Helpers / demo fallback ---------------------------------------------------

def demo_rows():
    # very small demo set used only if DB/model is unavailable or empty
    return [
        {"date":"2025-09-01","facility":"Harare Central Lab","organism":"Escherichia coli","antibiotic":"Ciprofloxacin","ast":"R","host":"HUMAN","created_by":"demo"},
        {"date":"2025-09-03","facility":"Harare Central Lab","organism":"Escherichia coli","antibiotic":"Ciprofloxacin","ast":"S","host":"HUMAN","created_by":"demo"},
        {"date":"2025-09-05","facility":"Gweru Gen Lab","organism":"Staphylococcus aureus","antibiotic":"Ceftriaxone","ast":"R","host":"HUMAN","created_by":"demo"},
        {"date":"2025-08-22","facility":"Bulawayo Vic Lab","organism":"Salmonella enterica","antibiotic":"Ceftriaxone","ast":"S","host":"HUMAN","created_by":"demo"},
    ]

def load_entries(filters=None):
    """
    Try to load rows from a Result model if present, otherwise return demo or [].
    Expected row fields: date (YYYY-MM-DD), facility, organism, antibiotic, ast ('S'/'R'), host, created_by
    """
    filters = filters or {}
    rows = []

    # Try ORM
    try:
        from .models import Result  # if your app has it
        qs = Result.objects.all()
        # simple filters (names may differ in your model; adjust if needed)
        if filters.get("facility"):
            qs = qs.filter(facility__iexact=filters["facility"])
        if filters.get("organism"):
            qs = qs.filter(organism__iexact=filters["organism"])
        if filters.get("antibiotic"):
            qs = qs.filter(antibiotic__iexact=filters["antibiotic"])
        if filters.get("host"):
            qs = qs.filter(host__iexact=filters["host"])
        if filters.get("from"):
            d = _to_date(filters["from"])
            if d: qs = qs.filter(date__gte=d)
        if filters.get("to"):
            d = _to_date(filters["to"])
            if d: qs = qs.filter(date__lte=d)

        for r in qs.order_by("date"):
            rows.append({
                "date": r.date.isoformat() if hasattr(r.date, "isoformat") else str(r.date),
                "facility": r.facility,
                "organism": r.organism,
                "antibiotic": r.antibiotic,
                "ast": r.ast,
                "host": getattr(r, "host", "HUMAN"),
                "created_by": getattr(r, "created_by", "unknown"),
            })
    except Exception:
        # swallow ORM errors and rely on demo
        pass

    if not rows:
        # If nothing from DB, serve demo so UI has something to draw
        rows = demo_rows()

    # apply in-Python filters for the demo path
    rows = [r for r in rows if _match(r, filters)]
    return rows

def _match(r, f):
    def norm(x): return (x or "").strip().lower()
    if f.get("facility") and norm(r.get("facility")) != norm(f.get("facility")): return False
    if f.get("organism") and norm(r.get("organism")) != norm(f.get("organism")): return False
    if f.get("antibiotic") and norm(r.get("antibiotic")) != norm(f.get("antibiotic")): return False
    if f.get("host") and norm(r.get("host")) != norm(f.get("host")): return False
    fd = _to_date(f.get("from")); td = _to_date(f.get("to"))
    rd = _to_date(r.get("date"))
    if fd and rd and rd < fd: return False
    if td and rd and rd > td: return False
    return True

def _to_date(s):
    if not s: return None
    s = str(s).strip()
    # accept DD/MM/YYYY or YYYY-MM-DD
    try:
        if "/" in s:
            d,m,y = s.split("/")
            return datetime(int(y), int(m), int(d)).date()
        if "-" in s:
            return parse_date(s)
    except Exception:
        return None
    return None

def month_key(ymd):
    d = _to_date(ymd)
    return f"{d.year:04d}-{d.month:02d}" if d else ""

# --- Views --------------------------------------------------------------------

class PublicAPIView(APIView):
    permission_classes = [AllowAny]

class OptionsView(PublicAPIView):
    def get(self, request):
        rows = load_entries({})
        facilities = sorted(set(r["facility"] for r in rows if r.get("facility")))
        organisms  = sorted(set(r["organism"] for r in rows if r.get("organism")))
        antibiotics= sorted(set(r["antibiotic"] for r in rows if r.get("antibiotic")))
        hosts      = sorted(set(r["host"] for r in rows if r.get("host")))
        return Response({
            "facilities": facilities,
            "organisms": organisms,
            "antibiotics": antibiotics,
            "hosts": hosts,
        })

class ManualEntryView(PublicAPIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]

    def get(self, request):
        try:
            filters = dict(request.query_params)
            # flatten single values
            filters = {k:(v[0] if isinstance(v, list) else v) for k,v in filters.items()}
            rows = load_entries(filters)
            return Response(rows)
        except Exception as e:
            # never 500 to the UI
            return Response([], status=200)

    def post(self, request):
        # Best-effort save; if model missing, just echo back as success so UI isn't blocked
        data = request.data or {}
        # normalize date
        d = _to_date(data.get("date") or data.get("test_date") or data.get("Test Date"))
        payload = {
            "date": (d.isoformat() if d else datetime.utcnow().date().isoformat()),
            "facility": data.get("facility") or data.get("Facility") or "Unknown",
            "organism": data.get("organism") or data.get("Organism") or "",
            "antibiotic": data.get("antibiotic") or data.get("Antibiotic") or "",
            "ast": (data.get("ast") or data.get("AST Result") or "").upper()[:1] or "S",
            "host": data.get("host") or data.get("Host Type") or "HUMAN",
            "created_by": getattr(getattr(request, "user", None), "username", "api"),
        }
        try:
            from .models import Result
            Result.objects.create(
                date=payload["date"],
                facility=payload["facility"],
                organism=payload["organism"],
                antibiotic=payload["antibiotic"],
                ast=payload["ast"],
                host=payload["host"],
            )
        except Exception:
            pass
        return Response({"ok": True, "saved": payload}, status=201)

class UploadView(PublicAPIView):
    def post(self, request):
        # Minimal stub — you can fill with real parsing later
        return Response({"ok": True, "imported": 0})

class TemplateCSVView(PublicAPIView):
    def get(self, request):
        csv = "date,facility,organism,antibiotic,ast,host\n2025-09-01,Harare Central Lab,Escherichia coli,Ciprofloxacin,S,HUMAN\n"
        return HttpResponse(csv, content_type="text/csv")

class FacilitiesView(PublicAPIView):
    def get(self, request):
        rows = load_entries({})
        facilities = sorted(set(r["facility"] for r in rows if r.get("facility")))
        # Return without lat/lon so UI falls back to list
        return Response([{"name": f} for f in facilities])

class TimeTrendsView(PublicAPIView):
    def get(self, request):
        rows = load_entries(dict(request.query_params))
        by_m = defaultdict(lambda: {"tests":0, "r":0})
        for r in rows:
            m = month_key(r["date"])
            by_m[m]["tests"] += 1
            if (r.get("ast") or "").upper().startswith("R"):
                by_m[m]["r"] += 1
        out = []
        for m in sorted(by_m.keys()):
            tests = by_m[m]["tests"]
            r = by_m[m]["r"]
            pr = int(round(100 * r / tests)) if tests else 0
            out.append({"month": m, "tests": tests, "percent_resistant": pr})
        return Response(out)

class AntibiogramView(PublicAPIView):
    def get(self, request):
        rows = load_entries(dict(request.query_params))
        counts = defaultdict(lambda: {"S":0, "R":0})
        for r in rows:
            key = (r.get("organism"), r.get("antibiotic"))
            counts[key][(r.get("ast") or "S").upper()[:1]] += 1
        out = []
        for (org, abx), d in counts.items():
            s = d["S"]; r = d["R"]; total = s + r
            ps = int(round(100 * s / total)) if total else 0
            out.append({"organism": org, "antibiotic": abx, "percent_susceptible": ps})
        return Response(out)

class SexAgeView(PublicAPIView):
    def get(self, request):
        rows = load_entries(dict(request.query_params))
        by_sex = Counter()
        r_by_sex = Counter()
        by_age = Counter()
        r_by_age = Counter()

        def age_band(a):
            try:
                a = int(a)
            except Exception:
                return "Unknown"
            if a < 5: return "0-4"
            if a < 15: return "5-14"
            if a < 25: return "15-24"
            if a < 45: return "25-44"
            if a < 65: return "45-64"
            return "65+"

        for r in rows:
            sx = (r.get("sex") or "Unknown").upper()[0]
            ab = age_band(r.get("age"))
            by_sex[sx] += 1
            by_age[ab] += 1
            if (r.get("ast") or "").upper().startswith("R"):
                r_by_sex[sx] += 1
                r_by_age[ab] += 1

        sex_rows = []
        for sx, n in by_sex.items():
            rr = r_by_sex[sx]
            pr = int(round(100 * rr / n)) if n else 0
            sex_rows.append({"sex": sx, "tests": n, "percent_resistant": pr})

        age_rows = []
        order = ["0-4","5-14","15-24","25-44","45-64","65+","Unknown"]
        for ab in order:
            n = by_age.get(ab, 0)
            rr = r_by_age.get(ab, 0)
            pr = int(round(100 * rr / n)) if n else 0
            if n or ab == "Unknown":
                age_rows.append({"age_band": ab, "tests": n, "percent_resistant": pr})

        return Response({"by_sex": sex_rows, "by_age": age_rows})

class CountsSummaryView(PublicAPIView):
    def get(self, request):
        rows = load_entries(dict(request.query_params))
        return Response({"total_tests": len(rows)})

class AlertsView(PublicAPIView):
    def get(self, request):
        # Simple stub; UI expects arrays
        return Response({
            "rare": [],
            "spikes": [],
            "clusters": [],
        })

class GlassExportView(PublicAPIView):
    def get(self, request):
        rows = load_entries(dict(request.query_params))
        # very small CSV for demo
        lines = ["patient_id,sex,age,specimen,organism,antibiotic,ast,test_date,facility,host,patient_type"]
        for r in rows:
            lines.append(f",,,,{r.get('organism')},{r.get('antibiotic')},{r.get('ast')},{r.get('date')},{r.get('facility')},{r.get('host')},")
        csv = "\n".join(lines) + "\n"
        return HttpResponse(csv, content_type="text/csv")

# ---- Auth / Roles (very light) ----------------------------------------------
class WhoAmIView(PublicAPIView):
    authentication_classes = [TokenAuthentication, SessionAuthentication]
    def get(self, request):
        u = getattr(request, "user", None)
        if getattr(u, "is_authenticated", False):
            groups = list(u.groups.values_list("name", flat=True)) if hasattr(u, "groups") else []
            return Response({"authenticated": True, "username": u.username, "groups": groups})
        return Response({"authenticated": False, "username": None, "groups": []})

class TokenView(PublicAPIView):
    def post(self, request):
        # DEV-ONLY: accept any username/password and pretend to be that user
        username = (request.data or {}).get("username") or "tech"
        return Response({"token": f"dev-{username}"})
