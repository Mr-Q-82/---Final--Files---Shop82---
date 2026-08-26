from django.db import OperationalError, ProgrammingError, connection
from rest_framework_simplejwt.tokens import RefreshToken

from ._shared import UserSession, logger
from .users import UserSerializer


def session_table_available():
    """Return False without issuing a failing query inside an atomic block."""
    try:
        return UserSession._meta.db_table in connection.introspection.table_names()
    except (OperationalError, ProgrammingError):
        return False


def issue_user_tokens(user, request=None):
    refresh = RefreshToken.for_user(user)
    if session_table_available():
        UserSession.objects.update_or_create(
            refresh_jti=str(refresh["jti"]),
            defaults={
                "user": user,
                "device_name": (
                    request.META.get("HTTP_USER_AGENT", "")[:140]
                    if request else ""
                ),
                "user_agent": (
                    request.META.get("HTTP_USER_AGENT", "")[:300]
                    if request else ""
                ),
                "ip_address": request.META.get("REMOTE_ADDR") if request else None,
            },
        )
    else:
        logger.warning(
            "UserSession table is unavailable; issued tokens without session metadata"
        )
    return {
        "user": UserSerializer(user).data,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


__all__ = ["issue_user_tokens", "session_table_available"]
