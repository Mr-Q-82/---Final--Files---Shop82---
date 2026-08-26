import csv
import io
import json
from difflib import get_close_matches
from django.conf import settings
from django.core.mail import EmailMessage
from django.db import IntegrityError, models, transaction
from django.db.models import Count, Prefetch, Q
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.utils import timezone
from django.utils.cache import patch_vary_headers
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.response import Response
from apps.common.permissions import IsAdminRole
from ..models import (
    Brand, Category, CategoryProductRecommendation, ComparisonItem, Favorite, FlashSale, HeroSlide, HomeSection, MenuItem,
    NewsletterCampaign, NewsletterSubscriber, PriceHistory, Product, ProductImage, ProductQuestion,
    PromoBanner,
    ProductReview, ProductVariant, SiteSetting, StockAlert,
    BuyingGuide, ProductRelation, RedirectRule, ReviewHelpfulVote, ReviewImage,
    SearchQuery, Wishlist, WishlistItem, CategoryUsageProfile,
    CustomizationGroup, CustomizationOption,
)
from ..serializers import (
    BrandSerializer, CategorySerializer, CategoryProductRecommendationSerializer, ComparisonItemSerializer, HeroSlideSerializer,
    FavoriteSerializer, HomeSectionSerializer, MenuItemSerializer,
    NewsletterCampaignSerializer, NewsletterSubscriberSerializer,
    ProductImageSerializer, ProductQuestionSerializer, ProductReviewAdminSerializer,
    PromoBannerSerializer,
    ProductListSerializer, ProductReviewSerializer, ProductSerializer, ProductVariantSerializer,
    PriceHistorySerializer, FlashSaleSerializer, SiteSettingSerializer,
    StockAlertSerializer,
    BuyingGuideSerializer, ProductRelationSerializer, RedirectRuleSerializer,
    WishlistItemSerializer, WishlistSerializer, CategoryUsageProfileSerializer,
    CustomizationGroupSerializer, CustomizationOptionSerializer,
)

CSV_TRUE_VALUES = {"1", "true", "yes", "on", "بله", "فعال"}
CSV_FALSE_VALUES = {"0", "false", "no", "off", "خیر", "غیرفعال"}


def _csv_download(filename):
    response = HttpResponse("\ufeff", content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


def _csv_bool(value, default=False):
    normalized = str(value or "").strip().lower()
    if not normalized:
        return default
    if normalized in CSV_TRUE_VALUES:
        return True
    if normalized in CSV_FALSE_VALUES:
        return False
    raise ValueError(f"مقدار بولی «{value}» معتبر نیست؛ true یا false بنویسید.")


def _csv_json(value, default):
    raw = str(value or "").strip()
    if not raw:
        return default
    try:
        result = json.loads(raw)
        if not isinstance(result, type(default)):
            expected = "شیء" if isinstance(default, dict) else "فهرست"
            raise ValueError(f"مقدار JSON باید از نوع {expected} باشد.")
        return result
    except json.JSONDecodeError as exc:
        raise ValueError("مقدار JSON معتبر نیست.") from exc


def _read_csv_upload(request):
    upload = request.FILES.get("file")
    if not upload:
        return None, Response({"detail": "فایل CSV انتخاب نشده است."}, status=400)
    if upload.size > 5 * 1024 * 1024:
        return None, Response({"detail": "حجم فایل CSV نباید بیشتر از ۵ مگابایت باشد."}, status=400)
    try:
        text = upload.read().decode("utf-8-sig")
        rows = csv.DictReader(io.StringIO(text))
    except UnicodeDecodeError:
        return None, Response({"detail": "فایل باید با UTF-8 ذخیره شده باشد."}, status=400)
    if not rows.fieldnames:
        return None, Response({"detail": "فایل CSV خالی است یا سطر عنوان ندارد."}, status=400)
    rows.fieldnames = [str(field).strip() for field in rows.fieldnames]
    return rows, None


def _csv_import_result(created, updated, errors):
    processed = created + updated
    return {
        "message": f"{processed} ردیف با موفقیت پردازش شد.",
        "created": created,
        "updated": updated,
        "failed": len(errors),
        "errors": errors[:100],
    }

class ReadOnlyOrAdmin:
    def get_permissions(self):
        if (
            self.request.method in permissions.SAFE_METHODS
            and getattr(self, "action", None) in {"list", "retrieve"}
        ):
            return [permissions.AllowAny()]
        if self.request.method in permissions.SAFE_METHODS:
            return super().get_permissions()
        return [IsAdminRole()]

    def finalize_response(self, request, response, *args, **kwargs):
        response = super().finalize_response(request, response, *args, **kwargs)
        if (
            request.method == "GET"
            and not request.user.is_authenticated
            and 200 <= response.status_code < 300
        ):
            response["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
            patch_vary_headers(response, ("Authorization", "Origin"))
        return response



__all__ = [name for name in globals() if not name.startswith('__')]
