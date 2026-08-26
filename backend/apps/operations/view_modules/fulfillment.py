from ._shared import *
from .backup import *
from .inventory import *

class ExpenseViewSet(AdminModelViewSet):
    queryset = Expense.objects.all().order_by("-incurred_at")
    serializer_class = ExpenseSerializer
    filterset_fields = ("category", "incurred_at")

class ShippingRuleViewSet(viewsets.ModelViewSet):
    queryset = ShippingRule.objects.all()
    serializer_class = ShippingRuleSerializer
    def get_permissions(self):
        return [permissions.AllowAny()] if self.action in {"list", "quote"} else [IsAdminRole()]
    @action(detail=False, methods=["post"], permission_classes=[permissions.AllowAny])
    def quote(self, request):
        province = str(request.data.get("province", "")).strip()
        weight = max(0, int(request.data.get("weight_grams", 0) or 0))
        subtotal = max(0, int(request.data.get("subtotal", 0) or 0))
        rows = []
        for rule in self.get_queryset().filter(is_active=True):
            if rule.provinces and province not in rule.provinces:
                continue
            if rule.min_weight and weight < rule.min_weight:
                continue
            if rule.max_weight and weight > rule.max_weight:
                continue
            if subtotal < rule.min_order_amount:
                continue
            cost = rule.base_cost + ((weight + 999) // 1000) * rule.cost_per_kg
            if rule.free_above and subtotal >= rule.free_above:
                cost = 0
            rows.append({"id": rule.id, "title": rule.title, "method": rule.method,
                         "cost": cost, "estimated_days": rule.estimated_days})
        return Response(rows)

class DeliverySlotViewSet(viewsets.ModelViewSet):
    serializer_class = DeliverySlotSerializer
    def get_queryset(self):
        qs = DeliverySlot.objects.all().order_by("date", "starts_at")
        if not (self.request.user.is_authenticated and self.request.user.role in {"ADMIN", "STAFF"}):
            qs = qs.filter(is_active=True, date__gte=timezone.localdate())
        return qs
    def get_permissions(self):
        return [permissions.AllowAny()] if self.action in {"list", "retrieve"} else [IsAdminRole()]

class MessageTemplateViewSet(AdminModelViewSet):
    queryset = MessageTemplate.objects.all()
    serializer_class = MessageTemplateSerializer

class ScheduledMessageViewSet(AdminModelViewSet):
    queryset = ScheduledMessage.objects.select_related("template")
    serializer_class = ScheduledMessageSerializer
    @action(detail=True, methods=["post"])
    def send_now(self, request, pk=None):
        item = self.get_object()
        if item.is_canceled:
            return Response({"detail": "این پیام لغو شده است."}, status=409)
        CommunicationLog.objects.create(
            recipient=item.recipient or item.audience,
            channel=item.template.channel,
            subject=item.template.subject,
            message=item.template.body,
            provider_response={"scheduled_message": item.id},
        )
        item.sent_at = timezone.now()
        item.save(update_fields=("sent_at", "updated_at"))
        return Response(self.get_serializer(item).data)

class InventoryMovementViewSet(AdminModelViewSet):
    queryset = InventoryMovement.objects.select_related("product", "actor")
    serializer_class = InventoryMovementSerializer
    filterset_fields = ("product", "movement_type")
    @transaction.atomic
    def perform_create(self, serializer):
        product = Product.objects.select_for_update().get(id=serializer.validated_data["product"].id)
        old_stock = product.stock
        quantity = serializer.validated_data["quantity"]
        movement_type = serializer.validated_data["movement_type"]
        if movement_type in {InventoryMovement.Type.OUT, InventoryMovement.Type.RESERVE}:
            next_stock = product.stock - abs(quantity)
        elif movement_type == InventoryMovement.Type.ADJUST:
            next_stock = max(0, quantity)
        else:
            next_stock = product.stock + abs(quantity)
        if next_stock < 0:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("موجودی برای این خروج کافی نیست.")
        product.stock = next_stock
        product.save(update_fields=("stock", "updated_at"))
        serializer.save(actor=self.request.user, stock_after=next_stock, quantity=abs(quantity))
        if old_stock <= 0 < next_stock:
            from apps.products.services import notify_stock_available
            notify_stock_available(product)

class PurchaseOrderViewSet(AdminModelViewSet):
    queryset = PurchaseOrder.objects.select_related("supplier").prefetch_related("items")
    serializer_class = PurchaseOrderSerializer
    @action(detail=True, methods=["post"])
    @transaction.atomic
    def receive(self, request, pk=None):
        order = PurchaseOrder.objects.select_for_update().get(pk=self.get_object().pk)
        if order.status == PurchaseOrder.Status.RECEIVED:
            return Response({"detail": "این سفارش خرید قبلاً دریافت شده است."}, status=409)
        for item in order.items.select_related("product"):
            product = Product.objects.select_for_update().get(id=item.product_id)
            old_stock = product.stock
            product.stock += item.quantity
            product.save(update_fields=("stock", "updated_at"))
            InventoryMovement.objects.create(
                product=product, movement_type=InventoryMovement.Type.IN,
                quantity=item.quantity, stock_after=product.stock,
                reason="دریافت سفارش خرید", reference=str(order.id), actor=request.user,
            )
            if old_stock <= 0 < product.stock:
                from apps.products.services import notify_stock_available
                notify_stock_available(product)
        order.status = PurchaseOrder.Status.RECEIVED
        order.save(update_fields=("status", "updated_at"))
        return Response(self.get_serializer(order).data)

class PurchaseOrderItemViewSet(AdminModelViewSet):
    queryset = PurchaseOrderItem.objects.select_related("purchase_order", "product")
    serializer_class = PurchaseOrderItemSerializer

class ProductBundleViewSet(viewsets.ModelViewSet):
    queryset = ProductBundle.objects.prefetch_related("items__product")
    serializer_class = ProductBundleSerializer
    def get_permissions(self):
        return [permissions.AllowAny()] if self.action in {"list", "retrieve"} else [IsAdminRole()]

class BundleItemViewSet(AdminModelViewSet):
    queryset = BundleItem.objects.select_related("bundle", "product")
    serializer_class = BundleItemSerializer

class GiftCardViewSet(AdminModelViewSet):
    queryset = GiftCard.objects.select_related("assigned_to")
    serializer_class = GiftCardSerializer
    @action(detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    @transaction.atomic
    def redeem(self, request):
        code = str(request.data.get("code", "")).strip().upper()
        card = GiftCard.objects.select_for_update().filter(code__iexact=code, is_active=True).first()
        if not card or not card.balance or (card.expires_at and card.expires_at < timezone.now()):
            return Response({"detail": "کارت هدیه معتبر نیست یا منقضی شده است."}, status=400)
        if card.assigned_to_id and card.assigned_to_id != request.user.id:
            return Response({"detail": "این کارت برای حساب دیگری صادر شده است."}, status=403)
        wallet = Wallet.objects.select_for_update().get_or_create(user=request.user)[0]
        amount = card.balance
        wallet.balance += amount
        wallet.save(update_fields=("balance", "updated_at"))
        WalletTransaction.objects.create(
            wallet=wallet, transaction_type=WalletTransaction.Type.CREDIT,
            amount=amount, description=f"کارت هدیه {card.code}",
            reference=card.code, balance_after=wallet.balance,
        )
        card.balance = 0
        card.is_active = False
        card.assigned_to = request.user
        card.save(update_fields=("balance", "is_active", "assigned_to", "updated_at"))
        return Response({"message": "اعتبار کارت هدیه به کیف پول اضافه شد.", "amount": amount})
