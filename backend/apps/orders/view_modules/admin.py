from ._shared import *
from .customer import *

class AdminOrderViewSet(viewsets.ModelViewSet):
    queryset = optimized_order_queryset().order_by("-created_at")
    serializer_class = OrderSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ["get", "post", "patch", "head", "options"]
    filterset_fields = ["status"]
    search_fields = ["number", "user__phone", "tracking_code"]
    ordering_fields = ["created_at", "total", "status"]

    def partial_update(self, request, *args, **kwargs):
        order = self.get_object()
        new_status = request.data.get("status")
        if request.data.get("tracking_code") is not None:
            order.tracking_code = str(request.data["tracking_code"])[:80]
            order.save(update_fields=("tracking_code", "updated_at"))
        if new_status and new_status != order.status:
            try:
                require_transition(order.status, new_status)
            except ValueError as exc:
                return Response(
                    {"detail": str(exc)},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if new_status == Order.Status.CANCELED:
                restore_inventory(order)
            if new_status == Order.Status.SENT:
                order.ensure_tracking_code()
            try:
                record_status(order, new_status, actor=request.user)
            except ValueError as exc:
                return Response(
                    {"detail": str(exc)}, status=status.HTTP_409_CONFLICT
                )
            return Response(self.get_serializer(order).data)
        return Response(self.get_serializer(order).data)

    @action(detail=True, methods=["post"], url_path="generate-tracking")
    def generate_tracking(self, request, pk=None):
        order = self.get_object()
        order.ensure_tracking_code()
        return Response({
            "tracking_code": order.tracking_code,
            "message": "کد رهگیری یکتا با موفقیت ساخته شد.",
        })

    @action(detail=False, methods=["get"])
    def export_csv(self, request):
        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        response["Content-Disposition"] = 'attachment; filename="orders.csv"'
        writer = csv.writer(response)
        writer.writerow(("شماره سفارش", "موبایل", "وضعیت", "مبلغ", "تاریخ"))
        for item in self.filter_queryset(self.get_queryset()):
            writer.writerow(
                (item.number, item.user.phone, item.get_status_display(), item.total, format_jalali(item.created_at, True))
            )
        return response

class DiscountCodeViewSet(viewsets.ModelViewSet):
    queryset = DiscountCode.objects.all().order_by("-created_at")
    serializer_class = DiscountCodeSerializer
    permission_classes = [IsAdminRole]
    search_fields = ["code"]
    @action(detail=False, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def validate_code(self, request):
        code = str(request.data.get("code", "")).strip().upper()
        subtotal = int(request.data.get("subtotal", 0) or 0)
        item = DiscountCode.objects.filter(code__iexact=code, is_active=True).first()
        now = timezone.now()
        if not item or (item.starts_at and item.starts_at > now) or (item.expires_at and item.expires_at < now):
            return Response({"detail": "کد تخفیف نامعتبر یا منقضی شده است."}, status=status.HTTP_400_BAD_REQUEST)
        if item.usage_limit and item.used_count >= item.usage_limit:
            return Response({"detail": "ظرفیت استفاده از کد تمام شده است."}, status=status.HTTP_400_BAD_REQUEST)
        if subtotal < item.min_purchase:
            return Response({"detail": "مبلغ خرید به حداقل این کد نرسیده است."}, status=status.HTTP_400_BAD_REQUEST)
        amount = min(subtotal, max(round(subtotal * item.percent / 100), item.fixed_amount))
        return Response({"code": item.code, "discount_amount": amount})

class ReturnRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ReturnRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ("get", "post", "patch", "head", "options")
    filterset_fields = ("status", "order")
    def get_queryset(self):
        qs = ReturnRequest.objects.select_related("order", "user")
        if self.request.user.role in {"ADMIN", "STAFF"}:
            return qs
        return qs.filter(user=self.request.user)
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    @transaction.atomic
    def partial_update(self, request, *args, **kwargs):
        if request.user.role not in {"ADMIN", "STAFF"}:
            return Response({"detail": "تغییر وضعیت فقط توسط مدیریت انجام می‌شود."}, status=403)
        item = ReturnRequest.objects.select_for_update().get(pk=self.get_object().pk)
        old_status = item.status
        new_status = request.data.get("status", old_status)
        allowed = {
            ReturnRequest.Status.REQUESTED: {ReturnRequest.Status.REVIEWING, ReturnRequest.Status.REJECTED},
            ReturnRequest.Status.REVIEWING: {ReturnRequest.Status.APPROVED, ReturnRequest.Status.REJECTED},
            ReturnRequest.Status.APPROVED: {ReturnRequest.Status.REFUNDED},
            ReturnRequest.Status.REJECTED: set(),
            ReturnRequest.Status.REFUNDED: set(),
        }
        if new_status != old_status and new_status not in allowed[old_status]:
            return Response({"detail": "این تغییر وضعیت مجاز نیست."}, status=400)
        item.status = new_status
        item.admin_note = str(request.data.get("admin_note", item.admin_note))
        notification_message = ""
        if new_status == ReturnRequest.Status.REVIEWING and old_status != new_status:
            notification_message = (
                f"درخواست مرجوعی سفارش {item.order.number} در حال بررسی است."
            )
        if new_status == ReturnRequest.Status.APPROVED and old_status != new_status:
            amount = int(request.data.get("refund_amount") or item.order.total)
            item.refund_amount = min(amount, item.order.total)
            if not item.refund_paid:
                wallet = Wallet.objects.select_for_update().get_or_create(
                    user=item.user
                )[0]
                wallet.balance += item.refund_amount
                wallet.save(update_fields=("balance", "updated_at"))
                WalletTransaction.objects.create(
                    wallet=wallet,
                    transaction_type=WalletTransaction.Type.REFUND,
                    amount=item.refund_amount,
                    description=f"بازپرداخت سفارش {item.order.number}",
                    reference=item.order.number,
                    idempotency_key=f"RETURN:{item.id}",
                    balance_after=wallet.balance,
                )
                item.refund_paid = True
            address = item.order.address_snapshot or {}
            delivery_address = "، ".join(filter(None, (
                address.get("province"), address.get("city"), address.get("address"),
            )))
            notification_message = (
                f"درخواست مرجوعی سفارش {item.order.number} تأیید شد. مبلغ "
                f"{item.refund_amount:,} تومان به کیف پول شما بازگردانده شد و در اسرع وقت "
                f"پیک ما برای دریافت محصول به آدرس شما"
                f"{' (' + delivery_address + ')' if delivery_address else ''} می‌آید."
            )
        if new_status == ReturnRequest.Status.REFUNDED and old_status != new_status:
            amount = int(request.data.get("refund_amount") or item.order.total)
            item.refund_amount = min(amount, item.order.total)
            # Backward compatibility for requests approved before version 17.
            if not item.refund_paid:
                wallet = Wallet.objects.select_for_update().get_or_create(
                    user=item.user
                )[0]
                wallet.balance += item.refund_amount
                wallet.save(update_fields=("balance", "updated_at"))
                WalletTransaction.objects.create(
                    wallet=wallet,
                    transaction_type=WalletTransaction.Type.REFUND,
                    amount=item.refund_amount,
                    description=f"بازپرداخت سفارش {item.order.number}",
                    reference=item.order.number,
                    idempotency_key=f"RETURN:{item.id}",
                    balance_after=wallet.balance,
                )
                item.refund_paid = True
            if not item.inventory_restocked:
                from apps.products.models import ProductVariant
                from apps.operations.models import InventoryMovement
                for line in item.order.items.select_related("product"):
                    product = Product.objects.select_for_update().get(pk=line.product_id)
                    if line.variant_sku:
                        variant = ProductVariant.objects.select_for_update().filter(
                            product=product, sku=line.variant_sku
                        ).first()
                        if variant:
                            variant.stock += line.quantity
                            variant.save(update_fields=("stock", "updated_at"))
                    else:
                        product.stock += line.quantity
                    product.sold_count = max(0, product.sold_count - line.quantity)
                    product.save(update_fields=("stock", "sold_count", "updated_at"))
                    InventoryMovement.objects.create(
                        product=product, movement_type=InventoryMovement.Type.IN,
                        quantity=line.quantity, stock_after=product.stock,
                        reason=f"مرجوعی تأییدشده سفارش {item.order.number}",
                        reference=str(item.id), actor=request.user,
                    )
                item.inventory_restocked = True
            notification_message = (
                f"مبلغ {item.refund_amount:,} تومان بابت مرجوعی سفارش "
                f"{item.order.number} به کیف پول شما بازگردانده شد."
            )
        item.save()
        if notification_message:
            from apps.accounts.models import Notification
            from apps.accounts.services import send_sms
            Notification.objects.create(
                user=item.user, title=f"مرجوعی سفارش {item.order.number}",
                message=notification_message,
                target_section="returns", target_id=str(item.id),
            )
            send_sms(item.user.phone, notification_message, token=item.order.number)
        return Response(self.get_serializer(item).data)
