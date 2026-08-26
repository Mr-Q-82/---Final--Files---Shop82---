from ._shared import *
from .catalog import *
from .community import *

class HomeSectionSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomeSection
        fields = "__all__"

    def validate_slider_interval_seconds(self, value):
        if not 2 <= value <= 60:
            raise serializers.ValidationError(
                "زمان تعویض اسلایدر باید بین ۲ تا ۶۰ ثانیه باشد."
            )
        return value

class ProductVariantSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    class Meta:
        model = ProductVariant
        fields = "__all__"


class CategoryUsageProfileSerializer(serializers.ModelSerializer):
    product_ids = serializers.PrimaryKeyRelatedField(
        source="products", many=True, queryset=Product.objects.all(), required=False
    )
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = CategoryUsageProfile
        fields = "__all__"

    def validate(self, attrs):
        category = attrs.get("category", getattr(self.instance, "category", None))
        products = attrs.get("products", [])
        if category and any(product.category_id != category.id for product in products):
            raise serializers.ValidationError(
                {"product_ids": "همه محصولات باید متعلق به دسته‌بندی انتخابی باشند."}
            )
        return attrs


class CustomizationOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomizationOption
        fields = "__all__"

    def validate_price_delta(self, value):
        if abs(value) > 10_000_000_000:
            raise serializers.ValidationError("اختلاف قیمت واردشده معتبر نیست.")
        return value


class CustomizationGroupSerializer(serializers.ModelSerializer):
    options = CustomizationOptionSerializer(many=True, read_only=True)
    product_ids = serializers.PrimaryKeyRelatedField(
        source="products", many=True, queryset=Product.objects.all(), required=False
    )
    category_name = serializers.CharField(source="category.name", read_only=True)

    class Meta:
        model = CustomizationGroup
        fields = "__all__"

    def validate(self, attrs):
        category = attrs.get("category", getattr(self.instance, "category", None))
        products = attrs.get("products", [])
        if category and any(product.category_id != category.id for product in products):
            raise serializers.ValidationError(
                {"product_ids": "محصول محدودشده باید متعلق به همین دسته‌بندی باشد."}
            )
        return attrs

class PriceHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceHistory
        fields = "__all__"

class FlashSaleSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_price = serializers.IntegerField(source="product.price", read_only=True)
    class Meta:
        model = FlashSale
        fields = "__all__"
        read_only_fields = ("sold_count",)
    def validate(self, attrs):
        starts = attrs.get("starts_at", getattr(self.instance, "starts_at", None))
        ends = attrs.get("ends_at", getattr(self.instance, "ends_at", None))
        if starts and ends and ends <= starts:
            raise serializers.ValidationError("زمان پایان باید بعد از زمان شروع باشد.")
        discount = attrs.get(
            "discount_percent", getattr(self.instance, "discount_percent", 0)
        )
        special_price = attrs.get(
            "special_price", getattr(self.instance, "special_price", None)
        )
        product = attrs.get("product", getattr(self.instance, "product", None))
        stock_limit = attrs.get(
            "stock_limit", getattr(self.instance, "stock_limit", 0)
        )
        if discount > 100:
            raise serializers.ValidationError("درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.")
        if not discount and not special_price:
            raise serializers.ValidationError(
                "حداقل درصد تخفیف یا قیمت ویژه را وارد کنید."
            )
        if special_price is not None and special_price <= 0:
            raise serializers.ValidationError("قیمت ویژه باید بیشتر از صفر باشد.")
        if product and special_price and special_price >= product.price:
            raise serializers.ValidationError(
                "قیمت ویژه باید کمتر از قیمت اصلی محصول باشد."
            )
        if product and stock_limit:
            already_sold = (
                self.instance.sold_count
                if self.instance and self.instance.product_id == product.id
                else 0
            )
            maximum = product.stock + already_sold
            if stock_limit > maximum:
                raise serializers.ValidationError(
                    {
                        "stock_limit": (
                            f"سقف فروش این محصول نمی‌تواند بیشتر از موجودی آن "
                            f"({maximum}) باشد."
                        )
                    }
                )
        return attrs

class StockAlertSerializer(serializers.ModelSerializer):
    product_detail = serializers.SerializerMethodField()
    class Meta:
        model = StockAlert
        fields = ("id", "product", "product_detail", "is_notified", "created_at")
        read_only_fields = ("id", "is_notified", "created_at")
    def get_product_detail(self, obj):
        return ProductSerializer(obj.product, context=self.context).data

