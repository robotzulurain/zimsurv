from django.http import HttpResponse

class SimpleCORSMiddleware:
    """
    Minimal CORS: adds ACAO/ACAH/ACAM on every response.
    Also handles OPTIONS preflight directly.
    Safe: never raises; works even if other settings are off.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin")

        # Preflight short-circuit
        if request.method == "OPTIONS":
            resp = HttpResponse()
            resp["Access-Control-Allow-Origin"] = origin or "*"
            resp["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            resp["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
            resp["Access-Control-Max-Age"] = "86400"
            if origin:
                resp["Vary"] = "Origin"
            return resp

        # Normal request -> call the view, then add CORS headers
        response = self.get_response(request)
        response["Access-Control-Allow-Origin"] = origin or "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
        # Uncomment if you ever need cookies:
        # response["Access-Control-Allow-Credentials"] = "true"
        if origin:
            existing_vary = response.get("Vary", "")
            if "Origin" not in existing_vary:
                response["Vary"] = (existing_vary + (", " if existing_vary else "") + "Origin")
        return response
