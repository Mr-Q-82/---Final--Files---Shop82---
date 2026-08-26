"""Product HTTP boundary while retaining the established API contract."""

from apps.catalog.views import (
    ComparisonViewSet,
    FavoriteViewSet,
    PriceHistoryViewSet,
    ProductRelationViewSet,
    ProductVariantViewSet,
    ProductViewSet as LegacyProductViewSet,
    SharedWishlistView,
    StockAlertViewSet,
    WishlistViewSet,
)
from .selectors import product_catalog
from .services import initialize_product, record_product_change


class ProductViewSet(LegacyProductViewSet):
    """Product API with optimized reads and transactional domain events."""

    def get_queryset(self):
        is_staff = (
            self.request.user.is_authenticated
            and self.request.user.role in {"ADMIN", "STAFF"}
        )
        queryset = product_catalog(public_only=not is_staff)
        # Large customization trees are needed only on the product page. Not
        # prefetching them for catalog cards makes the initial shop response
        # substantially smaller and avoids repeated category option queries.
        if self.action == "retrieve":
            queryset = queryset.prefetch_related(
                "gallery",
                "questions",
                "price_history",
                "category__customization_groups__options",
                "category__customization_groups__products",
            )
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            queryset = queryset.filter(price__gte=min_price)
        if max_price:
            queryset = queryset.filter(price__lte=max_price)
        return queryset

    def perform_create(self, serializer):
        product = serializer.save()
        initialize_product(product=product)

    def perform_update(self, serializer):
        current = serializer.instance
        previous = (current.price, current.discount_percent, current.stock)
        product = serializer.save()
        record_product_change(
            product=product,
            previous_price=previous[0],
            previous_discount=previous[1],
            previous_stock=previous[2],
        )


__all__ = [
    "ComparisonViewSet", "FavoriteViewSet", "PriceHistoryViewSet",
    "ProductRelationViewSet", "ProductVariantViewSet", "ProductViewSet",
    "SharedWishlistView", "StockAlertViewSet", "WishlistViewSet",
]
