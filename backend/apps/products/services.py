"""Transactional product write operations.

Views should coordinate HTTP concerns only; business rules belong here.
"""

from dataclasses import dataclass

from django.db import transaction

from apps.accounts.models import Notification
from apps.accounts.services import send_sms
from .models import PriceHistory, Product
from .models import StockAlert


@dataclass(frozen=True)
class ProductChange:
    price_changed: bool
    restocked: bool


def notify_stock_available(product: Product) -> int:
    """Notify waiting customers once after inventory becomes available."""
    alerts = list(
        StockAlert.objects.filter(product=product, is_notified=False).select_related("user")
    )
    if not alerts:
        return 0
    Notification.objects.bulk_create(
        [
            Notification(
                user=alert.user,
                title="محصول دوباره موجود شد",
                message=f"«{product.name}» دوباره شارژ شده و آماده سفارش است.",
            )
            for alert in alerts
        ]
    )
    for alert in alerts:
        send_sms(
            alert.user.phone,
            f"محصول {product.name} دوباره در فروشگاه 82 موجود شد.",
            token=product.name[:50],
        )
    StockAlert.objects.filter(pk__in=[alert.pk for alert in alerts]).update(is_notified=True)
    return len(alerts)


@transaction.atomic
def record_product_change(*, product: Product, previous_price, previous_discount, previous_stock: int) -> ProductChange:
    price_changed = (
        previous_price != product.price
        or previous_discount != product.discount_percent
    )
    restocked = previous_stock <= 0 < product.stock
    if price_changed:
        PriceHistory.objects.create(
            product=product,
            price=product.price,
            discount_percent=product.discount_percent,
        )
    if restocked:
        transaction.on_commit(lambda: notify_stock_available(product))
    return ProductChange(price_changed=price_changed, restocked=restocked)


@transaction.atomic
def initialize_product(*, product: Product) -> None:
    PriceHistory.objects.create(
        product=product,
        price=product.price,
        discount_percent=product.discount_percent,
    )
