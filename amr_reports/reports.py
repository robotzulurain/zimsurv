from io import BytesIO
from django.http import HttpResponse
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.units import cm
from django.db.models import Count, Case, When, IntegerField
from .models import LabResult

def _pdf_response(buf: BytesIO, name: str):
    pdf = buf.getvalue()
    buf.close()
    resp = HttpResponse(pdf, content_type="application/pdf")
    resp["Content-Disposition"] = f'attachment; filename="{name}.pdf"'
    return resp

def report_unit_antibiogram(request):
    unit = request.GET.get("unit","ICU")
    qs = LabResult.objects.filter(facility__icontains=unit) | LabResult.objects.filter(facility=unit)
    agg = (
        qs.values("organism","antibiotic")
          .annotate(
            S=Count(Case(When(ast_result="S", then=1), output_field=IntegerField())),
            I=Count(Case(When(ast_result="I", then=1), output_field=IntegerField())),
            R=Count(Case(When(ast_result="R", then=1), output_field=IntegerField())),
          ).order_by("organism","antibiotic")
    )

    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 2*cm
    c.setFont("Helvetica-Bold", 14); c.drawString(2*cm, y, f"Unit-Specific Antibiogram: {unit}"); y -= 1*cm
    c.setFont("Helvetica", 10); c.drawString(2*cm, y, "Organism | Antibiotic | S | I | R"); y -= 0.5*cm
    for row in agg:
        line = f"{row['organism']} | {row['antibiotic']} | {row['S']} | {row['I']} | {row['R']}"
        if y < 2*cm: c.showPage(); y = height - 2*cm
        c.drawString(2*cm, y, line); y -= 0.5*cm
    c.showPage(); c.save()
    return _pdf_response(buf, f"antibiogram_{unit.replace(' ','_')}")

def report_monthly_summary(request):
    month = request.GET.get("month")  # YYYY-MM
    qs = LabResult.objects.all()
    if month:
        qs = qs.filter(test_date__startswith=month)
    total = qs.count()
    r = qs.filter(ast_result="R").count()
    rate = (r/total) if total else 0.0

    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4
    y = height - 2*cm
    title = f"Monthly Summary: {month}" if month else "Monthly Summary (current dataset)"
    c.setFont("Helvetica-Bold", 14); c.drawString(2*cm, y, title); y -= 1*cm
    c.setFont("Helvetica", 11)
    c.drawString(2*cm, y, f"Total tests: {total}"); y -= 0.6*cm
    c.drawString(2*cm, y, f"Total R: {r}"); y -= 0.6*cm
    c.drawString(2*cm, y, f"R rate: {round(rate*100,1)}%"); y -= 0.8*cm
    c.showPage(); c.save()
    return _pdf_response(buf, f"monthly_summary_{(month or 'all')}")

def report_public_health_export(request):
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.setFont("Helvetica-Bold", 14); c.drawString(2*cm, 27*cm, "Public Health Export")
    c.setFont("Helvetica", 11)
    c.drawString(2*cm, 26*cm, "Integrate here with national surveillance CSV schema.")
    c.drawString(2*cm, 25.5*cm, "CSV endpoint can be added at /api/export/csv.")
    c.showPage(); c.save()
    return _pdf_response(buf, "public_health_export")
