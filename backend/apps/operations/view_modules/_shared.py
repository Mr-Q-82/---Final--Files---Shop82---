from datetime import timedelta
from django.conf import settings
from django.db import transaction
from django.http import FileResponse
from django.db.models import Count, Sum, F
from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.models import Notification, SupportTicket, Wallet, WalletTransaction
from apps.products.models import Product
from apps.common.permissions import IsAdminRole
from apps.common.database_backup import (
    InvalidBackup, RestoreFailed, create_full_backup, read_full_backup,
    restore_full_backup,
)
from apps.orders.models import Order
from ..models import (
    AbandonedCart, AdminTwoFactor, BehaviorEvent, BundleItem, CommunicationLog, GiftCard,
    InventoryMovement, InventoryReservation, ProductBundle, PromotionRule,
    PurchaseOrder, PurchaseOrderItem, ServiceHealth, ShipmentEvent, Supplier,
    DeliverySlot, Expense, MessageTemplate, ProductSupplier, ScheduledMessage,
    ShippingRule, StockTransfer, SupplierLedger, Warehouse, WarehouseStock,
)
from ..serializers import (
    AbandonedCartSerializer, AdminTwoFactorSerializer, BehaviorEventSerializer,
    BundleItemSerializer, GiftCardSerializer, InventoryMovementSerializer,
    InventoryReservationSerializer, ProductBundleSerializer, PromotionRuleSerializer,
    PurchaseOrderItemSerializer, PurchaseOrderSerializer, ServiceHealthSerializer,
    ShipmentEventSerializer, SupplierSerializer,
    DeliverySlotSerializer, ExpenseSerializer, MessageTemplateSerializer,
    ProductSupplierSerializer, ScheduledMessageSerializer, ShippingRuleSerializer,
    StockTransferSerializer, SupplierLedgerSerializer, WarehouseSerializer,
    WarehouseStockSerializer,
)


class AdminModelViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminRole]



__all__ = [name for name in globals() if not name.startswith('__')]
