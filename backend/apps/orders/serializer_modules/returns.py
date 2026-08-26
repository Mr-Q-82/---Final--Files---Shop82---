from ._shared import *
from .common import *
from .checkout import *

class ReturnRequestSerializer(serializers.ModelSerializer):
    order_number = serializers.CharField(source="order.number", read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    customer = serializers.SerializerMethodField()
    order_detail = OrderSerializer(source="order", read_only=True)
    class Meta:
        model = ReturnRequest
        fields = "__all__"
        read_only_fields = ("user", "status", "refund_amount", "admin_note")
    def validate_order(self, order):
        user = self.context["request"].user
        if order.user_id != user.id or order.status != Order.Status.DELIVERED:
            raise serializers.ValidationError("فقط سفارش تحویل‌شده متعلق به شما قابل مرجوعی است.")
        if order.return_requests.exclude(status=ReturnRequest.Status.REJECTED).exists():
            raise serializers.ValidationError("برای این سفارش قبلاً درخواست مرجوعی ثبت شده است.")
        return order
    def validate_image(self, image):
        if image and (image.size > 5 * 1024 * 1024 or not (image.content_type or "").startswith("image/")):
            raise serializers.ValidationError("فقط تصویر معتبر تا حجم ۵ مگابایت مجاز است.")
        return image
    def get_customer(self, obj):
        return {
            "id": str(obj.user_id),
            "name": obj.user.full_name,
            "phone": obj.user.phone,
            "email": obj.user.email,
            "national_id": getattr(obj.user, "national_id", ""),
        }
