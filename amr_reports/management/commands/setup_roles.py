from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from amr_reports.models import LabResult, Facility

class Command(BaseCommand):
    help = "Create RBAC groups and assign permissions."

    def handle(self, *args, **kwargs):
        roles = ['Admin','DataEntry','Viewer']
        for r in roles:
            Group.objects.get_or_create(name=r)
        admin = Group.objects.get(name='Admin')
        data_entry = Group.objects.get(name='DataEntry')
        viewer = Group.objects.get(name='Viewer')

        # model perms
        lr_ct = ContentType.objects.get_for_model(LabResult)
        fc_ct = ContentType.objects.get_for_model(Facility)
        perms = {
            'add_labresult': Permission.objects.get(codename='add_labresult', content_type=lr_ct),
            'change_labresult': Permission.objects.get(codename='change_labresult', content_type=lr_ct),
            'delete_labresult': Permission.objects.get(codename='delete_labresult', content_type=lr_ct),

            'add_facility': Permission.objects.get(codename='add_facility', content_type=fc_ct),
            'change_facility': Permission.objects.get(codename='change_facility', content_type=fc_ct),
            'delete_facility': Permission.objects.get(codename='delete_facility', content_type=fc_ct),
        }

        # Admin gets everything
        admin.permissions.set(perms.values())

        # DataEntry can add/change LabResult + Facility (no delete by default)
        data_entry.permissions.set([
            perms['add_labresult'], perms['change_labresult'],
            perms['add_facility'], perms['change_facility'],
        ])

        # Viewer: no model write perms (read allowed by DRF permission)
        viewer.permissions.clear()

        self.stdout.write(self.style.SUCCESS("Roles created and permissions assigned."))
