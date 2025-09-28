from django.http import JsonResponse
from django.db.models import Count
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import LabResult

@require_http_methods(["GET"])
def options(request):
    return JsonResponse({
        "hosts": [choice[0] for choice in LabResult.HOST_TYPES],
        "environment_types": [choice[0] for choice in LabResult.ENVIRONMENT_TYPES],
        "animal_species": [choice[0] for choice in LabResult.ANIMAL_SPECIES],
    })

@require_http_methods(["GET"])
def counts_summary(request):
    qs = LabResult.objects.all()

    host_type = request.GET.get("host_type")
    if host_type:
        qs = qs.filter(host_type=host_type)

    if host_type == "ANIMAL":
        animal_species = request.GET.get("animal_species")
        if animal_species:
            qs = qs.filter(animal_species=animal_species)

    if host_type == "ENVIRONMENT":
        environment_type = request.GET.get("environment_type")
        if environment_type:
            qs = qs.filter(environment_type=environment_type)

    organism_counts = qs.values("organism").annotate(count=Count("id")).order_by("-count")

    return JsonResponse(list(organism_counts), safe=False)
