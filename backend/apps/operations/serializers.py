from rest_framework import serializers
from .models import (
    AbandonedCart, AdminTwoFactor, BehaviorEvent, BundleItem, GiftCard,
    InventoryMovement, InventoryReservation, ProductBundle, PromotionRule,
    PurchaseOrder, PurchaseOrderItem, ServiceHealth, ShipmentEvent, Supplier,
    DeliverySlot, Expense, MessageTemplate, ProductSupplier, ScheduledMessage,
    ShippingRule, StockTransfer, SupplierLedger, Warehouse, WarehouseStock,
)


class SupplierSerializer(serializers.ModelSerializer):
    class Meta: model = Supplier; fields = "__all__"

class InventoryMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    class Meta:
        model = InventoryMovement
        fields = "__all__"
        read_only_fields = ("actor", "stock_after")

class PurchaseOrderItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    class Meta: model = PurchaseOrderItem; fields = "__all__"

class PurchaseOrderSerializer(serializers.ModelSerializer):
    items = PurchaseOrderItemSerializer(many=True, read_only=True)
    class Meta: model = PurchaseOrder; fields = "__all__"

class BundleItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    class Meta: model = BundleItem; fields = "__all__"

class ProductBundleSerializer(serializers.ModelSerializer):
    items = BundleItemSerializer(many=True, read_only=True)
    class Meta: model = ProductBundle; fields = "__all__"

class GiftCardSerializer(serializers.ModelSerializer):
    class Meta:
        model = GiftCard
        fields = "__all__"
        read_only_fields = ("code", "balance")
    def create(self, validated_data):
        validated_data["balance"] = validated_data["initial_balance"]
        return super().create(validated_data)

class PromotionRuleSerializer(serializers.ModelSerializer):
    class Meta: model = PromotionRule; fields = "__all__"

class InventoryReservationSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    expired = serializers.ReadOnlyField()
    class Meta:
        model = InventoryReservation
        fields = "__all__"
        read_only_fields = ("user", "expires_at", "converted_order", "is_active")

class AbandonedCartSerializer(serializers.ModelSerializer):
    class Meta:
        model = AbandonedCart
        fields = "__all__"
        read_only_fields = ("user", "recovered_at", "reminder_sent_at")

class ShipmentEventSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    class Meta: model = ShipmentEvent; fields = "__all__"

class AdminTwoFactorSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdminTwoFactor
        fields = "__all__"
        read_only_fields = ("user", "last_verified_at")

class BehaviorEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = BehaviorEvent
        fields = "__all__"
        read_only_fields = ("user",)

class ServiceHealthSerializer(serializers.ModelSerializer):
    class Meta: model = ServiceHealth; fields = "__all__"

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta: model = Warehouse; fields = "__all__"

class WarehouseStockSerializer(serializers.ModelSerializer):
    warehouse_name = serializers.CharField(source="warehouse.name", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    sellable_quantity = serializers.ReadOnlyField()
    class Meta: model = WarehouseStock; fields = "__all__"

class StockTransferSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    class Meta: model = StockTransfer; fields = "__all__"

class ProductSupplierSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    class Meta: model = ProductSupplier; fields = "__all__"

class SupplierLedgerSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    class Meta: model = SupplierLedger; fields = "__all__"

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta: model = Expense; fields = "__all__"

class ShippingRuleSerializer(serializers.ModelSerializer):
    class Meta: model = ShippingRule; fields = "__all__"

class DeliverySlotSerializer(serializers.ModelSerializer):
    available_capacity = serializers.SerializerMethodField()
    class Meta: model = DeliverySlot; fields = "__all__"
    def get_available_capacity(self, obj):
        return max(0, obj.capacity - obj.reserved_count)

class MessageTemplateSerializer(serializers.ModelSerializer):
    class Meta: model = MessageTemplate; fields = "__all__"

class ScheduledMessageSerializer(serializers.ModelSerializer):
    template_title = serializers.CharField(source="template.title", read_only=True)
    class Meta: model = ScheduledMessage; fields = "__all__"
