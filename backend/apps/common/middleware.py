import logging
import uuid
import time

from django.db import DatabaseError
from django.http import HttpResponseRedirect
from django.db.models import F

from apps.accounts.models import AdminAuditLog


logger = logging.getLogger(__name__)


class SeoRedirectMiddleware:
    """Apply administrator-managed redirects before route resolution."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.method in {"GET", "HEAD"} and not request.path.startswith(("/api/", "/media/", "/static/")):
            from apps.catalog.models import RedirectRule
            rule = RedirectRule.objects.filter(source_path=request.path, is_active=True).only(
                "id", "destination_path", "status_code"
            ).first()
            if rule and rule.destination_path.startswith("/") and rule.destination_path != request.path:
                RedirectRule.objects.filter(pk=rule.pk).update(hits=F("hits") + 1)
                response = HttpResponseRedirect(rule.destination_path)
                response.status_code = rule.status_code if rule.status_code in {301, 302, 307, 308} else 301
                return response
        return self.get_response(request)


class RequestContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        from .logging import request_id_context
        request_id = request.headers.get("X-Request-ID", "")[:80] or uuid.uuid4().hex
        token = request_id_context.set(request_id)
        started = time.monotonic()
        try:
            response = self.get_response(request)
            response["X-Request-ID"] = request_id
            response["X-API-Version"] = "v1"
            duration_ms = round((time.monotonic() - started) * 1000, 2)
            if duration_ms >= 750:
                logger.warning("slow_request method=%s path=%s duration_ms=%s", request.method, request.path, duration_ms)
            return response
        finally:
            request_id_context.reset(token)


class AdminAuditMiddleware:
    """ثبت تغییرات پنل اختصاصی بدون ذخیره بدنه یا اطلاعات حساس درخواست."""
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        user = getattr(request, "user", None)
        # A full restore replaces the database while this request is still alive.
        # The authenticated admin may therefore no longer exist in the restored
        # database, so writing an audit row here can turn a successful restore
        # response into an FK/500 error.
        is_full_restore = (
            request.method == "POST"
            and request.path.rstrip("/") == "/api/v1/operations/database-backup"
        )
        if (
            not is_full_restore
            and user
            and user.is_authenticated
            and user.role in {"ADMIN", "STAFF"}
            and request.method in {"POST", "PUT", "PATCH", "DELETE"}
            and request.path.startswith("/api/v1/")
            and response.status_code < 500
        ):
            parts = [part for part in request.path.strip("/").split("/") if part]
            target_id = ""
            actions = {
                "reply", "close", "receive", "mark_read", "toggle_active",
                "validate_code",
            }
            if request.method != "POST" and parts and parts[-1] != "all":
                target_id = parts[-1][:80]
            elif len(parts) > 1 and parts[-1] in actions:
                target_id = parts[-2][:80]
            try:
                AdminAuditLog.objects.create(
                    actor=user, action=request.method, target_type=request.path[:80],
                    target_id=target_id,
                    details={
                        "status_code": response.status_code,
                        "operation": parts[-1] if parts else "",
                    },
                    ip_address=request.META.get("REMOTE_ADDR"),
                )
            except (DatabaseError, ValueError):
                # Audit logging is secondary and must never corrupt a successful
                # API response (especially around restore/rollback operations).
                logger.exception("Could not persist admin audit log")
        return response
