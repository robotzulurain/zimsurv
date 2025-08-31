from django.core.management.base import BaseCommand
from amr_reports.models import LabResult

class Command(BaseCommand):
    help = "Set host_type='human' where it's null/blank."

    def handle(self, *args, **kwargs):
        # rows where host_type is NULL or empty string
        qs = LabResult.objects.filter(host_type__isnull=True) | LabResult.objects.filter(host_type__exact='')
        n = 0
        for r in qs:
            r.host_type = 'human'
            r.save(update_fields=['host_type'])
            n += 1
        self.stdout.write(self.style.SUCCESS(f"Updated {n} rows to host_type='human'."))
