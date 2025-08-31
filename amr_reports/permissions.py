from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsViewerReadOnlyElseDataEntryOrAdmin(BasePermission):
    """
    - Viewers: can only READ (GET/HEAD/OPTIONS)
    - DataEntry and Admin: can READ + WRITE
    - Others: denied
    """
    def has_permission(self, request, view):
        user = getattr(request, "user", None)
        if not user or not user.is_authenticated:
            return False

        # Admins (staff/superuser) can do anything
        if user.is_staff or user.is_superuser:
            return True

        # Everyone authenticated can read
        if request.method in SAFE_METHODS:
            return True

        # Write requires DataEntry or Admin group
        group_names = set(user.groups.values_list('name', flat=True))
        return ('DataEntry' in group_names) or ('Admin' in group_names)
