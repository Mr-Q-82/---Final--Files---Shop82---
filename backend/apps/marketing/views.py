"""Marketing API boundary with the original routes retained."""

from apps.catalog.views import (  # noqa: F401
    FlashSaleViewSet,
    HeroSlideViewSet,
    HomeSectionViewSet,
    NewsletterCampaignViewSet,
    NewsletterSubscriberViewSet,
    PromoBannerViewSet,
)

__all__ = [name for name in globals() if name.endswith("ViewSet")]
