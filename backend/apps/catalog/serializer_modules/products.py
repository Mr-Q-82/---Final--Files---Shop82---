from ._shared import *
from .catalog import *
from .community import *
from .customization import *

class WishlistItemSerializer(serializers.ModelSerializer):
    product_detail = serializers.SerializerMethodField()
    class Meta:
        model = WishlistItem
        fields = "__all__"
        read_only_fields = ("price_when_added",)
    def get_product_detail(self, obj):
        return ProductSerializer(obj.product, context=self.context).data

class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)
    class Meta:
        model = Wishlist
        fields = "__all__"
        read_only_fields = ("user", "share_token")

class ProductRelationSerializer(serializers.ModelSerializer):
    related_product_detail = serializers.SerializerMethodField()
    class Meta:
        model = ProductRelation
        fields = "__all__"
    def get_related_product_detail(self, obj):
        return ProductSerializer(obj.related_product, context=self.context).data

class BuyingGuideSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    class Meta: model = BuyingGuide; fields = "__all__"
    def validate(self, attrs):
        category = attrs.get("category") or getattr(self.instance, "category", None)
        product = attrs.get("product") or getattr(self.instance, "product", None)
        if product and category and product.category_id != category.id:
            raise serializers.ValidationError({"product": "محصول باید متعلق به دسته‌بندی انتخاب‌شده باشد."})
        if product and not category:
            attrs["category"] = product.category
        return attrs

class RedirectRuleSerializer(serializers.ModelSerializer):
    class Meta: model = RedirectRule; fields = "__all__"

class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    final_price = serializers.ReadOnlyField()
    gallery = ProductImageSerializer(many=True, read_only=True)
    questions = ProductQuestionSerializer(many=True, read_only=True)
    approved_reviews_count = serializers.SerializerMethodField()
    variants = ProductVariantSerializer(many=True, read_only=True)
    price_history = PriceHistorySerializer(many=True, read_only=True)
    active_flash_sale = serializers.SerializerMethodField()
    image = SafeImageField(required=False, allow_null=True)
    usage_profile_ids = serializers.SerializerMethodField()
    customization_groups = serializers.SerializerMethodField()
    class Meta:
        model = Product
        fields = "__all__"
        read_only_fields = ("sold_count", "rating")
        extra_kwargs = {"slug": {"required": False, "allow_blank": True}}

    def get_fields(self):
        fields = super().get_fields()
        view = self.context.get("view")
        request = self.context.get("request")
        is_admin = bool(
            request
            and request.user.is_authenticated
            and getattr(request.user, "role", "") in {"ADMIN", "STAFF"}
        )
        if view is not None and getattr(view, "action", None) == "list":
            # Admin product management needs gallery rows immediately for
            # preview/count/delete. Public lists keep the lighter payload.
            omitted = ("questions", "price_history", "customization_groups")
            if not is_admin:
                omitted = ("gallery", *omitted)
            for field_name in omitted:
                fields.pop(field_name, None)
        return fields

    def get_approved_reviews_count(self, obj):
        annotated = getattr(obj, "approved_reviews_count_value", None)
        if annotated is not None:
            return annotated
        return obj.reviews.filter(status=ProductReview.Status.APPROVED).count()

    def get_active_flash_sale(self, obj):
        from django.utils import timezone
        prefetched_sales = getattr(obj, "_active_flash_sales", None)
        sale = prefetched_sales[0] if prefetched_sales else None
        if prefetched_sales is None:
            sale = obj.flash_sales.filter(
                is_active=True, starts_at__lte=timezone.now(), ends_at__gte=timezone.now()
            ).first()
        return FlashSaleSerializer(sale).data if sale else None

    def get_usage_profile_ids(self, obj):
        return [str(value) for value in obj.usage_profiles.filter(is_active=True).values_list("id", flat=True)]

    def get_customization_groups(self, obj):
        view = self.context.get("view")
        if view is not None and getattr(view, "action", None) != "retrieve":
            return []
        catalog = CustomizationGroup.Catalog.GAMING if obj.is_gaming else CustomizationGroup.Catalog.NORMAL
        from ..default_customization import category_supports_customization

        groups = [
            group for group in obj.category.customization_groups.all()
            if group.is_active and group.catalog in (CustomizationGroup.Catalog.BOTH, catalog)
        ]
        groups = [group for group in groups if group.applies_to(obj)]
        if not category_supports_customization(obj.category):
            # Non-configurable categories may still opt in for one exceptional
            # product through an explicit product-scoped admin group.
            groups = [group for group in groups if not group.applies_to_all_products]
        groups = [
            group for group in groups
            if sum(1 for option in group.options.all() if option.is_active) >= 2
        ]
        return CustomizationGroupSerializer(groups, many=True, context=self.context).data

    def validate_image(self, image):
        if image and image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("حجم تصویر اصلی نباید بیشتر از ۵ مگابایت باشد.")
        return image


class ProductListSerializer(serializers.ModelSerializer):
    """Compact public catalog row; full details stay on the retrieve endpoint."""
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    brand_name = serializers.CharField(source="brand.name", read_only=True)
    final_price = serializers.ReadOnlyField()
    image = SafeImageField(read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    active_flash_sale = serializers.SerializerMethodField()
    usage_profile_ids = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id", "sku", "name", "slug", "category_name", "category_slug",
            "brand_name", "price", "final_price", "discount_percent", "stock",
            "is_active", "is_featured", "is_gaming", "rating", "sold_count",
            "created_at", "image", "warranty", "specifications",
            "available_colors", "shipping_options", "variants",
            "active_flash_sale", "usage_profile_ids",
        )

    def get_active_flash_sale(self, obj):
        sales = getattr(obj, "_active_flash_sales", [])
        return FlashSaleSerializer(sales[0]).data if sales else None

    def get_usage_profile_ids(self, obj):
        return [str(profile.id) for profile in obj.usage_profiles.all() if profile.is_active]


class CategoryProductRecommendationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_slug = serializers.CharField(source="product.slug", read_only=True)
    product_image = SafeImageField(source="product.image", read_only=True)
    product_price = serializers.IntegerField(source="product.final_price", read_only=True)
    product_is_gaming = serializers.BooleanField(source="product.is_gaming", read_only=True)

    class Meta:
        model = CategoryProductRecommendation
        fields = "__all__"

    def validate(self, attrs):
        category = attrs.get("category") or getattr(self.instance, "category", None)
        product = attrs.get("product") or getattr(self.instance, "product", None)
        if category and product and product.category_id != category.id:
            raise serializers.ValidationError(
                {"product": "محصول انتخابی باید متعلق به همین دسته‌بندی باشد."}
            )
        return attrs
