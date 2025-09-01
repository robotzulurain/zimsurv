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
        # Preflight short-circuit
        if request.method == "OPTIONS":
            origin = request.headers.get("Origin")
            resp = HttpResponse()
            resp["Access-Control-Allow-Origin"] = origin or "*"
            resp["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            resp["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
            resp["Access-Control-Max-Age"] = "86400"
            if origin:
                # Vary so caches don't mix origins
                resp["Vary"] = "Origin"
            return resp

        # Normal request -> get downstream response, then add CORS
        response = self.get_response(request)
        origin = request.headers.get("Origin")
        response["Access-Control-Allow-Origin"] = origin or "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
        # If you need cookies one day:
        # response["Access-Control-Allow-Credentials"] = "true"
        if origin:
            response["Vary"] = (response.get("Vary", "") + ", Origin").strip(", ").replace(",,", ",")
        return response
