from rest_framework.permissions import BasePermission

class LabTechOnly(BasePermission):
    def has_permission(self, request, view):
        u = request.user
        return bool(u and u.is_authenticated and u.groups.filter(name="lab_tech").exists())
