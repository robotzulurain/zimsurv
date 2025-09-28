from collections import defaultdict
from datetime import date
from django.db.models import Q, Count
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import LabResult

def apply_common_filters(qs, request):
    """
    Apply filters from query params to the LabResult queryset, without touching UI.
    Supports: facility, organism, antibiotic, patient_type, sex,
              host_type/host, environment_type (host=ENVIRONMENT),
              animal_species (host=ANIMAL), and date range start/end (YYYY-MM-DD).
    """
    p = getattr(request, "query_params", getattr(request, "GET", {}))

    def val(k):
        v = p.get(k)
        if v is None:
            return None
        if isinstance(v, str):
            v = v.strip()
            if not v or v == "All":
                return None
        return v

    host = (val("host_type") or val("host"))

    if host:                qs = qs.filter(host_type=host)
    if val("organism"):     qs = qs.filter(organism=val("organism"))
    if val("antibiotic"):   qs = qs.filter(antibiotic=val("antibiotic"))
    if val("facility"):     qs = qs.filter(facility=val("facility"))
    if val("patient_type"): qs = qs.filter(patient_type=val("patient_type"))

    # Sex (accept M/F/Unknown and Male/Female)
    if val("sex"):
        s = str(val("sex"))
        low = s.lower()
        canon = "M" if low.startswith("m") else "F" if low.startswith("f") else "Unknown"
        qs = qs.filter(sex__in=[s, canon])

    # One Health specifics
    if host == "ENVIRONMENT" and val("environment_type"):
        qs = qs.filter(environment_type=val("environment_type"))
    if host == "ANIMAL" and val("animal_species"):
        qs = qs.filter(animal_species=val("animal_species"))

    # Optional date range
    if val("start"): qs = qs.filter(test_date__gte=val("start"))
    if val("end"):   qs = qs.filter(test_date__lte=val("end"))

    return qs

# ---------- helpers ----------

BINS = [(0,10),(10,20),(20,30),(30,40),(40,50),(50,60),(60,70),(70,80),(80,200)]
def age_band(age):
    a = 0 if age is None else int(max(0, min(200, age)))
    for lo, hi in BINS:
        if lo <= a < hi: return f"{lo}-{hi}" if hi!=200 else "80+"
    return "80+"

FACILITY_COORDS = {
    "Harare Central Lab":        {"lat": -17.8292, "lng": 31.0522, "province": "Harare"},
    "Bulawayo Hospital Lab":     {"lat": -20.1550, "lng": 28.5840, "province": "Bulawayo"},
    "Mutare Provincial Lab":     {"lat": -18.9730, "lng": 32.6700, "province": "Manicaland"},
    "Gweru Vet Center":          {"lat": -19.4500, "lng": 29.8167, "province": "Midlands"},
}

def pct(n, d):
    return round((100.0 * n / d), 1) if d else 0.0

# ---------- options ----------

class OptionsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, *args, **kwargs):
        hosts = ["HUMAN", "ANIMAL", "ENVIRONMENT"]

        # Pull distincts directly (simple & explicit)
        environment_types = list(
            LabResult.objects
            .exclude(environment_type__isnull=True).exclude(environment_type__exact="")
            .values_list("environment_type", flat=True).distinct().order_by("environment_type")
        )
        animal_species = list(
            LabResult.objects
            .exclude(animal_species__isnull=True).exclude(animal_species__exact="")
            .values_list("animal_species", flat=True).distinct().order_by("animal_species")
        )

        # (Keep other arrays too to avoid breaking frontend)
        facilities = list(
            LabResult.objects
            .exclude(facility__isnull=True).exclude(facility__exact="")
            .values_list("facility", flat=True).distinct().order_by("facility")
        )
        organisms = list(
            LabResult.objects
            .exclude(organism__isnull=True).exclude(organism__exact="")
            .values_list("organism", flat=True).distinct().order_by("organism")
        )
        antibiotics = list(
            LabResult.objects
            .exclude(antibiotic__isnull=True).exclude(antibiotic__exact="")
            .values_list("antibiotic", flat=True).distinct().order_by("antibiotic")
        )

        return Response({
            "hosts": hosts,
            "facilities": facilities,
            "organisms": organisms,
            "antibiotics": antibiotics,
            "environment_types": environment_types or [],
            "animal_species": animal_species or [],
        })

class CountsSummaryView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        qs = apply_common_filters(LabResult.objects.all(), request)
        total = qs.count()
        unique_patients = qs.exclude(patient_id="").values("patient_id").distinct().count()
        r = qs.filter(ast_result="R").count()
        return Response({
            "total_results": total,
            "unique_patients": unique_patients,
            "pct_resistant": pct(r, total),
        })

# ---------- summary: time trends ----------
class TimeTrendsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        period = (request.query_params.get("period") or "month").lower()
        qs = apply_common_filters(LabResult.objects.exclude(test_date=None), request).values("test_date","ast_result")
        buckets = defaultdict(lambda: {"tests":0, "R":0})
        for row in qs:
            d = row["test_date"]
            if not isinstance(d, date):
                continue
            if period == "day":
                key = d.strftime("%Y-%m-%d")
            elif period == "quarter":
                q = (d.month-1)//3 + 1
                key = f"{d.year}-Q{q}"
            elif period == "year":
                key = f"{d.year}"
            else:
                key = d.strftime("%Y-%m")
            buckets[key]["tests"] += 1
            if row["ast_result"] == "R":
                buckets[key]["R"] += 1
        out = []
        for k in sorted(buckets.keys()):
            tests = buckets[k]["tests"]; R = buckets[k]["R"]
            out.append({"date": k, "tests": tests, "pct_r": pct(R, tests)})
        return Response(out)

# ---------- summary: antibiogram ----------
class AntibiogramView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        qs = apply_common_filters(LabResult.objects.all(), request).values("organism","antibiotic","ast_result")
        agg = defaultdict(lambda: {"R":0,"I":0,"S":0})
        for row in qs:
            o = row["organism"] or "Unknown"; a = row["antibiotic"] or "Unknown"; res = row["ast_result"] or ""
            agg[(o,a)][res] = agg[(o,a)].get(res,0) + 1
        out = []
        for (o,a), counts in agg.items():
            out.append({"organism": o, "antibiotic": a, "R": counts.get("R",0), "I": counts.get("I",0), "S": counts.get("S",0)})
        out.sort(key=lambda x: (x["organism"], x["antibiotic"]))
        return Response(out)

# ---------- summary: sex & age ----------
class SexAgeView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        qs = apply_common_filters(LabResult.objects.all(), request).values("age","sex","ast_result")
        by_band_sex = defaultdict(lambda: {"R":0,"I":0,"S":0})
        sex_totals = defaultdict(lambda: {"R":0,"I":0,"S":0,"total":0})
        for row in qs:
            # age*sex joint
            band = age_band(row["age"])
            sex = row["sex"] or "Unknown"
            res = row["ast_result"] or ""
            key = (band, "Male" if sex in ("M","Male") else "Female" if sex in ("F","Female") else "Unknown")
            by_band_sex[key][res] = by_band_sex[key].get(res,0) + 1
            # per-sex totals
            sex_key = "Male" if sex in ("M","Male") else "Female" if sex in ("F","Female") else "Unknown"
            sex_totals[sex_key][res] = sex_totals[sex_key].get(res,0) + 1
            sex_totals[sex_key]["total"] += 1
        joint = []
        for (band, sex), counts in by_band_sex.items():
            joint.append({
                "age_band": band, "sex": sex,
                "R": counts.get("R",0), "I": counts.get("I",0), "S": counts.get("S",0),
                "total": counts.get("R",0)+counts.get("I",0)+counts.get("S",0),
            })
        return Response({"age_sex_joint": joint, "sex": { k:v for k,v in sex_totals.items() }})

# ---------- geo ----------
class GeoFacilitiesView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        qs = apply_common_filters(LabResult.objects.all(), request).values("facility").annotate(n=Count("id")).order_by("-n")
        facilities = []
        for row in qs:
            name = row["facility"] or "Unknown"
            coords = FACILITY_COORDS.get(name)
            if not coords:
                continue
            facilities.append({
                "id": name, "name": name,
                "lat": coords["lat"], "lng": coords["lng"],
                "province": coords.get("province",""), "count": row["n"],
            })
        return Response({"facilities": facilities})

# ---------- reports ----------
class ReportSummaryView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        return CountsSummaryView().get(request)

class ReportFacilityLeagueView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        qs = apply_common_filters(LabResult.objects.all(), request)
        base = qs.values("facility").annotate(
            tests=Count("id"),
            r=Count("id", filter=Q(ast_result="R"))
        )
        out=[]
        for row in base:
            fac = row["facility"] or "Unknown"
            tests = row["tests"]
            out.append({
                "facility": fac,
                "tests": tests,
                "pct_r": pct(row["r"], tests),
                "completeness": "",
            })
        out.sort(key=lambda x: (-x["tests"], x["facility"]))
        return Response(out)

class ReportAntibiogramView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        return AntibiogramView().get(request)

# ---------- alerts (placeholder) ----------
class AlertsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    def get(self, request):
        return Response([])
