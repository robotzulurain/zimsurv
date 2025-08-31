from django.http import HttpResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated

CSV_HEADER = "patient_id,sex,age,specimen_type,organism,antibiotic,ast_result,test_date,host_type,facility\n"
CSV_SAMPLE = "P001,M,45,Blood,E.coli,Ampicillin,R,2025-07-10,human,Mpilo\n"

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def csv_template(request):
    resp = HttpResponse(content_type='text/csv')
    resp['Content-Disposition'] = 'attachment; filename=amr_upload_template.csv'
    resp.write(CSV_HEADER)
    resp.write(CSV_SAMPLE)
    return resp
