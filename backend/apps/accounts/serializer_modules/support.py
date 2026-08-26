from ._shared import *
from .users import *
from .authentication import *
from .finance import *

class TicketMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)
    class Meta:
        model = TicketMessage
        fields = "__all__"
        read_only_fields = ("ticket", "sender", "is_staff_reply")

    def validate_message(self, value):
        return validate_safe_text(value, field_label="متن پیام", minimum=2, maximum=2000)

class SupportTicketSerializer(serializers.ModelSerializer):
    messages = TicketMessageSerializer(many=True, read_only=True)
    initial_message = serializers.CharField(write_only=True, required=False)
    user_phone = serializers.CharField(source="user.phone", read_only=True)
    class Meta:
        model = SupportTicket
        fields = "__all__"
        read_only_fields = ("user", "status")
    def create(self, validated_data):
        message = validated_data.pop("initial_message", "")
        ticket = SupportTicket.objects.create(user=self.context["request"].user, **validated_data)
        if message:
            TicketMessage.objects.create(ticket=ticket, sender=ticket.user, message=message)
        Notification.objects.bulk_create([
            Notification(
                user=admin, title=f"تیکت جدید: {ticket.subject}",
                message=(message or "یک درخواست پشتیبانی جدید ثبت شد.")[:300],
            )
            for admin in User.objects.filter(
                role__in=(User.Role.ADMIN, User.Role.STAFF), is_active=True
            )
        ])
        return ticket

    def validate_subject(self, value):
        return validate_safe_text(value, field_label="موضوع", minimum=3, maximum=140)

    def validate_initial_message(self, value):
        if not value:
            return value
        return validate_safe_text(value, field_label="متن درخواست", minimum=3, maximum=2000)

class StaffPermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffPermission
        fields = "__all__"

class AdminAuditLogSerializer(serializers.ModelSerializer):
    actor_name = serializers.CharField(source="actor.full_name", read_only=True)
    actor_phone = serializers.CharField(source="actor.phone", read_only=True)
    description = serializers.SerializerMethodField()
    class Meta:
        model = AdminAuditLog
        fields = "__all__"
    def get_description(self, obj):
        method_labels = {
            "POST": "ایجاد یا اجرا کرد",
            "PUT": "به‌طور کامل ویرایش کرد",
            "PATCH": "ویرایش کرد",
            "DELETE": "حذف کرد",
        }
        targets = (
            ("/catalog/products/", "محصول"),
            ("/catalog/categories/", "دسته‌بندی"),
            ("/catalog/brands/", "برند"),
            ("/catalog/admin/reviews/", "نظر محصول"),
            ("/orders/admin/all/", "سفارش"),
            ("/orders/returns/", "درخواست مرجوعی"),
            ("/auth/admin/users/", "کاربر"),
            ("/auth/admin/notifications/", "اعلان"),
            ("/auth/tickets/", "تیکت پشتیبانی"),
            ("/operations/inventory/", "گردش انبار"),
            ("/operations/database-backup/", "بکاپ کامل"),
            ("/operations/", "عملیات پیشرفته"),
        )
        label = next(
            (title for path, title in targets if path in obj.target_type),
            "بخش مدیریتی",
        )
        action = method_labels.get(obj.action, obj.action)
        suffix = ""
        if obj.target_id:
            suffix = f" با شناسه {obj.target_id}"
        status_code = obj.details.get("status_code") if obj.details else None
        result = "موفق" if status_code and status_code < 400 else "ناموفق"
        actor = (
            (obj.actor.full_name or obj.actor.phone)
            if obj.actor else "مدیر"
        )
        return f"{actor}، {label}{suffix} را {action}؛ نتیجه {result} بود."
