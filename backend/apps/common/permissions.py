from rest_framework.permissions import BasePermission

class IsAdminRole(BasePermission):
    message = "دسترسی فقط برای مدیران مجاز است."
    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        if user.role == "ADMIN":
            return True
        if user.role != "STAFF":
            return False
        try:
            granted = set(user.staff_permissions.permissions or [])
        except Exception:
            granted = set()
        # Least privilege: a staff account without explicit grants has no
        # administrative access. Administrators remain unrestricted above.
        if "*" in granted:
            return True
        if not granted:
            return False
        required = getattr(view, "required_permission", "")
        basename = getattr(view, "basename", "") or getattr(view, "permission_key", "")
        action = getattr(view, "action", request.method.lower())
        candidates = {required, basename, f"{basename}:{action}", f"{basename}:write"}
        if request.method in {"GET", "HEAD", "OPTIONS"}:
            candidates.add(f"{basename}:read")
        return bool(granted.intersection(filter(None, candidates)))
