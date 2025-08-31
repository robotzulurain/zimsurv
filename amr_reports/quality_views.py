from datetime import date
from django.db.models import Q
from django.utils.dateparse import parse_date
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import LabResult

REQUIRED = ["patient_id","sex","age","specimen_type","organism","antibiotic","ast_result","test_date"]
VALID_SEX = {"M","F"}
VALID_AST = {"S","I","R"}
VALID_HOST = {"human","animal","environment"}

def _filtered_qs(request):
    qs = LabResult.objects.all()
    # optional filters
    organism = (request.GET.get('organism') or '').strip()
    antibiotic = (request.GET.get('antibiotic') or '').strip()
    specimen = (request.GET.get('specimen_type') or '').strip()
    date_from = parse_date(request.GET.get('date_from') or '')
    date_to   = parse_date(request.GET.get('date_to') or '')
    if organism:   qs = qs.filter(organism__iexact=organism)
    if antibiotic: qs = qs.filter(antibiotic__iexact=antibiotic)
    if specimen:   qs = qs.filter(specimen_type__iexact=specimen)
    if date_from:  qs = qs.filter(test_date__gte=date_from)
    if date_to:    qs = qs.filter(test_date__lte=date_to)
    return qs

def _is_missing(x):
    return x is None or (isinstance(x,str) and not x.strip())

def _issues_for(r: LabResult):
    issues = []

    # 1) Missing required fields
    for field in REQUIRED:
        if _is_missing(getattr(r, field, None)):
            issues.append(("missing_"+field, f"{field} missing"))

    # 2) Sex & Age
    if r.sex and r.sex not in VALID_SEX:
        issues.append(("invalid_sex", f"sex must be M or F (got {r.sex})"))
    if r.age is not None and (r.age < 0 or r.age > 120):
        issues.append(("invalid_age", f"age out of range: {r.age}"))

    # 3) AST result
    if r.ast_result and r.ast_result not in VALID_AST:
        issues.append(("invalid_ast_result", f"ast_result must be S/I/R (got {r.ast_result})"))

    # 4) Dates
    if r.test_date:
        if r.test_date > date.today():
            issues.append(("future_date", f"test_date in future: {r.test_date.isoformat()}"))

    # 5) Host type (optional field)
    if hasattr(r, "host_type") and r.host_type:
        if r.host_type not in VALID_HOST:
            issues.append(("invalid_host_type", f"host_type must be human/animal/environment (got {r.host_type})"))

    return issues

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quality_summary(request):
    qs = _filtered_qs(request)

    total = qs.count()
    missing_any = 0
    invalid_sex = 0
    invalid_age = 0
    invalid_ast = 0
    future_dates = 0
    invalid_host = 0

    # iterate once; dataset is small/medium in dev; optimize later if needed
    for r in qs.iterator():
        issues = _issues_for(r)
        if any(k.startswith("missing_") for k,_ in issues):
            missing_any += 1
        if any(k=="invalid_sex" for k,_ in issues):
            invalid_sex += 1
        if any(k=="invalid_age" for k,_ in issues):
            invalid_age += 1
        if any(k=="invalid_ast_result" for k,_ in issues):
            invalid_ast += 1
        if any(k=="future_date" for k,_ in issues):
            future_dates += 1
        if any(k=="invalid_host_type" for k,_ in issues):
            invalid_host += 1

    return Response({
        "total_checked": total,
        "missing_required": missing_any,
        "invalid_sex": invalid_sex,
        "invalid_age": invalid_age,
        "invalid_ast_result": invalid_ast,
        "future_dates": future_dates,
        "invalid_host_type": invalid_host,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def quality_issues(request):
    """
    Returns a flat list of rows with issues:
    [{id, patient_id, organism, antibiotic, test_date, issues: [strings]}]
    Accepts same filters as summary + ?limit=... (default 200)
    """
    qs = _filtered_qs(request)
    try:
        limit = int(request.GET.get('limit') or 200)
    except ValueError:
        limit = 200

    out = []
    for r in qs.order_by('-test_date','-id')[:limit]:
        issues = [msg for _k,msg in _issues_for(r)]
        if issues:
            out.append({
                "id": r.id,
                "patient_id": r.patient_id,
                "sex": r.sex,
                "age": r.age,
                "specimen_type": r.specimen_type,
                "organism": r.organism,
                "antibiotic": r.antibiotic,
                "ast_result": r.ast_result,
                "test_date": r.test_date.isoformat() if r.test_date else None,
                "host_type": getattr(r, "host_type", None),
                "facility": getattr(r, "facility", None) and str(r.facility),
                "issues": issues
            })
    return Response(out)
