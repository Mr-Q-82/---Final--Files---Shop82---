from ._shared import *

class CategorySerializer(serializers.ModelSerializer):
    image = SafeImageField(required=False, allow_null=True)
    gaming_image = SafeImageField(required=False, allow_null=True)
    remove_image = serializers.BooleanField(write_only=True, required=False, default=False)
    remove_gaming_image = serializers.BooleanField(write_only=True, required=False, default=False)
    products_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Category
        fields = "__all__"

    def validate_image(self, image):
        if image and image.size > 4 * 1024 * 1024:
            raise serializers.ValidationError(
                "حجم تصویر دسته‌بندی نباید بیشتر از ۴ مگابایت باشد."
            )
        return image

    def validate_gaming_image(self, image):
        if image and image.size > 4 * 1024 * 1024:
            raise serializers.ValidationError(
                "حجم تصویر گیمینگ دسته‌بندی نباید بیشتر از ۴ مگابایت باشد."
            )
        return image

    def create(self, validated_data):
        validated_data.pop("remove_image", None)
        validated_data.pop("remove_gaming_image", None)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        remove_image = validated_data.pop("remove_image", False)
        remove_gaming_image = validated_data.pop("remove_gaming_image", False)
        if remove_image and instance.image:
            instance.image.delete(save=False)
            instance.image = ""
        if remove_gaming_image and instance.gaming_image:
            instance.gaming_image.delete(save=False)
            instance.gaming_image = ""
        return super().update(instance, validated_data)

class BrandSerializer(serializers.ModelSerializer):
    logo = SafeImageField(required=False, allow_null=True)
    products_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Brand
        fields = "__all__"

    def validate_logo(self, logo):
        if logo and logo.size > 3 * 1024 * 1024:
            raise serializers.ValidationError(
                "حجم لوگوی برند نباید بیشتر از ۳ مگابایت باشد."
            )
        return logo

class SiteSettingSerializer(serializers.ModelSerializer):
    logo = SafeImageField(required=False, allow_null=True)
    seo_social_image = SafeImageField(required=False, allow_null=True)
    mega_promo_image = SafeImageField(required=False, allow_null=True)
    hero_laptop_image = SafeImageField(required=False, allow_null=True)
    hero_components_image = SafeImageField(required=False, allow_null=True)
    hero_gaming_image = SafeImageField(required=False, allow_null=True)
    hero_monitor_image = SafeImageField(required=False, allow_null=True)
    hero_audio_image = SafeImageField(required=False, allow_null=True)

    class Meta:
        model = SiteSetting
        fields = "__all__"

    def validate(self, attrs):
        for field in ("home_hero_interval_seconds", "gaming_hero_interval_seconds"):
            value = attrs.get(field)
            if value is not None and not 2 <= value <= 60:
                raise serializers.ValidationError({field: "زمان تعویض باید بین ۲ تا ۶۰ ثانیه باشد."})
        return attrs

class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscriber
        fields = "__all__"
        read_only_fields = ("is_active",)

class ProductImageSerializer(serializers.ModelSerializer):
    image = SafeImageField(read_only=True)

    class Meta:
        model = ProductImage
        fields = ("id", "image", "alt_text", "sort_order")
        read_only_fields = ("id",)


class NewsletterCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterCampaign
        fields = "__all__"
        read_only_fields = ("sent_at", "sent_count")


class HeroSlideSerializer(serializers.ModelSerializer):
    image = SafeImageField(required=False, allow_null=True)
    display_value = serializers.SerializerMethodField()
    product_detail = serializers.SerializerMethodField()
    class Meta:
        model = HeroSlide
        fields = "__all__"

    def get_display_value(self, obj):
        if not hasattr(self, "_metric_values"):
            self._metric_values = {}
        if obj.metric_type == HeroSlide.MetricType.PRODUCTS:
            if "products" not in self._metric_values:
                self._metric_values["products"] = Product.objects.filter(
                    is_active=True, stock__gt=0
                ).count()
            return self._metric_values["products"]
        if obj.metric_type == HeroSlide.MetricType.CUSTOMERS:
            from apps.accounts.models import User
            if "customers" not in self._metric_values:
                self._metric_values["customers"] = User.objects.filter(
                    role=User.Role.CUSTOMER, is_active=True, is_deleted=False
                ).count()
            return self._metric_values["customers"]
        return obj.custom_value

    def get_product_detail(self, obj):
        product = obj.product
        if not product:
            return None
        request = self.context.get("request")
        image = ""
        if product.image:
            image = product.image.url
            if request:
                image = request.build_absolute_uri(image)
        return {
            "id": product.id,
            "slug": product.slug,
            "name": product.name,
            "sku": product.sku,
            "price": product.price,
            "final_price": product.final_price,
            "discount_percent": product.discount_percent,
            "stock": product.stock,
            "image": image,
            "brand": product.brand.name if product.brand else "",
            "category": product.category.name,
        }


class PromoBannerSerializer(serializers.ModelSerializer):
    image = SafeImageField(required=True)

    class Meta:
        model = PromoBanner
        fields = "__all__"

    def validate_image(self, image):
        if image and image.size > 5 * 1024 * 1024:
            raise serializers.ValidationError(
                "حجم تصویر بنر نباید بیشتر از ۵ مگابایت باشد."
            )
        return image

