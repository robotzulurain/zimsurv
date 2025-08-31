import csv
from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

HEADERS = ["patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","test_date","host_type","facility"]
SAMPLE = [
    ["P001","M","45","Blood","E.coli","Ampicillin","R","2025-07-10","human","MPILO"],
    ["P002","F","30","Urine","Klebsiella","Penicillin","S","2025-08-11","human","MPILO"],
]

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def csv_template(request):
    resp = HttpResponse(content_type='text/csv')
    resp['Content-Disposition'] = 'attachment; filename="amr_template.csv"'
    w = csv.writer(resp)
    w.writerow(HEADERS)
    for row in SAMPLE:
        w.writerow(row)
    return resp
