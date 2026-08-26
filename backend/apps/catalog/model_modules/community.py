from ._shared import *
from .content import *
from .products import *

class ProductImage(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="gallery")
    image = models.ImageField(upload_to=product_gallery_image_upload_to)
    alt_text = models.CharField(max_length=180, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

class ProductQuestion(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="questions")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        related_name="product_questions",
        null=True,
        blank=True,
    )
    question = models.CharField(max_length=500)
    answer = models.TextField(blank=True)
    replies = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=True)
    class Meta:
        ordering = ("-created_at",)

class MenuItem(TimeStampedModel):
    title = models.CharField(max_length=100)
    target = models.CharField(max_length=250, blank=True, help_text="شناسه دسته، shop یا آدرس کامل")
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    class Meta:
        ordering = ("sort_order", "title")
    def __str__(self):
        return self.title

class Favorite(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorites")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="favorited_by")
    class Meta:
        constraints = [models.UniqueConstraint(fields=("user", "product"), name="unique_user_favorite")]
        ordering = ("-created_at",)

class ComparisonItem(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="comparison_items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="compared_by")
    class Meta:
        constraints = [models.UniqueConstraint(fields=("user", "product"), name="unique_user_comparison")]
        ordering = ("created_at",)

class ProductReview(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "در انتظار تأیید"
        APPROVED = "APPROVED", "تأییدشده"
        REJECTED = "REJECTED", "ردشده"
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reviews")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="product_reviews")
    rating = models.PositiveSmallIntegerField()
    title = models.CharField(max_length=140, blank=True)
    comment = models.TextField()
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.PENDING)
    is_verified_purchase = models.BooleanField(default=False)
    admin_reply = models.TextField(blank=True)
    pros = models.JSONField(default=list, blank=True)
    cons = models.JSONField(default=list, blank=True)
    quality_rating = models.PositiveSmallIntegerField(default=0)
    value_rating = models.PositiveSmallIntegerField(default=0)
    packaging_rating = models.PositiveSmallIntegerField(default=0)
    helpful_count = models.PositiveIntegerField(default=0)
    class Meta:
        constraints = [models.UniqueConstraint(fields=("user", "product"), name="unique_user_product_review")]
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["product", "status", "-created_at"], name="review_product_status_idx")
        ]


class ReviewImage(TimeStampedModel):
    review = models.ForeignKey(ProductReview, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="reviews/%Y/%m/")


class ReviewHelpfulVote(TimeStampedModel):
    review = models.ForeignKey(ProductReview, on_delete=models.CASCADE, related_name="helpful_votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    is_helpful = models.BooleanField(default=True)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("review", "user"), name="unique_review_helpful_vote")
        ]


class Wishlist(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlists")
    title = models.CharField(max_length=100, default="علاقه‌مندی‌ها")
    is_public = models.BooleanField(default=False)
    share_token = models.CharField(max_length=40, unique=True, blank=True)
    def save(self, *args, **kwargs):
        if not self.share_token:
            import secrets
            self.share_token = secrets.token_urlsafe(20)
        super().save(*args, **kwargs)


class WishlistItem(TimeStampedModel):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    price_when_added = models.PositiveBigIntegerField(default=0)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("wishlist", "product"), name="unique_wishlist_product")
        ]


class SearchQuery(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="search_queries",
    )
    query = models.CharField(max_length=180, db_index=True)
    normalized_query = models.CharField(max_length=180, db_index=True)
    results_count = models.PositiveIntegerField(default=0)
    session_key = models.CharField(max_length=80, blank=True)
    class Meta:
        ordering = ("-created_at",)


class ProductRelation(TimeStampedModel):
    class Kind(models.TextChoices):
        SIMILAR = "SIMILAR", "مشابه"
        TOGETHER = "TOGETHER", "خرید هم‌زمان"
        COMPLEMENT = "COMPLEMENT", "مکمل"
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="relations")
    related_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="reverse_relations")
    kind = models.CharField(max_length=16, choices=Kind.choices)
    score = models.PositiveSmallIntegerField(default=50)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("product", "related_product", "kind"), name="unique_product_relation"
            )
        ]


class BuyingGuide(TimeStampedModel):
    title = models.CharField(max_length=180)
    slug = models.SlugField(max_length=200, unique=True, allow_unicode=True)
    summary = models.CharField(max_length=320, blank=True)
    content = models.TextField()
    category = models.ForeignKey(
        Category, on_delete=models.SET_NULL, null=True, blank=True, related_name="buying_guides"
    )
    product = models.ForeignKey(
        Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="buying_guides"
    )
    criteria = models.JSONField(default=list, blank=True)
    common_mistakes = models.JSONField(default=list, blank=True)
    checklist = models.JSONField(default=list, blank=True)
    faq_items = models.JSONField(default=list, blank=True)
    accent_color = models.CharField(max_length=20, default="#6d28d9", blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    show_in_category_accordion = models.BooleanField(default=True)
    is_published = models.BooleanField(default=True)

    class Meta:
        ordering = ("sort_order", "title")


class RedirectRule(TimeStampedModel):
    source_path = models.CharField(max_length=300, unique=True)
    destination_path = models.CharField(max_length=300)
    status_code = models.PositiveSmallIntegerField(default=301)
    hits = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
