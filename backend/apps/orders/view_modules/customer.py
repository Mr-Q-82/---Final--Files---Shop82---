from ._shared import *

class OrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = OrderSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        qs = optimized_order_queryset().order_by("-created_at")
        if self.request.user.role in {"ADMIN", "STAFF"}:
            return qs
        return qs.filter(user=self.request.user)
    @action(detail=False, methods=["post"], serializer_class=CheckoutSerializer)
    def checkout(self, request):
        serializer = CheckoutSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderSerializer(order).data, status=201)

    @action(detail=True, methods=["post"])
    def payment(self, request, pk=None):
        order = self.get_object()
        if order.status != Order.Status.PENDING:
            return Response(
                {"detail": "این سفارش در وضعیت قابل پرداخت نیست."},
                status=status.HTTP_409_CONFLICT,
            )
        pending = order.payments.filter(
            status=PaymentTransaction.Status.PENDING
        ).order_by("-created_at").first()
        if pending:
            callback = settings.PAYMENT_CALLBACK_URL
            redirect_url = (
                f"{callback}?Authority={pending.authority}&Status=OK"
                if pending.provider == "MOCK"
                else f"https://www.zarinpal.com/pg/StartPay/{pending.authority}"
            )
            return Response(
                {
                    "transaction": PaymentTransactionSerializer(pending).data,
                    "redirect_url": redirect_url,
                }
            )
        try:
            item, redirect_url = initiate_payment(order, settings.PAYMENT_CALLBACK_URL)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        return Response(
            {
                "transaction": PaymentTransactionSerializer(item).data,
                "redirect_url": redirect_url,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="pay-wallet")
    @transaction.atomic
    def pay_wallet(self, request, pk=None):
        order = Order.objects.select_for_update().get(pk=self.get_object().pk)
        if order.status != Order.Status.PENDING:
            return Response({"detail": "این سفارش در وضعیت قابل پرداخت نیست."}, status=409)
        wallet = Wallet.objects.select_for_update().get_or_create(user=request.user)[0]
        if wallet.balance < order.total:
            return Response({"detail": "موجودی کیف پول کافی نیست."}, status=400)
        try:
            commit_inventory(order)
        except ValueError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_409_CONFLICT)
        wallet.balance -= order.total
        wallet.save(update_fields=("balance", "updated_at"))
        WalletTransaction.objects.create(
            wallet=wallet, transaction_type=WalletTransaction.Type.DEBIT,
            amount=order.total, description=f"پرداخت سفارش {order.number}",
            reference=order.number, balance_after=wallet.balance,
        )
        record_status(order, Order.Status.PAID, actor=request.user, note="پرداخت با کیف پول")
        loyalty = LoyaltyProfile.objects.select_for_update().get_or_create(user=request.user)[0]
        loyalty_setting = LoyaltySetting.get_solo()
        if loyalty_setting.is_active:
            steps = max(1, order.total // max(1, loyalty_setting.purchase_step_amount))
            loyalty.points += steps * loyalty_setting.points_per_step
        loyalty.save()
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="split-payment")
    @transaction.atomic
    def split_payment(self, request, pk=None):
        order = Order.objects.select_for_update().get(pk=self.get_object().pk)
        if order.status != Order.Status.PENDING:
            return Response({"detail": "این سفارش در وضعیت قابل پرداخت نیست."}, status=409)
        wallet = Wallet.objects.select_for_update().get_or_create(user=request.user)[0]
        wallet_amount = min(wallet.balance, order.total)
        gateway_amount = order.total - wallet_amount
        order.wallet_paid_amount = wallet_amount
        if wallet_amount:
            wallet.balance -= wallet_amount
            wallet.save(update_fields=("balance", "updated_at"))
            WalletTransaction.objects.create(
                wallet=wallet, transaction_type=WalletTransaction.Type.DEBIT,
                amount=wallet_amount, description=f"سهم کیف پول سفارش {order.number}",
                reference=order.number, balance_after=wallet.balance,
            )
        order.save(update_fields=("wallet_paid_amount", "updated_at"))
        if gateway_amount == 0:
            try:
                commit_inventory(order)
            except ValueError as exc:
                return Response({"detail": str(exc)}, status=409)
            order.gateway_paid_amount = 0
            order.save(update_fields=("gateway_paid_amount", "updated_at"))
            record_status(order, Order.Status.PAID, actor=request.user, note="پرداخت کامل با کیف پول")
            return Response({"order": OrderSerializer(order).data, "redirect_url": ""})
        # درگاه فقط مبلغ باقی‌مانده را دریافت می‌کند.
        original_total = order.total
        order.total = gateway_amount
        try:
            payment, redirect_url = initiate_payment(order, settings.PAYMENT_CALLBACK_URL)
        except ValueError as exc:
            wallet.balance += wallet_amount
            wallet.save(update_fields=("balance", "updated_at"))
            order.wallet_paid_amount = 0
            order.total = original_total
            order.save(update_fields=("wallet_paid_amount", "total", "updated_at"))
            return Response({"detail": str(exc)}, status=502)
        order.total = original_total
        order.save(update_fields=("total", "updated_at"))
        return Response({
            "wallet_amount": wallet_amount, "gateway_amount": gateway_amount,
            "transaction": PaymentTransactionSerializer(payment).data,
            "redirect_url": redirect_url,
        }, status=201)

    @action(
        detail=False, methods=["get"], url_path="payment-callback",
        permission_classes=[permissions.AllowAny],
    )
    def payment_callback(self, request):
        authority = request.query_params.get("Authority", "")
        gateway_status = request.query_params.get("Status", "")
        item = PaymentTransaction.objects.filter(authority=authority).first()
        if not item:
            return Response(
                {"detail": "تراکنش پیدا نشد."}, status=status.HTTP_404_NOT_FOUND
            )
        item = verify_payment(item, gateway_status)
        return Response(
            {
                "success": item.status == PaymentTransaction.Status.SUCCEEDED,
                "reference_id": item.reference_id,
                "order": item.order.number,
                "status": item.status,
            }
        )

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status != Order.Status.PENDING:
            return Response(
                {"detail": "فقط سفارش در انتظار پرداخت قابل لغو است."},
                status=status.HTTP_409_CONFLICT,
            )
        restore_inventory(order)
        record_status(
            order, Order.Status.CANCELED, actor=request.user,
            note=str(request.data.get("reason", "لغو توسط مشتری"))[:300],
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["get"])
    def invoice(self, request, pk=None):
        order = self.get_object()
        rows = "".join(
            f"<tr><td>{item.product_name}</td><td>{item.quantity}</td>"
            f"<td>{item.unit_price:,}</td><td>{item.line_total:,}</td></tr>"
            for item in order.items.all()
        )
        html = (
            "<!doctype html><html lang='fa' dir='rtl'><meta charset='utf-8'>"
            "<style>body{font-family:Tahoma;padding:35px}table{width:100%;"
            "border-collapse:collapse}td,th{padding:10px;border:1px solid #ddd}"
            "</style><h1>فاکتور فروشگاه 82</h1>"
            f"<p>شماره سفارش: {order.number}</p>"
            f"<p>تاریخ: {format_jalali(order.created_at, True)}</p>"
            "<table><tr><th>کالا</th>"
            f"<th>تعداد</th><th>قیمت</th><th>جمع</th></tr>{rows}</table>"
            f"<h3>مبلغ نهایی: {order.total:,} تومان</h3></html>"
        )
        response = HttpResponse(html, content_type="text/html; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{order.number}.html"'
        return response

    @action(detail=True, methods=["get"], url_path="invoice-pdf")
    def invoice_pdf(self, request, pk=None):
        order = self.get_object()
        response = HttpResponse(build_invoice_pdf(order), content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{order.number}.pdf"'
        return response

