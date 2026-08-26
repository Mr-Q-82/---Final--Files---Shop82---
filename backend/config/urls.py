from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.schemas import get_schema_view
from apps.common.public_views import collect_web_vital, merchant_feed, public_health, robots, sitemap, sitemap_categories, sitemap_guides, sitemap_index, sitemap_pages, sitemap_products

urlpatterns = [
    path("api/schema/", get_schema_view(title="Shop82 API", version="1.0.0", public=False), name="api-schema"),
    path("robots.txt", robots),
    path("sitemap.xml", sitemap),
    path("sitemap-index.xml", sitemap_index),
    path("sitemap-pages.xml", sitemap_pages),
    path("sitemap-categories.xml", sitemap_categories),
    path("sitemap-products.xml", sitemap_products),
    path("sitemap-guides.xml", sitemap_guides),
    path("merchant-feed.xml", merchant_feed),
    path("api/v1/metrics/web-vitals/", collect_web_vital),
    path("health/", public_health),
    path("django-admin/", admin.site.urls),
    path("api/v1/auth/", include("apps.accounts.urls")),
    path("api/v1/catalog/", include("apps.catalog.urls")),
    path("api/v1/orders/", include("apps.orders.urls")),
    path("api/v1/dashboard/", include("apps.dashboard.urls")),
    path("api/v1/operations/", include("apps.operations.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
