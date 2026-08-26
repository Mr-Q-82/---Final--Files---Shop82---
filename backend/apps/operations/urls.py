from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    AbandonedCartViewSet, AdminTwoFactorView, AdvancedReportView, BehaviorEventViewSet,
    BundleItemViewSet, GiftCardViewSet, InventoryMovementViewSet, MessageCenterView,
    ProductBundleViewSet, PromotionRuleViewSet, PurchaseOrderItemViewSet,
    PurchaseOrderViewSet, ReservationViewSet, ServiceHealthViewSet,
    ShipmentEventViewSet, SupplierViewSet,
    DeliverySlotViewSet, ExpenseViewSet, MessageTemplateViewSet,
    ProductSupplierViewSet, ScheduledMessageViewSet, ShippingRuleViewSet,
    StockTransferViewSet, SupplierLedgerViewSet, WarehouseStockViewSet,
    WarehouseViewSet, DatabaseBackupView,
)

router = DefaultRouter()
router.register("suppliers", SupplierViewSet)
router.register("inventory", InventoryMovementViewSet)
router.register("purchase-orders", PurchaseOrderViewSet)
router.register("purchase-items", PurchaseOrderItemViewSet)
router.register("bundles", ProductBundleViewSet)
router.register("bundle-items", BundleItemViewSet)
router.register("gift-cards", GiftCardViewSet)
router.register("promotions", PromotionRuleViewSet)
router.register("reservations", ReservationViewSet, basename="reservations")
router.register("abandoned-carts", AbandonedCartViewSet, basename="abandoned-carts")
router.register("shipments", ShipmentEventViewSet, basename="shipments")
router.register("events", BehaviorEventViewSet)
router.register("health", ServiceHealthViewSet)
router.register("warehouses", WarehouseViewSet)
router.register("warehouse-stocks", WarehouseStockViewSet)
router.register("stock-transfers", StockTransferViewSet)
router.register("product-suppliers", ProductSupplierViewSet)
router.register("supplier-ledger", SupplierLedgerViewSet)
router.register("expenses", ExpenseViewSet)
router.register("shipping-rules", ShippingRuleViewSet)
router.register("delivery-slots", DeliverySlotViewSet, basename="delivery-slots")
router.register("message-templates", MessageTemplateViewSet)
router.register("scheduled-messages", ScheduledMessageViewSet)

urlpatterns = [
    path("database-backup/", DatabaseBackupView.as_view()),
    path("two-factor/", AdminTwoFactorView.as_view()),
    path("message-center/", MessageCenterView.as_view()),
    path("reports/", AdvancedReportView.as_view()),
    path("", include(router.urls)),
]
