from django.http import JsonResponse

def healthz(request):
    return JsonResponse({"ok": True})

def index(request):
    return JsonResponse({
        "app": "AMR Surveillance API",
        "status": "ok",
        "endpoints": {
            "health": "/healthz",
            "login": "/api/login/",
            "counts_summary": "/api/summary/counts-summary/",
            "resistance_time_trend": "/api/summary/resistance-time-trend/",
            "facilities_geo": "/api/summary/facilities-geo/",
            "data_entry_single": "/api/data-entry/",
            "data_entry_bulk": "/api/data-entry/bulk/"
        }
    })
