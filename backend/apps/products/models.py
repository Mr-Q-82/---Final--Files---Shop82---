"""Stable product-domain model API.

The concrete models remain registered with the historical ``catalog`` app label
so existing migrations, foreign keys, backups and table names remain valid.
This compatibility boundary can be removed in a future major database migration.
"""

from apps.catalog.models import (  # noqa: F401
    ComparisonItem,
    Favorite,
    PriceHistory,
    Product,
    ProductImage,
    ProductRelation,
    ProductVariant,
    CustomizationGroup,
    CustomizationOption,
    CategoryUsageProfile,
    SearchQuery,
    StockAlert,
    Wishlist,
    WishlistItem,
)

__all__ = [
    "ComparisonItem", "Favorite", "PriceHistory", "Product", "ProductImage",
    "ProductRelation", "ProductVariant", "SearchQuery", "StockAlert",
    "CustomizationGroup", "CustomizationOption", "CategoryUsageProfile",
    "Wishlist", "WishlistItem",
]
