from collections import defaultdict
from datetime import date
from django.http import JsonResponse
from django.db.models import Count, Case, When, IntegerField
from django.db.models.functions import TruncMonth, TruncWeek
from .models import LabResult

def alerts_summary(request):
    qs = LabResult.objects.exclude(test_date__isnull=True)

    # monthly by organism+antibiotic
    month = (
        qs.annotate(m=TruncMonth("test_date"))
          .values("organism","antibiotic","m")
          .annotate(
              n=Count("id"),
              r=Count(Case(When(ast_result="R", then=1), output_field=IntegerField())),
          ).order_by("organism","antibiotic","m")
    )
    series = defaultdict(list)
    for row in month:
        key = (row["organism"] or "Unknown", row["antibiotic"] or "Unknown")
        n = row["n"] or 0
        rate = (row["r"]/n) if n else 0.0
        series[key].append((row["m"], n, rate))

    rare, spikes = [], []
    for (org, abx), rows in series.items():
        rows.sort(key=lambda x: x[0] or date.min)
        if len(rows) < 2:  # need history
            continue
        *hist, last = rows[:-1], rows[-1]
        hist_rates = [r for _,_,r in hist]
        if not hist_rates:
            continue
        hist_rates_sorted = sorted(hist_rates)
        median = hist_rates_sorted[len(hist_rates_sorted)//2]
        last_m, last_n, last_rate = last

        # rare pattern
        if last_n >= 5 and (last_rate or 0) >= 0.80 and median <= 0.30:
            rare.append({
                "organism": org, "antibiotic": abx,
                "month": last_m.strftime("%Y-%m") if last_m else "Unknown",
                "last_rate": round(last_rate,3), "median_rate": round(median,3), "n": last_n
            })

        # spike (z-score)
        mu = sum(hist_rates)/len(hist_rates)
        var = sum((r-mu)**2 for r in hist_rates)/len(hist_rates)
        sd = var**0.5
        if last_n >= 5 and sd > 0 and (last_rate - mu)/sd >= 2.0:
            spikes.append({
                "organism": org, "antibiotic": abx,
                "month": last_m.strftime("%Y-%m") if last_m else "Unknown",
                "last_rate": round(last_rate,3), "mean_rate": round(mu,3), "sd": round(sd,3), "n": last_n
            })

    # weekly clusters by facility
    wk = (
        qs.annotate(w=TruncWeek("test_date"))
          .values("facility","w")
          .annotate(n=Count("id"))
          .order_by("facility","w")
    )
    clusters = []
    by_fac = defaultdict(list)
    for row in wk:
        by_fac[row["facility"] or "Unknown"].append((row["w"], row["n"] or 0))
    for fac, arr in by_fac.items():
        arr.sort(key=lambda x: x[0] or date.min)
        if len(arr) < 2:
            continue
        *hist, last = arr[:-1], arr[-1]
        vals = [n for _,n in hist]
        mu = sum(vals)/len(vals)
        var = sum((n-mu)**2 for n in vals)/len(vals)
        sd = var**0.5
        last_w, last_n = last
        if sd > 0 and last_n >= max(5, mu + 2*sd):
            clusters.append({
                "facility": fac,
                "week": last_w.strftime("%G-W%V") if last_w else "Unknown",
                "count": last_n, "baseline_mean": round(mu,2), "baseline_sd": round(sd,2)
            })

    return JsonResponse({"rare_patterns": rare, "spikes": spikes, "clusters": clusters})
