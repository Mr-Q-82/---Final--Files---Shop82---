import json
import uuid
from urllib.request import Request, urlopen

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import (
    LoyaltyProfile, LoyaltySetting, Notification, Wallet, WalletTransaction,
)
from apps.marketing.models import FlashSale
from apps.products.models import Product, ProductVariant, CustomizationOption
from apps.accounts.services import send_sms
from .models import DiscountCode, Order, OrderStatusHistory, PaymentTransaction


def _post_json(url, payload):
    request = Request(
        url,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "TechStore/1.0"},
    )
    with urlopen(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def initiate_payment(order, callback_url):
    provider = settings.PAYMENT_PROVIDER.upper()
    key = f"{order.id}:{uuid.uuid4().hex}"
    transaction_item = PaymentTransaction.objects.create(
        order=order,
        provider=provider,
        amount=order.total,
        idempotency_key=key,
        status=PaymentTransaction.Status.PENDING,
    )
    if provider == "ZARINPAL":
        payload = {
            "merchant_id": settings.ZARINPAL_MERCHANT_ID,
            "amount": order.total * 10,
            "callback_url": callback_url,
            "description": f"پرداخت سفارش {order.number}",
            "metadata": {"mobile": order.user.phone},
        }
        result = _post_json(
            "https://payment.zarinpal.com/pg/v4/payment/request.json", payload
        )
        data = result.get("data") or {}
        if not data.get("authority"):
            transaction_item.status = PaymentTransaction.Status.FAILED
            transaction_item.raw_response = result
            transaction_item.save(update_fields=("status", "raw_response", "updated_at"))
            raise ValueError("درگاه پرداخت درخواست را نپذیرفت.")
        transaction_item.authority = data["authority"]
        transaction_item.raw_response = result
        transaction_item.save(update_fields=("authority", "raw_response", "updated_at"))
        return transaction_item, f"https://www.zarinpal.com/pg/StartPay/{data['authority']}"
    transaction_item.authority = f"MOCK-{uuid.uuid4().hex}"
    transaction_item.save(update_fields=("authority", "updated_at"))
    return transaction_item, f"{callback_url}?Authority={transaction_item.authority}&Status=OK"


@transaction.atomic
def restore_inventory(order):
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.inventory_restored or not order.inventory_committed:
        from apps.operations.models import InventoryReservation
        InventoryReservation.objects.filter(
            converted_order=order, is_active=True
        ).update(is_active=False)
        return
    for item in order.items.select_related("product").select_for_update():
        product = item.product
        if item.variant_sku:
            variant = ProductVariant.objects.select_for_update().filter(
                product=product, sku=item.variant_sku
            ).first()
            if variant:
                variant.stock += item.quantity
                variant.save(update_fields=("stock", "updated_at"))
        else:
            product.stock += item.quantity
        product.sold_count = max(0, product.sold_count - item.quantity)
        product.save(update_fields=("stock", "sold_count", "updated_at"))
        for selected in item.customization_snapshot or []:
            option = CustomizationOption.objects.select_for_update().filter(
                pk=selected.get("option_id")
            ).first()
            if option and option.stock is not None:
                option.stock += item.quantity
                option.save(update_fields=("stock", "updated_at"))
        from apps.operations.models import InventoryMovement
        InventoryMovement.objects.create(
            product=product, movement_type=InventoryMovement.Type.IN,
            quantity=item.quantity, stock_after=product.stock,
            reason=f"بازگشت موجودی سفارش لغوشده {order.number}",
            reference=order.number,
        )
        sale = FlashSale.objects.select_for_update().filter(product=product).order_by("-starts_at").first()
        if sale and sale.sold_count:
            sale.sold_count = max(0, sale.sold_count - item.quantity)
            sale.save(update_fields=("sold_count", "updated_at"))
    if order.discount_code:
        discount = DiscountCode.objects.select_for_update().filter(
            code__iexact=order.discount_code
        ).first()
        if discount and discount.used_count:
            discount.used_count -= 1
            discount.save(update_fields=("used_count", "updated_at"))
    order.inventory_restored = True
    order.save(update_fields=("inventory_restored", "updated_at"))


@transaction.atomic
def commit_inventory(order):
    """Deduct stock exactly once, after payment has completed."""
    order = Order.objects.select_for_update().get(pk=order.pk)
    if order.inventory_committed:
        return order
    for item in order.items.select_related("product"):
        product = Product.objects.select_for_update().get(pk=item.product_id)
        if item.variant_sku:
            variant = ProductVariant.objects.select_for_update().filter(
                product=product, sku=item.variant_sku, is_active=True
            ).first()
            if not variant or variant.stock < item.quantity:
                raise ValueError(f"موجودی «{item.product_name}» برای تکمیل سفارش کافی نیست.")
            variant.stock -= item.quantity
            variant.save(update_fields=("stock", "updated_at"))
        else:
            if product.stock < item.quantity:
                raise ValueError(f"موجودی «{item.product_name}» برای تکمیل سفارش کافی نیست.")
            product.stock -= item.quantity
        product.sold_count += item.quantity
        product.save(update_fields=("stock", "sold_count", "updated_at"))
        for selected in item.customization_snapshot or []:
            option_id = selected.get("option_id")
            if not option_id:
                continue
            option = CustomizationOption.objects.select_for_update().filter(pk=option_id).first()
            if option and option.stock is not None:
                if option.stock < item.quantity:
                    raise ValueError(f"موجودی گزینه «{option.name}» کافی نیست.")
                option.stock -= item.quantity
                option.save(update_fields=("stock", "updated_at"))
        from apps.operations.models import InventoryMovement
        InventoryMovement.objects.create(
            product=product, movement_type=InventoryMovement.Type.OUT,
            quantity=item.quantity, stock_after=product.stock,
            reason=f"فروش قطعی سفارش {order.number}",
            reference=order.number,
            actor=order.user,
        )
        sale = FlashSale.objects.select_for_update().filter(
            product=product, is_active=True, starts_at__lte=timezone.now(),
            ends_at__gte=timezone.now(),
        ).first()
        if sale:
            sale.sold_count += item.quantity
            sale.save(update_fields=("sold_count", "updated_at"))
        if product.stock <= 5:
            from apps.accounts.models import User
            Notification.objects.bulk_create([
                Notification(
                    user=admin, title="هشدار کمبود موجودی",
                    message=f"موجودی «{product.name}» به {product.stock} عدد رسیده است.",
                )
                for admin in User.objects.filter(
                    role__in=(User.Role.ADMIN, User.Role.STAFF), is_active=True
                )
            ])
    from apps.operations.models import InventoryReservation
    InventoryReservation.objects.filter(
        converted_order=order, is_active=True
    ).update(is_active=False)
    order.inventory_committed = True
    order.inventory_restored = False
    order.save(update_fields=("inventory_committed", "inventory_restored", "updated_at"))
    return order


def record_status(order, new_status, *, actor=None, note=""):
    old_status = order.status
    if old_status == new_status:
        return order
    if new_status == Order.Status.PAID:
        order = commit_inventory(order)
    OrderStatusHistory.objects.create(
        order=order,
        from_status=old_status,
        to_status=new_status,
        changed_by=actor,
        note=note,
    )
    order.status = new_status
    if new_status == Order.Status.PAID and not order.paid_at:
        order.paid_at = timezone.now()
    order.save(update_fields=("status", "paid_at", "updated_at"))
    Notification.objects.create(
        user=order.user,
        title=f"وضعیت سفارش {order.number}",
        message=f"وضعیت سفارش شما به «{order.get_status_display()}» تغییر کرد.",
        target_section="orders",
        target_id=str(order.id),
    )
    send_sms(
        order.user.phone,
        f"وضعیت سفارش {order.number}: {order.get_status_display()}",
        token=order.number,
        template=getattr(settings, "KAVENEGAR_ORDER_TEMPLATE", ""),
    )
    return order


@transaction.atomic
def verify_payment(transaction_item, gateway_status):
    transaction_item = PaymentTransaction.objects.select_for_update().select_related("order").get(
        pk=transaction_item.pk
    )
    if transaction_item.status == PaymentTransaction.Status.SUCCEEDED:
        return transaction_item
    if gateway_status != "OK":
        transaction_item.status = PaymentTransaction.Status.CANCELED
        transaction_item.save(update_fields=("status", "updated_at"))
        _restore_split_wallet(transaction_item.order)
        return transaction_item
    if transaction_item.provider == "ZARINPAL":
        result = _post_json(
            "https://payment.zarinpal.com/pg/v4/payment/verify.json",
            {
                "merchant_id": settings.ZARINPAL_MERCHANT_ID,
                "amount": transaction_item.amount * 10,
                "authority": transaction_item.authority,
            },
        )
        data = result.get("data") or {}
        if data.get("code") not in (100, 101):
            transaction_item.status = PaymentTransaction.Status.FAILED
            transaction_item.raw_response = result
            transaction_item.save(update_fields=("status", "raw_response", "updated_at"))
            _restore_split_wallet(transaction_item.order)
            return transaction_item
        transaction_item.reference_id = str(data.get("ref_id", ""))
        transaction_item.raw_response = result
    else:
        transaction_item.reference_id = f"TEST-{uuid.uuid4().hex[:12].upper()}"
    transaction_item.status = PaymentTransaction.Status.SUCCEEDED
    transaction_item.save(
        update_fields=("status", "reference_id", "raw_response", "updated_at")
    )
    order = transaction_item.order
    order.gateway_paid_amount = transaction_item.amount
    order.save(update_fields=("gateway_paid_amount", "updated_at"))
    record_status(order, Order.Status.PAID, note="پرداخت تأیید شد")
    loyalty = LoyaltyProfile.objects.select_for_update().get_or_create(
        user=transaction_item.order.user
    )[0]
    loyalty_setting = LoyaltySetting.get_solo()
    if loyalty_setting.is_active:
        steps = max(
            1,
            transaction_item.order.total
            // max(1, loyalty_setting.purchase_step_amount),
        )
        loyalty.points += steps * loyalty_setting.points_per_step
    loyalty.save()
    return transaction_item


def _restore_split_wallet(order):
    """Return the wallet part once when a split gateway payment fails."""
    if not order.wallet_paid_amount:
        return
    wallet = Wallet.objects.select_for_update().get_or_create(user=order.user)[0]
    amount = order.wallet_paid_amount
    wallet.balance += amount
    wallet.save(update_fields=("balance", "updated_at"))
    WalletTransaction.objects.create(
        wallet=wallet, transaction_type=WalletTransaction.Type.REFUND,
        amount=amount, description=f"بازگشت سهم کیف پول سفارش {order.number}",
        reference=order.number, balance_after=wallet.balance,
    )
    order.wallet_paid_amount = 0
    order.save(update_fields=("wallet_paid_amount", "updated_at"))
