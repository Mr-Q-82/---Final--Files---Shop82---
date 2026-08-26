from ._shared import *

class DiscountCodeSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiscountCode
        fields = "__all__"
        read_only_fields = ("used_count",)
    def validate_percent(self, value):
        if value > 100:
            raise serializers.ValidationError("درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.")
        return value

class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = (
            "id", "product", "product_name", "unit_price", "quantity", "line_total",
            "variant_name", "variant_sku", "customization_snapshot", "customization_price",
        )

class PaymentTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentTransaction
        fields = (
            "id", "provider", "amount", "authority", "reference_id", "status",
            "created_at",
        )

class OrderStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name = serializers.CharField(source="changed_by.full_name", read_only=True)
    class Meta:
        model = OrderStatusHistory
        fields = "__all__"

class CheckoutItemSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    variant_id = serializers.UUIDField(required=False, allow_null=True)
    customization_option_ids = serializers.ListField(
        child=serializers.UUIDField(), required=False, allow_empty=True
    )
    quantity = serializers.IntegerField(min_value=1, max_value=20)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payments = PaymentTransactionSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    shipment_events = serializers.SerializerMethodField()
    return_status = serializers.SerializerMethodField()
    customer = serializers.SerializerMethodField()
    class Meta:
        model = Order
        fields = "__all__"
        read_only_fields = ("user", "number", "subtotal", "shipping_cost", "discount_amount", "total", "tracking_code")

    def to_representation(self, instance):
        if not instance.tracking_code:
            instance.ensure_tracking_code()
        return super().to_representation(instance)
    def get_shipment_events(self, obj):
        items = getattr(obj, "_ordered_shipments", None)
        if items is None:
            items = obj.shipment_events.order_by("created_at")
        return [
            {
                "id": item.id,
                "status": item.status,
                "location": item.location,
                "description": item.description,
                "created_at": item.created_at,
            }
            for item in items
        ]
    def get_return_status(self, obj):
        items = getattr(obj, "_ordered_returns", None)
        item = items[0] if items else None
        if items is None:
            item = obj.return_requests.order_by("-created_at").first()
        return item.status if item else None
    def get_customer(self, obj):
        return {
            "id": str(obj.user_id),
            "name": obj.user.full_name,
            "phone": obj.user.phone,
            "email": obj.user.email,
            "national_id": getattr(obj.user, "national_id", ""),
        }

