from django.urls import include, path
from rest_framework.routers import DefaultRouter
from apps.marketing.views import (
    FlashSaleViewSet, HeroSlideViewSet, HomeSectionViewSet,
    NewsletterCampaignViewSet, NewsletterSubscriberViewSet, PromoBannerViewSet,
)
from apps.products.views import (
    ComparisonViewSet, FavoriteViewSet, PriceHistoryViewSet, ProductRelationViewSet,
    ProductVariantViewSet, ProductViewSet, SharedWishlistView, StockAlertViewSet,
    WishlistViewSet,
)
from apps.reviews.views import (
    AdminProductReviewViewSet, ProductQuestionViewSet, ProductReviewViewSet,
)
from .views import (
    BrandViewSet, BuyingGuideViewSet, CategoryProductRecommendationViewSet, CategoryViewSet, MenuItemViewSet,
    PublicStoreStatsView, RedirectRuleViewSet, SiteSettingViewSet,
    CategoryUsageProfileViewSet, CustomizationGroupViewSet, CustomizationOptionViewSet,
)

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="categories")
router.register("brands", BrandViewSet, basename="brands")
router.register("site-settings", SiteSettingViewSet, basename="site-settings")
router.register("newsletter", NewsletterSubscriberViewSet, basename="newsletter")
router.register("newsletter-campaigns", NewsletterCampaignViewSet, basename="newsletter-campaigns")
router.register("hero-slides", HeroSlideViewSet, basename="hero-slides")
router.register("promo-banners", PromoBannerViewSet, basename="promo-banners")
router.register("products", ProductViewSet, basename="products")
router.register("category-recommendations", CategoryProductRecommendationViewSet, basename="category-recommendations")
router.register("questions", ProductQuestionViewSet, basename="questions")
router.register("menu-items", MenuItemViewSet, basename="menu-items")
router.register("favorites", FavoriteViewSet, basename="favorites")
router.register("comparison", ComparisonViewSet, basename="comparison")
router.register("reviews", ProductReviewViewSet, basename="reviews")
router.register("admin/reviews", AdminProductReviewViewSet, basename="admin-reviews")
router.register("home-sections", HomeSectionViewSet, basename="home-sections")
router.register("variants", ProductVariantViewSet, basename="variants")
router.register("usage-profiles", CategoryUsageProfileViewSet, basename="usage-profiles")
router.register("customization-groups", CustomizationGroupViewSet, basename="customization-groups")
router.register("customization-options", CustomizationOptionViewSet, basename="customization-options")
router.register("price-history", PriceHistoryViewSet, basename="price-history")
router.register("flash-sales", FlashSaleViewSet, basename="flash-sales")
router.register("stock-alerts", StockAlertViewSet, basename="stock-alerts")
router.register("wishlists", WishlistViewSet, basename="wishlists")
router.register("product-relations", ProductRelationViewSet, basename="product-relations")
router.register("buying-guides", BuyingGuideViewSet, basename="buying-guides")
router.register("redirects", RedirectRuleViewSet, basename="redirects")
urlpatterns = [
    path("store-stats/", PublicStoreStatsView.as_view(), name="store-stats"),
    path("shared-wishlist/<str:token>/", SharedWishlistView.as_view(), name="shared-wishlist"),
    path("", include(router.urls)),
]
