from ._shared import *
from .content import *

class Product(TimeStampedModel):
    name = models.CharField(max_length=220)
    slug = models.SlugField(max_length=250, unique=True, allow_unicode=True)
    sku = models.CharField(max_length=50, unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    brand = models.ForeignKey(Brand, on_delete=models.SET_NULL, null=True, blank=True, related_name="products")
    short_description = models.CharField(max_length=320, blank=True)
    description = models.TextField(blank=True)
    price = models.PositiveBigIntegerField()
    discount_percent = models.PositiveSmallIntegerField(default=0)
    stock = models.PositiveIntegerField(default=0)
    image = models.ImageField(upload_to=product_main_image_upload_to, blank=True)
    specifications = models.JSONField(default=dict, blank=True)
    warranty = models.CharField(max_length=160, blank=True)
    available_colors = models.JSONField(default=list, blank=True)
    shipping_options = models.JSONField(default=list, blank=True)
    rating = models.DecimalField(max_digits=2, decimal_places=1, default=0)
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    is_gaming = models.BooleanField(default=False)
    sold_count = models.PositiveIntegerField(default=0)
    video_url = models.URLField(blank=True)
    seo_title = models.CharField(max_length=180, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    canonical_url = models.URLField(blank=True)
    weight_grams = models.PositiveIntegerField(default=0)
    search_keywords = models.CharField(max_length=500, blank=True)
    gtin = models.CharField(max_length=14, blank=True, db_index=True)
    mpn = models.CharField(max_length=80, blank=True)
    material = models.CharField(max_length=120, blank=True)
    product_group_id = models.CharField(max_length=80, blank=True, db_index=True)
    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["is_active", "category"]),
            models.Index(fields=["price"]),
            models.Index(fields=["is_active", "stock", "-created_at"], name="product_available_idx"),
            models.Index(fields=["is_active", "-sold_count"], name="product_best_sell_idx"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(discount_percent__lte=100),
                name="product_discount_lte_100",
            ),
            models.CheckConstraint(
                condition=models.Q(rating__gte=0) & models.Q(rating__lte=5),
                name="product_rating_0_5",
            ),
        ]
    def save(self, *args, **kwargs):
        if not self.slug:
            base = slugify(self.name, allow_unicode=True) or slugify(self.sku) or "product"
            base = base[:230]
            candidate = base
            suffix = 2
            existing = Product.objects.exclude(pk=self.pk)
            while existing.filter(slug=candidate).exists():
                candidate = f"{base[:230-len(str(suffix))]}-{suffix}"
                suffix += 1
            self.slug = candidate
        super().save(*args, **kwargs)
    @property
    def final_price(self):
        discount = self.discount_percent
        base_final_price = round(self.price * (100 - discount) / 100)
        prefetched_sales = getattr(self, "_active_flash_sales", None)
        sale = prefetched_sales[0] if prefetched_sales else None
        if prefetched_sales is None:
            sale = self.flash_sales.filter(
                is_active=True, starts_at__lte=timezone.now(), ends_at__gte=timezone.now()
            ).filter(
                models.Q(stock_limit=0)
                | models.Q(sold_count__lt=models.F("stock_limit"))
            ).first()
        if sale:
            if sale.special_price:
                return min(base_final_price, sale.special_price)
            discount = max(discount, sale.discount_percent)
        return round(self.price * (100 - discount) / 100)
    def __str__(self):
        return self.name


class CategoryProductRecommendation(TimeStampedModel):
    """An explicit, administrator-curated product recommendation per category."""

    # This lightweight relation uses the database-native sequential key.  It is
    # intentionally explicit because TimeStampedModel otherwise supplies UUID.
    id = models.BigAutoField(primary_key=True)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="product_recommendations",
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="category_recommendations",
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("category_id", "sort_order", "id")
        constraints = [
            models.UniqueConstraint(
                fields=("category", "product"),
                name="unique_category_product_recommendation",
            )
        ]
        indexes = [
            models.Index(
                fields=("category", "is_active", "sort_order"),
                name="category_recommendation_idx",
            )
        ]

    def __str__(self):
        return f"{self.category} - {self.product}"


class CategoryUsageProfile(TimeStampedModel):
    """Administrator-curated shopping intent such as gaming or programming."""

    class Catalog(models.TextChoices):
        NORMAL = "NORMAL", "فروشگاه عادی"
        GAMING = "GAMING", "فروشگاه گیمینگ"

    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="usage_profiles"
    )
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=160, allow_unicode=True)
    description = models.CharField(max_length=260, blank=True)
    icon = models.CharField(max_length=40, blank=True)
    catalog = models.CharField(
        max_length=10, choices=Catalog.choices, default=Catalog.NORMAL
    )
    products = models.ManyToManyField(
        Product, blank=True, related_name="usage_profiles"
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("category_id", "catalog", "sort_order", "name")
        constraints = [
            models.UniqueConstraint(
                fields=("category", "catalog", "slug"),
                name="unique_category_catalog_usage_slug",
            )
        ]

    def __str__(self):
        return f"{self.category} / {self.name}"


class CustomizationGroup(TimeStampedModel):
    """A category-level configurable product attribute (CPU, RAM, storage...)."""

    class Catalog(models.TextChoices):
        BOTH = "BOTH", "هر دو فروشگاه"
        NORMAL = "NORMAL", "فروشگاه عادی"
        GAMING = "GAMING", "فروشگاه گیمینگ"

    category = models.ForeignKey(
        Category, on_delete=models.CASCADE, related_name="customization_groups"
    )
    name = models.CharField(max_length=120)
    code = models.SlugField(max_length=80, allow_unicode=True)
    help_text = models.CharField(max_length=260, blank=True)
    catalog = models.CharField(
        max_length=10, choices=Catalog.choices, default=Catalog.BOTH
    )
    products = models.ManyToManyField(
        Product, blank=True, related_name="customization_groups"
    )
    applies_to_all_products = models.BooleanField(default=True)
    is_required = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("category_id", "sort_order", "name")
        constraints = [
            models.UniqueConstraint(
                fields=("category", "catalog", "code"),
                name="unique_category_catalog_custom_code",
            )
        ]

    def applies_to(self, product):
        if product.category_id != self.category_id:
            return False
        if self.catalog == self.Catalog.NORMAL and product.is_gaming:
            return False
        if self.catalog == self.Catalog.GAMING and not product.is_gaming:
            return False
        if self.applies_to_all_products:
            return True
        prefetched = getattr(self, "_prefetched_objects_cache", {}).get("products")
        if prefetched is not None:
            return any(item.pk == product.pk for item in prefetched)
        return self.products.filter(pk=product.pk).exists()

    def __str__(self):
        return f"{self.category} / {self.name}"


class CustomizationOption(TimeStampedModel):
    group = models.ForeignKey(
        CustomizationGroup, on_delete=models.CASCADE, related_name="options"
    )
    name = models.CharField(max_length=140)
    value = models.CharField(max_length=180, blank=True)
    sku_suffix = models.SlugField(max_length=50, blank=True)
    price_delta = models.BigIntegerField(default=0)
    stock = models.PositiveIntegerField(null=True, blank=True)
    specifications = models.JSONField(default=dict, blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("group_id", "sort_order", "name")
        constraints = [
            models.UniqueConstraint(
                fields=("group", "name"), name="unique_custom_option_name"
            )
        ]

    def __str__(self):
        return f"{self.group.name}: {self.name}"
