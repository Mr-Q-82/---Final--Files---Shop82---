from ._shared import *
from .identity import *
from .finance import *

class SupportTicket(TimeStampedModel):
    class Status(models.TextChoices):
        OPEN = "OPEN", "باز"
        ANSWERED = "ANSWERED", "پاسخ داده‌شده"
        CLOSED = "CLOSED", "بسته"
    class Priority(models.TextChoices):
        LOW = "LOW", "کم"
        NORMAL = "NORMAL", "عادی"
        HIGH = "HIGH", "فوری"
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="support_tickets")
    subject = models.CharField(max_length=180)
    category = models.CharField(max_length=80, default="عمومی")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.OPEN)
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.NORMAL)
    class Meta:
        ordering = ("-updated_at",)
        indexes = [
            models.Index(fields=["user", "status", "-updated_at"], name="ticket_user_status_idx")
        ]

class TicketMessage(TimeStampedModel):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT)
    message = models.TextField()
    attachment = models.FileField(upload_to="tickets/%Y/%m/", blank=True, validators=[validate_support_attachment])
    is_staff_reply = models.BooleanField(default=False)
    class Meta:
        ordering = ("created_at",)

class StaffPermission(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="staff_permissions")
    permissions = models.JSONField(default=list, blank=True)

class AdminAuditLog(TimeStampedModel):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=80)
    target_type = models.CharField(max_length=80, blank=True)
    target_id = models.CharField(max_length=80, blank=True)
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    class Meta:
        ordering = ("-created_at",)


