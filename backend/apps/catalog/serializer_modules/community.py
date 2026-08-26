from ._shared import *
from .catalog import *

class ProductQuestionSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    user_name = serializers.SerializerMethodField()
    class Meta:
        model = ProductQuestion
        fields = "__all__"
        read_only_fields = ("user", "replies")

    def get_user_name(self, obj):
        if not obj.user:
            return "کاربر فروشگاه 82"
        return obj.user.full_name or obj.user.first_name or "کاربر فروشگاه 82"

    def validate_question(self, value):
        return validate_safe_text(value, field_label="متن پرسش", minimum=5, maximum=500)

class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = "__all__"

class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()
    user_phone = serializers.CharField(source="user.phone", read_only=True)
    product_name = serializers.CharField(source="product.name", read_only=True)
    images = serializers.SerializerMethodField()
    class Meta:
        model = ProductReview
        fields = "__all__"
        read_only_fields = ("user", "status", "is_verified_purchase", "admin_reply")

    def get_user_name(self, obj):
        return obj.user.full_name or obj.user.first_name or "کاربر فروشگاه 82"
    def get_images(self, obj):
        request = self.context.get("request")
        return [
            request.build_absolute_uri(item.image.url) if request else item.image.url
            for item in obj.images.all()
        ]
    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("امتیاز باید بین ۱ تا ۵ باشد.")
        return value

    def validate_title(self, value):
        if not value:
            return value
        return validate_safe_text(value, field_label="عنوان نظر", minimum=2, maximum=140)

    def validate_comment(self, value):
        return validate_safe_text(value, field_label="متن نظر", minimum=5, maximum=2000)
    def validate(self, attrs):
        for field in ("quality_rating", "value_rating", "packaging_rating"):
            value = attrs.get(field, getattr(self.instance, field, 0))
            if value and not 1 <= value <= 5:
                raise serializers.ValidationError({field: "امتیاز باید بین ۱ تا ۵ باشد."})
        return attrs
    def create(self, validated_data):
        from apps.orders.models import Order
        user = self.context["request"].user
        product = validated_data["product"]
        verified = Order.objects.filter(
            user=user,
            status=Order.Status.DELIVERED,
            items__product=product,
        ).exists()
        review = ProductReview.objects.create(
            user=user, is_verified_purchase=verified, **validated_data
        )
        return review
    def update(self, instance, validated_data):
        review = super().update(instance, validated_data)
        average = ProductReview.objects.filter(
            product=review.product, status=ProductReview.Status.APPROVED
        ).aggregate(value=Avg("rating"))["value"] or 0
        review.product.rating = round(average, 1)
        review.product.save(update_fields=("rating", "updated_at"))
        return review

class ProductReviewAdminSerializer(ProductReviewSerializer):
    class Meta(ProductReviewSerializer.Meta):
        read_only_fields = ("user", "is_verified_purchase")

class FavoriteSerializer(serializers.ModelSerializer):
    product_detail = serializers.SerializerMethodField()
    class Meta:
        model = Favorite
        fields = ("id", "product", "product_detail", "created_at")
        read_only_fields = ("id", "created_at")
    def get_product_detail(self, obj):
        return ProductSerializer(obj.product, context=self.context).data

class ComparisonItemSerializer(serializers.ModelSerializer):
    product_detail = serializers.SerializerMethodField()
    class Meta:
        model = ComparisonItem
        fields = ("id", "product", "product_detail", "created_at")
        read_only_fields = ("id", "created_at")
    def get_product_detail(self, obj):
        return ProductSerializer(obj.product, context=self.context).data

