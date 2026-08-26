import csv
from django.conf import settings
from django.db import transaction
from django.db.models import Prefetch
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.models import LoyaltyProfile, LoyaltySetting, Wallet, WalletTransaction
from apps.products.models import Product
from apps.common.permissions import IsAdminRole
from apps.common.jalali import format_jalali
from ..models import (
    DiscountCode, Order, OrderStatusHistory, PaymentTransaction, ReturnRequest,
)
from apps.operations.models import ShipmentEvent
from ..serializers import (
    CheckoutSerializer, DiscountCodeSerializer, OrderSerializer,
    PaymentTransactionSerializer, ReturnRequestSerializer,
)
from ..services import (
    commit_inventory, initiate_payment, record_status, restore_inventory,
    verify_payment,
)
from ..pdf import build_invoice_pdf
from ..state_machine import require_transition


def optimized_order_queryset():
    return Order.objects.select_related("user").prefetch_related(
        "items",
        "payments",
        Prefetch(
            "status_history",
            queryset=OrderStatusHistory.objects.select_related("changed_by"),
        ),
        Prefetch(
            "return_requests",
            queryset=ReturnRequest.objects.order_by("-created_at"),
            to_attr="_ordered_returns",
        ),
        Prefetch(
            "shipment_events",
            queryset=ShipmentEvent.objects.order_by("created_at"),
            to_attr="_ordered_shipments",
        ),
    )



__all__ = [name for name in globals() if not name.startswith('__')]
