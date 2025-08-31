from io import BytesIO
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from django.http import HttpResponse
from django.utils.dateparse import parse_date
from django.db.models import Count, Q
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import LabResult

def _apply_filters(qs, request):
    organism   = (request.GET.get('organism') or '').strip()
    antibiotic = (request.GET.get('antibiotic') or '').strip()
    df = parse_date(request.GET.get('date_from') or '')
    dt = parse_date(request.GET.get('date_to') or '')
    if organism:   qs = qs.filter(organism__iexact=organism)
    if antibiotic: qs = qs.filter(antibiotic__iexact=antibiotic)
    if df: qs = qs.filter(test_date__gte=df)
    if dt: qs = qs.filter(test_date__lte=dt)
    return qs

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_antibiogram_pdf(request):
    qs = _apply_filters(LabResult.objects.all(), request)
    rows = qs.values("organism","antibiotic").annotate(
        total=Count("id"),
        R=Count("id", filter=Q(ast_result="R")),
        I=Count("id", filter=Q(ast_result="I")),
        S=Count("id", filter=Q(ast_result="S")),
    )
    # collect unique lists for matrix layout
    organisms = sorted({r["organism"] for r in rows}, key=lambda x: x.lower())
    antibiotics = sorted({r["antibiotic"] for r in rows}, key=lambda x: x.lower())
    # map for quick lookup
    m = {(r["organism"], r["antibiotic"]): r for r in rows}

    buf = BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), leftMargin=24, rightMargin=24, topMargin=24, bottomMargin=24)
    styles = getSampleStyleSheet()
    elems = []

    title_bits = ["Antibiogram (%R)"]
    if request.GET.get('organism'): title_bits.append(f"Organism={request.GET.get('organism')}")
    if request.GET.get('antibiotic'): title_bits.append(f"Antibiotic={request.GET.get('antibiotic')}")
    if request.GET.get('date_from') or request.GET.get('date_to'):
        title_bits.append(f"Date {request.GET.get('date_from','…')} to {request.GET.get('date_to','…')}")
    elems.append(Paragraph(" | ".join(title_bits), styles['Title']))
    elems.append(Spacer(1, 8))

    data = [["Organism \\ Antibiotic"] + antibiotics]
    for org in organisms:
        row = [org]
        for ab in antibiotics:
            r = m.get((org, ab))
            if not r or not r["total"]:
                row.append("-")
            else:
                pctR = round(100*r["R"]/r["total"], 1)
                row.append(f"{pctR}% (n={r['total']})")
        data.append(row)

    table = Table(data, repeatRows=1)
    ts = TableStyle([
        ('FONTNAME',(0,0),(-1,0),'Helvetica-Bold'),
        ('BACKGROUND',(0,0),(-1,0), colors.lightgrey),
        ('GRID',(0,0),(-1,-1), 0.25, colors.grey),
        ('VALIGN',(0,0),(-1,-1),'MIDDLE'),
        ('ALIGN',(1,1),(-1,-1),'CENTER'),
    ])
    table.setStyle(ts)
    elems.append(table)
    doc.build(elems)

    pdf = buf.getvalue(); buf.close()
    resp = HttpResponse(pdf, content_type='application/pdf')
    resp['Content-Disposition'] = 'inline; filename="antibiogram.pdf"'
    return resp
