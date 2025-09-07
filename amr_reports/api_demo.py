from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

# ----- Helpers -----
def qp(request, key, default=""):
    v = request.GET.get(key, "")
    return v if v is not None else default

def filters_from_request(request):
    return {
        "antibiotic": qp(request, "antibiotic"),
        "organism": qp(request, "organism"),
        "host": qp(request, "host"),
        "facility": qp(request, "facility"),
    }

def hash_factor(s: str) -> float:
    if not s:
        return 1.0
    h = 0
    for ch in s:
        h = (h * 31 + ord(ch)) & 0xFFFFFFFF
    # 0.70 -> 1.29
    return 0.70 + (h % 60) / 100.0

def apply(n: int, f: float) -> int:
    x = int(round(max(0, n * f)))
    return x

def adjust_rate(r: float, f: float) -> float:
    # keep in [0.02, 0.95], gently shift with factor
    out = r * (0.85 + (f - 1.0) * 0.7)
    return max(0.02, min(0.95, out))

# ----- Summary endpoints -----
def time_trend(request):
    filters = filters_from_request(request)
    f = hash_factor("|".join(filters.values()))

    base = [
        { "period": "2025-04", "total": 8,  "resistance_rate": 0.28 },
        { "period": "2025-05", "total": 12, "resistance_rate": 0.35 },
        { "period": "2025-06", "total": 15, "resistance_rate": 0.31 },
        { "period": "2025-07", "total": 20, "resistance_rate": 0.40 },
        { "period": "2025-08", "total": 24, "resistance_rate": 0.38 },
        { "period": "2025-09", "total": 30, "resistance_rate": 0.42 },
    ]
    shaped = [
        {
            "period": r["period"],
            "total": apply(r["total"], f),
            "resistance_rate": adjust_rate(r["resistance_rate"], f),
        }
        for r in base
    ]
    return JsonResponse(shaped, safe=False)

def sex_age(request):
    filters = filters_from_request(request)
    f = hash_factor("|".join(filters.values()))
    base = [
        { "band": "0-4",   "M": 4,  "F": 5 },
        { "band": "5-14",  "M": 6,  "F": 7 },
        { "band": "15-24", "M": 8,  "F": 10 },
        { "band": "25-44", "M": 14, "F": 12 },
        { "band": "45-64", "M": 10, "F": 11 },
        { "band": "65+",   "M": 5,  "F": 6 },
    ]
    shaped = [{ "band": r["band"], "M": apply(r["M"], f), "F": apply(r["F"], f) } for r in base]
    return JsonResponse(shaped, safe=False)

def antibiogram(request):
    filters = filters_from_request(request)
    f = hash_factor("|".join(filters.values()))

    organisms = ["Escherichia coli","Klebsiella pneumoniae","Staphylococcus aureus"]
    antibiotics = ["Ciprofloxacin","Ceftriaxone","Gentamicin","Meropenem"]

    # client requested slice?
    if filters["organism"]:
        organisms = [o for o in organisms if o == filters["organism"]]
    if filters["antibiotic"]:
        antibiotics = [a for a in antibiotics if a == filters["antibiotic"]]

    base = {
        "Escherichia coli": {
            "Ciprofloxacin": (12,2,10), "Ceftriaxone": (18,1,5),
            "Gentamicin": (20,1,3), "Meropenem": (22,0,2),
        },
        "Klebsiella pneumoniae": {
            "Ciprofloxacin": (8,3,12), "Ceftriaxone": (10,2,11),
            "Gentamicin": (14,1,8), "Meropenem": (18,0,3),
        },
        "Staphylococcus aureus": {
            "Ciprofloxacin": (16,1,5), "Ceftriaxone": (17,1,4),
            "Gentamicin": (19,0,3), "Meropenem": (20,0,2),
        },
    }

    sir = {}
    for o in organisms:
        sir[o] = {}
        for a in antibiotics:
            S,I,R = base.get(o, {}).get(a, (0,0,0))
            sir[o][a] = { "S": apply(S, f), "I": apply(I, f), "R": apply(R, f) }

    return JsonResponse({ "organisms": organisms, "antibiotics": antibiotics, "sir": sir })

def geo(request):
    filters = filters_from_request(request)
    f = hash_factor("|".join(filters.values()))
    base = [
        { "province": "Harare", "total": 18, "resistance_rate": 0.36 },
        { "province": "Bulawayo", "total": 12, "resistance_rate": 0.33 },
        { "province": "Midlands (Gweru)", "total": 9, "resistance_rate": 0.29 },
        { "province": "Matabeleland North", "total": 6, "resistance_rate": 0.25 },
    ]
    shaped = [
        {
            "province": r["province"],
            "total": apply(r["total"], f),
            "resistance_rate": adjust_rate(r["resistance_rate"], f),
        }
        for r in base
    ]
    return JsonResponse(shaped, safe=False)

def facilities(request):
    return JsonResponse(["Harare Central Lab","Bulawayo Central Lab","Gweru Provincial Lab"], safe=False)

# ----- Overview + Quality stubs (optional but handy) -----
def counts_summary(request):
    # make totals wiggle a bit with filters so you can see changes
    filters = filters_from_request(request)
    f = hash_factor("|".join(filters.values()))
    return JsonResponse({
        "total_results": apply(49, f),
        "unique_patients": apply(42, f),
        "organisms": 4,
        "antibiotics": 10
    })

def data_quality(request):
    filters = filters_from_request(request)
    f = hash_factor("|".join(filters.values()))
    return JsonResponse({
        "invalid_dates": apply(2, f),
        "missing_fields": apply(3, f),
        "invalid_ast": apply(1, f),
        "total_records": apply(50, f)
    })

# ----- Uploads -----
@csrf_exempt
def upload_csv(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    f = request.FILES.get("file") or request.FILES.get("csv") or request.FILES.get("upload") or request.FILES.get("csv_file")
    if not f:
        return JsonResponse({"detail": "No file"}, status=400)
    return JsonResponse({"ok": True, "bytes": f.size, "name": f.name, "type": "csv"})

@csrf_exempt
def upload_excel(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    f = request.FILES.get("file") or request.FILES.get("upload")
    if not f:
        return JsonResponse({"detail": "No file"}, status=400)
    return JsonResponse({"ok": True, "bytes": f.size, "name": f.name, "type": "excel"})
