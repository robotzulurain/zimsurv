from collections import defaultdict
from datetime import datetime
from django.db.models import Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import LabResult

def _norm(x): 
    return (x or "").strip()

def _is_all(x):
    return x is None or _norm(x).lower() == "all"

def _safe_date(s):
    s = (s or "").strip()
    if not s:
        return None
    # support YYYY-MM-DD and dd/mm/yyyy
    try:
        if "-" in s:
            return datetime.fromisoformat(s)
        if "/" in s:
            d, m, y = s.split("/")
            return datetime(int(y), int(m), int(d))
    except Exception:
        return None
    return None

# Bin ages: 0–9, 10–19, ..., 70–79, 80+
def _age_bin(age):
    if age is None:
        return "Unknown"
    try:
        a = int(age)
    except Exception:
        return "Unknown"
    if a < 0:
        return "Unknown"
    if a >= 80:
        return "80+"
    lo = (a // 10) * 10
    hi = lo + 9
    return f"{lo}–{hi}"

def _apply_filters(qs, request):
    facility   = request.GET.get("facility")
    organism   = request.GET.get("organism")
    antibiotic = request.GET.get("antibiotic")
    host       = request.GET.get("host")
    patient    = request.GET.get("patient_type")
    start      = _safe_date(request.GET.get("start"))
    end        = _safe_date(request.GET.get("end"))

    if not _is_all(facility):
        qs = qs.filter(facility__iexact=_norm(facility))
    if not _is_all(organism):
        qs = qs.filter(organism__iexact=_norm(organism))
    if not _is_all(antibiotic):
        qs = qs.filter(antibiotic__iexact=_norm(antibiotic))
    if not _is_all(host):
        qs = qs.filter(host_type__iexact=_norm(host))
    if not _is_all(patient):
        qs = qs.filter(patient_type__iexact=_norm(patient))
    if start:
        qs = qs.filter(test_date__gte=start)
    if end:
        qs = qs.filter(test_date__lte=end)
    return qs

@api_view(["GET"])
@permission_classes([AllowAny])
def sex_age(request):
    """
    Returns:
    {
      "sex":      [ { "sex":"Male",   "R":n, "I":n, "S":n, "total":n, "pctR":float }, ... ],
      "age_bins": [ { "bin":"0–9",    "R":n, "I":n, "S":n, "total":n, "pctR":float }, ... ]
    }
    """
    qs = _apply_filters(LabResult.objects.all(), request)

    # Pull just what we need
    rows = qs.values("sex", "age", "ast_result")

    # Aggregators
    sex_counts = defaultdict(lambda: {"R":0, "I":0, "S":0, "total":0})
    age_counts = defaultdict(lambda: {"R":0, "I":0, "S":0, "total":0})

    for r in rows:
        # Normalize sex
        raw_sex = (r.get("sex") or "").strip().upper()
        if raw_sex in ("M", "MALE"):
            sex_key = "Male"
        elif raw_sex in ("F", "FEMALE"):
            sex_key = "Female"
        else:
            sex_key = "Unknown"

        # Age bin
        bin_key = _age_bin(r.get("age"))

        # Normalize AST result
        ast = (r.get("ast_result") or "").strip().upper()
        if ast not in ("R","I","S"):
            # ignore unknown AST for R/I/S split but still count in total if you want;
            # here we count only R/I/S in totals so %R denominator is consistent with R+I+S
            continue

        sex_counts[sex_key][ast]   += 1
        sex_counts[sex_key]["total"] += 1

        age_counts[bin_key][ast]   += 1
        age_counts[bin_key]["total"] += 1

    # Build arrays in a friendly order
    sex_order = ["Male", "Female", "Unknown"]
    sex_out = []
    for key in sex_order:
        c = sex_counts.get(key, {"R":0,"I":0,"S":0,"total":0})
        total = c["total"]
        pctR = (c["R"] / total * 100.0) if total else 0.0
        sex_out.append({"sex": key, "R": c["R"], "I": c["I"], "S": c["S"], "total": total, "pctR": round(pctR,1)})

    # Sort age bins by numeric order
    def _age_sort_key(label):
        if label == "Unknown":
            return (999, 999)
        if label.endswith("+"):
            base = int(label[:-1])
            return (base, base+99)
        lo, hi = label.split("–")
        return (int(lo), int(hi))
    bins_sorted = sorted(age_counts.keys(), key=_age_sort_key)

    age_out = []
    for key in bins_sorted:
        c = age_counts[key]
        total = c["total"]
        pctR = (c["R"] / total * 100.0) if total else 0.0
        age_out.append({"bin": key, "R": c["R"], "I": c["I"], "S": c["S"], "total": total, "pctR": round(pctR,1)})

    return Response({"sex": sex_out, "age_bins": age_out})
