from django.http import HttpResponse

class SimpleCORSMiddleware:
    """
    Adds CORS headers to every response and handles OPTIONS preflight.
    Safe and dependency-free.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        origin = request.headers.get("Origin")

        # Handle preflight quickly
        if request.method == "OPTIONS":
            resp = HttpResponse()
            resp["Access-Control-Allow-Origin"] = origin or "*"
            resp["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            resp["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
            resp["Access-Control-Max-Age"] = "86400"
            if origin:
                resp["Vary"] = "Origin"
            return resp

        # Normal request
        response = self.get_response(request)
        response["Access-Control-Allow-Origin"] = origin or "*"
        response["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response["Access-Control-Allow-Headers"] = "Authorization, Content-Type, Accept, X-Requested-With"
        if origin:
            existing_vary = response.get("Vary", "")
            if "Origin" not in existing_vary:
                response["Vary"] = (existing_vary + (", " if existing_vary else "") + "Origin")
        return response
