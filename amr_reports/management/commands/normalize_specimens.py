from django.core.management.base import BaseCommand
from amr_reports.models import LabResult

MAP = {"blood":"Blood", "urine":"Urine", "csf":"CSF", "sputum":"Sputum", "wound":"Wound"}

class Command(BaseCommand):
    help = "Normalizes specimen_type capitalization (e.g., blood->Blood)."

    def handle(self, *args, **kwargs):
        n=0
        for r in LabResult.objects.all():
            v = (r.specimen_type or "").strip()
            lo = v.lower()
            if lo in MAP and v != MAP[lo]:
                r.specimen_type = MAP[lo]
                r.save(update_fields=["specimen_type"])
                n += 1
        self.stdout.write(self.style.SUCCESS(f"Normalized {n} rows."))
