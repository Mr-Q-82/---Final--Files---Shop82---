from ._shared import *
from .catalog import *
from .products import *
from .community import *

class HomeSectionViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    serializer_class = HomeSectionSerializer
    lookup_field = "key"
    queryset = HomeSection.objects.all()
    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in {"list", "retrieve"} and not (
            self.request.user.is_authenticated and self.request.user.role in {"ADMIN", "STAFF"}
        ):
            now = timezone.now()
            return qs.filter(is_active=True).filter(
                models.Q(starts_at__isnull=True) | models.Q(starts_at__lte=now),
                models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=now),
            )
        return qs

class ProductVariantViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    queryset = ProductVariant.objects.select_related("product")
    serializer_class = ProductVariantSerializer
    filterset_fields = ("product", "is_active")
    search_fields = ("name", "sku", "product__name")


class CategoryUsageProfileViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    queryset = CategoryUsageProfile.objects.select_related("category").prefetch_related("products")
    serializer_class = CategoryUsageProfileSerializer
    filterset_fields = ("category", "catalog", "is_active")
    search_fields = ("name", "description", "category__name")


class CustomizationGroupViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    queryset = CustomizationGroup.objects.select_related("category").prefetch_related("options", "products")
    serializer_class = CustomizationGroupSerializer
    filterset_fields = ("category", "catalog", "is_active")
    search_fields = ("name", "code", "category__name")


class CustomizationOptionViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    queryset = CustomizationOption.objects.select_related("group", "group__category")
    serializer_class = CustomizationOptionSerializer
    filterset_fields = ("group", "is_active")
    search_fields = ("name", "value", "group__name")

class PriceHistoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = PriceHistory.objects.select_related("product")
    serializer_class = PriceHistorySerializer
    permission_classes = [permissions.AllowAny]
    filterset_fields = ("product",)

class FlashSaleViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    queryset = FlashSale.objects.select_related("product")
    serializer_class = FlashSaleSerializer
    filterset_fields = ("product", "is_active")

    @action(detail=False, methods=["post"], url_path="bulk-create")
    def bulk_create(self, request):
        product_ids = list(dict.fromkeys(request.data.get("product_ids") or []))
        if not product_ids:
            return Response(
                {"product_ids": ["حداقل یک محصول را انتخاب کنید."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        products = {
            str(product.id): product
            for product in Product.objects.filter(id__in=product_ids, is_active=True)
        }
        if len(products) != len(product_ids):
            return Response(
                {"product_ids": ["یک یا چند محصول انتخاب‌شده معتبر نیستند."]},
                status=status.HTTP_400_BAD_REQUEST,
            )
        common_data = request.data.copy()
        common_data.pop("product_ids", None)
        serializers_to_save = []
        for product_id in product_ids:
            serializer = self.get_serializer(
                data={**common_data, "product": product_id}
            )
            serializer.is_valid(raise_exception=True)
            serializers_to_save.append(serializer)
        with transaction.atomic():
            created = [serializer.save() for serializer in serializers_to_save]
        return Response(
            self.get_serializer(created, many=True).data,
            status=status.HTTP_201_CREATED,
        )

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in {"list", "retrieve"} and not (
            self.request.user.is_authenticated and self.request.user.role in {"ADMIN", "STAFF"}
        ):
            now = timezone.now()
            qs = qs.filter(is_active=True, starts_at__lte=now, ends_at__gte=now)
        return qs

class StockAlertViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = StockAlertSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return StockAlert.objects.filter(user=self.request.user).select_related("product")
    def create(self, request, *args, **kwargs):
        product = get_object_or_404(Product, id=request.data.get("product"))
        item, _ = StockAlert.objects.update_or_create(
            user=request.user, product=product,
            defaults={"is_notified": False},
        )
        return Response(
            self.get_serializer(item).data, status=status.HTTP_201_CREATED
        )

class WishlistViewSet(viewsets.ModelViewSet):
    serializer_class = WishlistSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user).prefetch_related("items__product")
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
    @action(detail=True, methods=["post"])
    def add_product(self, request, pk=None):
        wishlist = self.get_object()
        product = get_object_or_404(Product, id=request.data.get("product"), is_active=True)
        item, created = WishlistItem.objects.get_or_create(
            wishlist=wishlist, product=product, defaults={"price_when_added": product.final_price}
        )
        return Response(WishlistItemSerializer(item, context={"request": request}).data,
                        status=201 if created else 200)
    @action(detail=True, methods=["post"], url_path="add-all-to-cart")
    def add_all_to_cart(self, request, pk=None):
        rows = [{"product": i.product_id, "quantity": 1} for i in self.get_object().items.select_related("product")
                if i.product.stock > 0 and i.product.is_active]
        return Response({"items": rows})

class SharedWishlistView(APIView):
    permission_classes = [permissions.AllowAny]
    def get(self, request, token):
        item = get_object_or_404(Wishlist, share_token=token, is_public=True)
        return Response(WishlistSerializer(item, context={"request": request}).data)

class ProductRelationViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    queryset = ProductRelation.objects.select_related("product", "related_product")
    serializer_class = ProductRelationSerializer
    filterset_fields = ("product", "kind")

class BuyingGuideViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    queryset = BuyingGuide.objects.select_related("category", "product")
    serializer_class = BuyingGuideSerializer
    lookup_field = "slug"
    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user.is_authenticated and self.request.user.role in {"ADMIN", "STAFF"}):
            qs = qs.filter(is_published=True)
        category = self.request.query_params.get("category")
        product = self.request.query_params.get("product")
        if category:
            qs = qs.filter(models.Q(category_id=category) | models.Q(category__slug=category))
        if product:
            qs = qs.filter(models.Q(product_id=product) | models.Q(product__slug=product))
        return qs

class RedirectRuleViewSet(viewsets.ModelViewSet):
    queryset = RedirectRule.objects.all()
    serializer_class = RedirectRuleSerializer
    permission_classes = [IsAdminRole]
