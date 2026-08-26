from ._shared import *
from .content import *
from .products import *
from .community import *

class HomeSection(TimeStampedModel):
    class ProductOrdering(models.TextChoices):
        BEST_SELLING = "BEST_SELLING", "پرفروش‌ترین"
        NEWEST = "NEWEST", "جدیدترین"
        DISCOUNT = "DISCOUNT", "بیشترین تخفیف"
        RATING = "RATING", "بالاترین امتیاز"
        PRICE_ASC = "PRICE_ASC", "ارزان‌ترین"
        PRICE_DESC = "PRICE_DESC", "گران‌ترین"
    key = models.SlugField(max_length=80, unique=True)
    title = models.CharField(max_length=180)
    subtitle = models.CharField(max_length=320, blank=True)
    content = models.JSONField(default=dict, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    product_ordering = models.CharField(
        max_length=20, choices=ProductOrdering.choices,
        default=ProductOrdering.NEWEST,
    )
    product_limit = models.PositiveSmallIntegerField(default=4)
    slider_interval_seconds = models.PositiveSmallIntegerField(default=5)
    class Meta:
        ordering = ("sort_order", "title")
    def __str__(self):
        return self.title

class ProductVariant(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    name = models.CharField(max_length=140)
    sku = models.CharField(max_length=70, unique=True)
    attributes = models.JSONField(default=dict)
    price = models.PositiveBigIntegerField()
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    class Meta:
        ordering = ("name",)

class PriceHistory(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="price_history")
    price = models.PositiveBigIntegerField()
    discount_percent = models.PositiveSmallIntegerField(default=0)
    class Meta:
        ordering = ("-created_at",)
        constraints = [models.CheckConstraint(condition=models.Q(discount_percent__lte=100), name="price_history_discount_lte_100")]

class FlashSale(TimeStampedModel):
    title = models.CharField(max_length=160)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="flash_sales")
    discount_percent = models.PositiveSmallIntegerField(default=0)
    special_price = models.PositiveBigIntegerField(null=True, blank=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    stock_limit = models.PositiveIntegerField(default=0)
    sold_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    class Meta:
        ordering = ("-starts_at",)
        constraints = [
            models.CheckConstraint(condition=models.Q(discount_percent__lte=100), name="flash_discount_lte_100"),
            models.CheckConstraint(condition=models.Q(ends_at__gt=models.F("starts_at")), name="flash_valid_date_range"),
            models.CheckConstraint(condition=models.Q(sold_count__lte=models.F("stock_limit")) | models.Q(stock_limit=0), name="flash_sold_within_limit"),
        ]
        indexes = [
            models.Index(fields=["product", "is_active", "starts_at", "ends_at"], name="flash_product_active_idx")
        ]

class StockAlert(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="stock_alerts")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="stock_alerts")
    is_notified = models.BooleanField(default=False)
    class Meta:
        constraints = [models.UniqueConstraint(fields=("user", "product"), name="unique_stock_alert")]
        indexes = [
            models.Index(fields=["product", "is_notified"], name="stock_alert_notify_idx")
        ]
