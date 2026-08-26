"""Marketing-domain model API preserving existing migration ownership."""

from apps.catalog.models import (  # noqa: F401
    FlashSale,
    HeroSlide,
    HomeSection,
    NewsletterCampaign,
    NewsletterSubscriber,
    PromoBanner,
)

__all__ = [
    "FlashSale", "HeroSlide", "HomeSection", "NewsletterCampaign",
    "NewsletterSubscriber", "PromoBanner",
]
