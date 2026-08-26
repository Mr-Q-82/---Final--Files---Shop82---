from ._shared import *
from .authentication import *
from .users import *
from .finance import *

class SupportTicketViewSet(viewsets.ModelViewSet):
    serializer_class = SupportTicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ("get", "post", "patch", "head", "options")
    def get_queryset(self):
        qs = SupportTicket.objects.select_related("user").prefetch_related("messages__sender")
        if self.request.user.role in {"ADMIN", "STAFF"}:
            return qs
        return qs.filter(user=self.request.user)
    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        ticket = self.get_object()
        if ticket.status == SupportTicket.Status.CLOSED:
            return Response(
                {"detail": "این گفت‌وگو توسط پشتیبانی پایان یافته است."}, status=409
            )
        message = str(request.data.get("message", "")).strip()
        if not message:
            return Response({"detail": "متن پاسخ الزامی است."}, status=400)
        item = TicketMessage.objects.create(
            ticket=ticket, sender=request.user, message=message,
            attachment=request.FILES.get("attachment"),
            is_staff_reply=request.user.role in {"ADMIN", "STAFF"},
        )
        ticket.status = SupportTicket.Status.ANSWERED if item.is_staff_reply else SupportTicket.Status.OPEN
        ticket.save(update_fields=("status", "updated_at"))
        recipients = (
            [ticket.user] if item.is_staff_reply
            else User.objects.filter(
                role__in=(User.Role.ADMIN, User.Role.STAFF), is_active=True
            )
        )
        Notification.objects.bulk_create([
            Notification(
                user=recipient,
                title=f"پاسخ جدید در تیکت «{ticket.subject}»",
                message=message[:300],
                target_section="tickets",
                target_id=str(ticket.id),
            )
            for recipient in recipients
        ])
        return Response(TicketMessageSerializer(item).data, status=201)
    @action(detail=True, methods=["post"])
    def close(self, request, pk=None):
        if request.user.role not in {"ADMIN", "STAFF"}:
            return Response(
                {"detail": "فقط پشتیبانی می‌تواند گفت‌وگو را پایان دهد."}, status=403
            )
        ticket = self.get_object()
        ticket.status = SupportTicket.Status.CLOSED
        ticket.save(update_fields=("status", "updated_at"))
        Notification.objects.create(
            user=ticket.user, title=f"تیکت «{ticket.subject}» بسته شد",
            message="گفت‌وگو توسط پشتیبانی پایان یافت.",
            target_section="tickets", target_id=str(ticket.id),
        )
        return Response(self.get_serializer(ticket).data)

class StaffPermissionViewSet(viewsets.ModelViewSet):
    queryset = StaffPermission.objects.select_related("user")
    serializer_class = StaffPermissionSerializer
    permission_classes = [IsAdminRole]

class AdminAuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AdminAuditLog.objects.select_related("actor")
    serializer_class = AdminAuditLogSerializer
    permission_classes = [IsAdminRole]
