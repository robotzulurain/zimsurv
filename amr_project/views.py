from django.http import JsonResponse

def index(request):
    return JsonResponse({
        "app": "AMR Surveillance API",
        "status": "ok",
        "endpoints": {
            "admin": "/admin/",
            "login": "/api/login/",
            "organism_counts": "/api/summary/organism-counts/",
            "resistance_time_trend": "/api/summary/resistance-time-trend/",
            "common_antibiotics": "/api/summary/common-antibiotics/",
            "counts_summary": "/api/summary/counts-summary/"
        }
    })
