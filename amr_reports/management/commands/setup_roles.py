from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from amr_reports.models import LabResult

class Command(BaseCommand):
    help = "Create default roles (lab_tech, policymaker) and map permissions"

    def handle(self, *args, **kwargs):
        ct = ContentType.objects.get_for_model(LabResult)
        perms = Permission.objects.filter(content_type=ct)
        # Fine-grained perms
        add_p = perms.get(codename="add_labresult")
        change_p = perms.get(codename="change_labresult")
        delete_p = perms.get(codename="delete_labresult")
        view_p = perms.get(codename="view_labresult")

        lab_tech, _ = Group.objects.get_or_create(name="lab_tech")
        policymaker, _ = Group.objects.get_or_create(name="policymaker")

        # lab techs: full CRUD on LabResult
        lab_tech.permissions.set([add_p, change_p, delete_p, view_p])

        # policymakers: read-only
        policymaker.permissions.set([view_p])

        self.stdout.write(self.style.SUCCESS("Roles set: lab_tech (CRUD), policymaker (view)"))
