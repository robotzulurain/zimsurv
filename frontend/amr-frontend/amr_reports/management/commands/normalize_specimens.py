from django.core.management.base import BaseCommand
from amr_reports.models import LabResult
MAP = {"blood":"Blood", "urine":"Urine", "csf":"CSF", "sputum":"Sputum", "wound":"Wound"}
class Command(BaseCommand):
    def handle(self, *args, **kwargs):
        n=0
        for r in LabResult.objects.all():
            v=r.specimen_type
            if v and v.lower() in MAP and v!=MAP[v.lower()]:
                r.specimen_type = MAP[v.lower()]
                r.save(update_fields=["specimen_type"]); n+=1
        self.stdout.write(f"Normalized {n} rows.")
