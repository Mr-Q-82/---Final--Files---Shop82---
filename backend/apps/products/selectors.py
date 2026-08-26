"""Read-only product queries shared by API, orders and dashboards."""

from django.db.models import Count, F, Prefetch, Q, QuerySet
from django.utils import timezone

from apps.marketing.models import FlashSale
from apps.reviews.models import ProductReview
from .models import Product


def product_catalog(*, public_only: bool = True) -> QuerySet:
    """Return the canonical, optimized queryset for product list/detail APIs."""
    now = timezone.now()
    active_sales = FlashSale.objects.filter(
        is_active=True,
        starts_at__lte=now,
        ends_at__gte=now,
    ).filter(Q(stock_limit=0) | Q(sold_count__lt=F("stock_limit")))
    queryset = (
        Product.objects.select_related("category", "brand")
        .annotate(
            approved_reviews_count_value=Count(
                "reviews",
                filter=Q(reviews__status=ProductReview.Status.APPROVED),
                distinct=True,
            )
        )
        .prefetch_related(
            "variants",
            "usage_profiles",
            Prefetch("flash_sales", queryset=active_sales, to_attr="_active_flash_sales"),
        )
        .order_by("-created_at")
    )
    return queryset.filter(is_active=True) if public_only else queryset


def product_by_id_for_update(product_id: int) -> Product:
    """Lock a product row for inventory-sensitive write operations."""
    return Product.objects.select_for_update().get(pk=product_id)
