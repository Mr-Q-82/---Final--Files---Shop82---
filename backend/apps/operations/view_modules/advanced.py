from ._shared import *
from .backup import *
from .inventory import *
from .fulfillment import *

class PromotionRuleViewSet(AdminModelViewSet):
    queryset = PromotionRule.objects.all()
    serializer_class = PromotionRuleSerializer

class ReservationViewSet(viewsets.ModelViewSet):
    serializer_class = InventoryReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ("get", "post", "delete", "head", "options")
    def get_queryset(self):
        qs = InventoryReservation.objects.select_related("product", "user")
        if self.request.user.role in {"ADMIN", "STAFF"}:
            return qs
        return qs.filter(user=self.request.user)
    @transaction.atomic
    def perform_create(self, serializer):
        product = Product.objects.select_for_update().get(id=serializer.validated_data["product"].id)
        quantity = serializer.validated_data["quantity"]
        active_reserved = InventoryReservation.objects.filter(
            product=product, is_active=True, expires_at__gt=timezone.now()
        ).aggregate(value=Sum("quantity"))["value"] or 0
        if product.stock - active_reserved < quantity:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("موجودی قابل رزرو کافی نیست.")
        serializer.save(user=self.request.user, expires_at=timezone.now() + timedelta(minutes=15))

class AbandonedCartViewSet(viewsets.ModelViewSet):
    serializer_class = AbandonedCartSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ("get", "post", "patch", "delete", "head", "options")
    def get_queryset(self):
        if self.request.user.role in {"ADMIN", "STAFF"}:
            return AbandonedCart.objects.select_related("user")
        return AbandonedCart.objects.filter(user=self.request.user)
    def create(self, request, *args, **kwargs):
        item, _ = AbandonedCart.objects.update_or_create(
            user=request.user,
            defaults={"items": request.data.get("items", []), "total": int(request.data.get("total", 0) or 0)},
        )
        return Response(self.get_serializer(item).data, status=200)
    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole])
    def remind(self, request, pk=None):
        cart = self.get_object()
        Notification.objects.create(
            user=cart.user, title="سبد خرید شما منتظر است",
            message="محصولات انتخاب‌شده هنوز در سبد شما هستند؛ برای تکمیل خرید برگردید.",
        )
        cart.reminder_sent_at = timezone.now()
        cart.save(update_fields=("reminder_sent_at", "updated_at"))
        return Response(self.get_serializer(cart).data)

class ShipmentEventViewSet(viewsets.ModelViewSet):
    serializer_class = ShipmentEventSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        qs = ShipmentEvent.objects.select_related("order", "order__user")
        if self.request.user.role in {"ADMIN", "STAFF"}:
            return qs
        return qs.filter(order__user=self.request.user)
    def perform_create(self, serializer):
        if self.request.user.role not in {"ADMIN", "STAFF"}:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        serializer.save()

class AdminTwoFactorView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        item = AdminTwoFactor.objects.get_or_create(user=request.user)[0]
        return Response(AdminTwoFactorSerializer(item).data)
    def post(self, request):
        if request.user.role not in {"ADMIN", "STAFF"}:
            return Response({"detail": "این قابلیت مخصوص مدیران است."}, status=403)
        item = AdminTwoFactor.objects.get_or_create(user=request.user)[0]
        item.is_enabled = bool(request.data.get("is_enabled", True))
        item.save(update_fields=("is_enabled", "updated_at"))
        return Response(AdminTwoFactorSerializer(item).data)

class BehaviorEventViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    queryset = BehaviorEvent.objects.all()
    serializer_class = BehaviorEventSerializer
    permission_classes = [permissions.AllowAny]
    def perform_create(self, serializer):
        serializer.save(user=self.request.user if self.request.user.is_authenticated else None)

class ServiceHealthViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ServiceHealth.objects.all()
    serializer_class = ServiceHealthSerializer
    permission_classes = [IsAdminRole]
    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def live(self, request):
        return Response({"status": "ok", "time": timezone.now(), "database": "ok"})

class MessageCenterView(APIView):
    permission_classes = [IsAdminRole]
    def get(self, request):
        return Response({
            "unread_notifications": Notification.objects.filter(is_read=False).count(),
            "open_tickets": SupportTicket.objects.exclude(status=SupportTicket.Status.CLOSED).count(),
            "recent_notifications": list(Notification.objects.values(
                "id", "title", "message", "user__phone", "is_read", "created_at"
            )[:20]),
            "recent_communications": list(CommunicationLog.objects.values(
                "id", "channel", "recipient", "subject", "message",
                "is_success", "created_at",
            )[:30]),
        })

class AdvancedReportView(APIView):
    permission_classes = [IsAdminRole]
    def get(self, request):
        paid = Order.objects.exclude(status__in=(Order.Status.PENDING, Order.Status.CANCELED))
        customers = paid.values("user").distinct().count() or 1
        revenue = paid.aggregate(value=Sum("total"))["value"] or 0
        expenses = Expense.objects.aggregate(value=Sum("amount"))["value"] or 0
        purchase_cost = PurchaseOrderItem.objects.filter(
            purchase_order__status=PurchaseOrder.Status.RECEIVED
        ).aggregate(value=Sum(F("quantity") * F("unit_cost")))["value"] or 0
        return Response({
            "conversion": {
                "paid_orders": paid.count(),
                "average_order": paid.aggregate(value=Sum("total"))["value"] // max(paid.count(), 1) if paid.exists() else 0,
            },
            "customer_value": {
                "customers": customers,
                "revenue_per_customer": (paid.aggregate(value=Sum("total"))["value"] or 0) // customers,
            },
            "unsold_products": list(Product.objects.filter(sold_count=0).values("id", "name", "stock")[:30]),
            "behavior": list(BehaviorEvent.objects.values("event_type").annotate(count=Count("id")).order_by("-count")),
            "finance": {
                "revenue": revenue, "purchase_cost": purchase_cost, "expenses": expenses,
                "estimated_net_profit": revenue - purchase_cost - expenses,
            },
            "inventory": {
                "warehouse_value": WarehouseStock.objects.aggregate(
                    value=Sum(F("quantity") * F("average_cost"))
                )["value"] or 0,
                "reorder_count": WarehouseStock.objects.filter(
                    quantity__lte=F("reorder_point")
                ).count(),
            },
        })
