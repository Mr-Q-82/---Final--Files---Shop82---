from django.db.models import Avg
from pathlib import Path
from rest_framework import serializers
from apps.common.validators import validate_safe_text
from ..models import (
    Brand, Category, CategoryProductRecommendation, ComparisonItem, Favorite, FlashSale, HeroSlide, HomeSection, MenuItem,
    NewsletterCampaign, NewsletterSubscriber, PriceHistory, Product, ProductImage, ProductQuestion,
    PromoBanner,
    ProductReview, ProductVariant, SiteSetting, StockAlert,
    BuyingGuide, ProductRelation, RedirectRule, ReviewHelpfulVote, ReviewImage,
    SearchQuery, Wishlist, WishlistItem, CategoryUsageProfile,
    CustomizationGroup, CustomizationOption,
)


class SafeImageField(serializers.ImageField):
    """Do not expose a media URL when its local file no longer exists."""

    def to_representation(self, value):
        if not value:
            return None
        try:
            # Django's default storage is lazy-wrapped, so an isinstance check
            # can miss local files. Resolve the path to suppress stale image
            # names (especially after restore) before they become browser 404s.
            if not Path(value.path).is_file():
                return None
        except (NotImplementedError, AttributeError):
            # Cloud storages intentionally do not expose a local filesystem path.
            pass
        except (OSError, ValueError):
            return None
        return super().to_representation(value)


__all__ = [name for name in globals() if not name.startswith('__')]
