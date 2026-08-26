import re
import unicodedata

from ._shared import *
from .catalog import *

class ProductViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    CSV_FIELDS = (
        "sku", "name", "slug", "category", "brand", "price",
        "discount_percent", "stock", "is_active", "is_featured", "is_gaming",
        "short_description", "description", "warranty", "weight_grams",
        "search_keywords", "seo_title", "seo_description", "canonical_url",
        "specifications_json", "available_colors_json", "shipping_options_json",
    )
    serializer_class = ProductSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    lookup_field = "slug"
    filterset_fields = [
        "category__slug", "brand__slug", "is_featured", "is_gaming", "is_active"
    ]
    search_fields = [
        "name", "sku", "short_description", "brand__name", "category__name",
        "search_keywords", "specifications",
    ]
    ordering_fields = ["price", "rating", "sold_count", "created_at"]

    def get_serializer_class(self):
        is_admin = (
            self.request.user.is_authenticated
            and getattr(self.request.user, "role", "") in {"ADMIN", "STAFF"}
        )
        if self.action == "list" and not is_admin:
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        now = timezone.now()
        active_sales = FlashSale.objects.filter(
            is_active=True, starts_at__lte=now, ends_at__gte=now
        ).filter(Q(stock_limit=0) | Q(sold_count__lt=models.F("stock_limit")))
        is_public_list = self.action == "list" and not (
            self.request.user.is_authenticated
            and getattr(self.request.user, "role", "") in {"ADMIN", "STAFF"}
        )
        qs = Product.objects.select_related("category", "brand").prefetch_related("usage_profiles")
        if is_public_list:
            qs = qs.prefetch_related(
                "variants", "usage_profiles",
                Prefetch("flash_sales", queryset=active_sales, to_attr="_active_flash_sales"),
            )
        else:
            qs = qs.annotate(
                approved_reviews_count_value=Count(
                    "reviews",
                    filter=Q(reviews__status=ProductReview.Status.APPROVED),
                    distinct=True,
                )
            ).prefetch_related(
                "gallery", "questions", "variants", "price_history",
                "usage_profiles", "category__customization_groups__options",
                "category__customization_groups__products",
                Prefetch("flash_sales", queryset=active_sales, to_attr="_active_flash_sales"),
            )
        qs = qs.order_by("-created_at")
        if self.action in {"list", "retrieve"} and not (
            self.request.user.is_authenticated and self.request.user.role in {"ADMIN", "STAFF"}
        ):
            qs = qs.filter(is_active=True)
        min_price = self.request.query_params.get("min_price")
        max_price = self.request.query_params.get("max_price")
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs

    def perform_create(self, serializer):
        product = serializer.save()
        PriceHistory.objects.create(
            product=product, price=product.price,
            discount_percent=product.discount_percent,
        )

    def perform_update(self, serializer):
        old = serializer.instance
        old_price, old_discount, old_stock = old.price, old.discount_percent, old.stock
        product = serializer.save()
        if old_price != product.price or old_discount != product.discount_percent:
            PriceHistory.objects.create(
                product=product, price=product.price,
                discount_percent=product.discount_percent,
            )
        if old_stock <= 0 < product.stock:
            from ..services import notify_stock_available
            notify_stock_available(product)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        if product.orderitem_set.exists():
            return Response(
                {"detail": "این کالا در سفارش‌ها استفاده شده و قابل حذف کامل نیست؛ آن را غیرفعال کنید."},
                status=status.HTTP_409_CONFLICT,
            )
        try:
            if product.image:
                product.image.delete(save=False)
            for gallery_image in product.gallery.all():
                gallery_image.image.delete(save=False)
            product.delete()
        except ProtectedError:
            return Response(
                {"detail": "این کالا در سفارش‌ها استفاده شده و قابل حذف کامل نیست؛ آن را غیرفعال کنید."},
                status=status.HTTP_409_CONFLICT,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"], permission_classes=[IsAdminRole], url_path="images")
    def upload_images(self, request, slug=None):
        product = self.get_object()
        images = request.FILES.getlist("images")
        if not images:
            return Response({"detail": "حداقل یک تصویر انتخاب کنید."}, status=400)
        if len(images) > 10:
            return Response({"detail": "در هر بار حداکثر ۱۰ تصویر قابل آپلود است."}, status=400)
        for image in images:
            if image.size > 5 * 1024 * 1024 or not (image.content_type or "").startswith("image/"):
                return Response({"detail": f"فایل «{image.name}» تصویر معتبر با حداکثر حجم ۵ مگابایت نیست."}, status=400)
        start_order = product.gallery.count()
        created = [
            ProductImage.objects.create(
                product=product, image=image,
                alt_text=request.data.get("alt_text", product.name),
                sort_order=start_order + index,
            )
            for index, image in enumerate(images)
        ]
        return Response(
            ProductImageSerializer(created, many=True, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["delete"], permission_classes=[IsAdminRole], url_path=r"images/(?P<image_id>[^/.]+)")
    def delete_image(self, request, slug=None, image_id=None):
        product = self.get_object()
        image = get_object_or_404(ProductImage, id=image_id, product=product)
        image.image.delete(save=False)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["delete"], permission_classes=[IsAdminRole], url_path="main-image")
    def delete_main_image(self, request, slug=None):
        product = self.get_object()
        if product.image:
            product.image.delete(save=False)
            product.image = ""
            product.save(update_fields=["image", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny])
    def suggest(self, request):
        query = str(request.query_params.get("q", "")).strip()
        if not query:
            return Response({"results": [], "corrected_query": "", "popular": []})
        normalized = unicodedata.normalize("NFKC", query)
        normalized = re.sub(r"[\u064B-\u065F\u0670\u06D6-\u06ED]", "", normalized)
        normalized = normalized.translate(str.maketrans({
            "ي": "ی", "ى": "ی", "ك": "ک", "ۀ": "ه", "ة": "ه",
            "ؤ": "و", "إ": "ا", "أ": "ا", "‌": " ",
            **{digit: str(index) for index, digit in enumerate("۰۱۲۳۴۵۶۷۸۹")},
            **{digit: str(index) for index, digit in enumerate("٠١٢٣٤٥٦٧٨٩")},
        }))
        normalized = re.sub(r"[^\w]+", " ", normalized, flags=re.UNICODE).strip().lower()
        if not normalized:
            return Response({"results": [], "corrected_query": "", "popular": []})
        tokens = [token for token in normalized.split() if token]
        latin_digits = "0123456789"
        persian_digits = "۰۱۲۳۴۵۶۷۸۹"
        arabic_digits = "٠١٢٣٤٥٦٧٨٩"

        def token_variants(token):
            variants = {token}
            variants.add(token.translate(str.maketrans(latin_digits, persian_digits)))
            variants.add(token.translate(str.maketrans(latin_digits, arabic_digits)))
            return {value for value in variants if value}
        gaming_words = {"گیمینگ", "gaming", "game"}
        category_aliases = {
            "monitor": {"مانیتور", "نمایشگر", "monitor", "display"},
            "mouse": {"ماوس", "موس", "mouse"},
            "mouse-pad": {"موس پد", "ماوس پد", "mousepad", "mouse pad"},
            "laptop": {"لپ تاپ", "لپتاپ", "لب تاب", "لبتاب", "laptop", "notebook"},
            "gpu": {"کارت گرافیک", "گرافیک", "gpu", "vga"},
            "cpu": {"پردازنده", "سی پی یو", "cpu", "processor"},
            "ram": {"رم", "حافظه رم", "ram"},
            "ssd": {"اس اس دی", "ssd", "nvme"},
            "keyboard": {"کیبورد", "صفحه کلید", "keyboard"},
            "headphone": {"هدفون", "هدست", "headphone", "headset"},
        }
        is_admin = bool(
            request.user.is_authenticated
            and getattr(request.user, "role", "") in {"ADMIN", "STAFF"}
        )
        qs = Product.objects.select_related("category", "brand").prefetch_related("usage_profiles")
        if not is_admin:
            qs = qs.filter(is_active=True)
        selected_category = str(request.query_params.get("category", "")).strip()
        selected_category_id = str(request.query_params.get("category_id", "")).strip()
        if selected_category_id.isdigit():
            qs = qs.filter(category_id=int(selected_category_id))
        if selected_category:
            category_filter = Q(category__slug=selected_category)
            if selected_category.isdigit():
                category_filter |= Q(category_id=int(selected_category))
            qs = qs.filter(category_filter)
        for category in Category.objects.filter(is_active=True).values("slug", "name"):
            category_aliases.setdefault(category["slug"], set()).update({
                str(category["slug"]).strip().lower(),
                str(category["name"]).replace("‌", " ").strip().lower(),
            })
        requested_gaming = str(request.query_params.get("is_gaming", "")).lower()
        if requested_gaming in {"true", "false"}:
            qs = qs.filter(is_gaming=requested_gaming == "true")
        if any(token in gaming_words for token in tokens):
            qs = qs.filter(is_gaming=True)
            tokens = [token for token in tokens if token not in gaming_words]
        intent_text = " ".join(
            token for token in tokens if token not in gaming_words
        ).strip()
        exact_intents = {
            slug for slug, aliases in category_aliases.items()
            if intent_text in aliases
        }
        prefix_intents = {
            slug for slug, aliases in category_aliases.items()
            if len(intent_text) >= 2
            and " " not in intent_text
            and any(alias.startswith(intent_text) for alias in aliases)
        }
        intent_candidates = exact_intents or prefix_intents
        # Apply automatic category filtering only when the intent is unambiguous.
        # For example «لپ» uniquely means laptop, while «مو» could mean mouse
        # or mouse-pad and must remain a normal text search.
        matched_category = (
            next(iter(intent_candidates)) if len(intent_candidates) == 1 else None
        )
        if selected_category or selected_category_id:
            matched_category = None
        if matched_category:
            qs = qs.filter(category__slug=matched_category)
            matched_words = category_aliases[matched_category]
            tokens = [
                token for token in tokens
                if not any(token in alias.split() for alias in matched_words)
            ]
        for token in tokens:
            token_query = Q()
            for variant in token_variants(token):
                token_query |= (
                    Q(name__icontains=variant) | Q(sku__icontains=variant)
                    | Q(brand__name__icontains=variant)
                    | Q(category__name__icontains=variant)
                    | Q(search_keywords__icontains=variant)
                )
            qs = qs.filter(token_query)
        qs = qs.annotate(
            search_relevance=models.Case(
                models.When(sku__iexact=query, then=models.Value(1000)),
                models.When(name__iexact=query, then=models.Value(900)),
                models.When(name__istartswith=query, then=models.Value(600)),
                models.When(name__icontains=query, then=models.Value(300)),
                models.When(sku__istartswith=query, then=models.Value(250)),
                default=models.Value(1),
                output_field=models.IntegerField(),
            )
        ).distinct().order_by("-search_relevance", "-sold_count", "-rating", "-created_at")
        try:
            result_limit = min(max(int(request.query_params.get("limit", 30)), 1), 100)
        except (TypeError, ValueError):
            result_limit = 30
        products = ProductListSerializer(
            qs[:result_limit], many=True, context={"request": request}
        ).data
        if not products:
            fallback_source = Product.objects.all() if is_admin else Product.objects.filter(is_active=True)
            names = list(fallback_source.values_list("name", flat=True)[:500])
            matches = get_close_matches(normalized, names, n=5, cutoff=.35)
            fallback = Product.objects.filter(name__in=matches)
            if not is_admin:
                fallback = fallback.filter(is_active=True)
            if requested_gaming in {"true", "false"}:
                fallback = fallback.filter(is_gaming=requested_gaming == "true")
            products = ProductListSerializer(
                fallback[:result_limit], many=True, context={"request": request}
            ).data
        if not is_admin:
            SearchQuery.objects.create(
                user=request.user if request.user.is_authenticated else None,
                query=query, normalized_query=normalized, results_count=qs.count(),
                session_key=request.session.session_key or "",
            )
        popular = list(SearchQuery.objects.values("normalized_query").annotate(
            count=Count("id")
        ).order_by("-count").values_list("normalized_query", flat=True)[:6])
        return Response({"results": products, "corrected_query": normalized, "popular": popular})

    @action(detail=True, methods=["get"], permission_classes=[permissions.AllowAny])
    def recommendations(self, request, slug=None):
        product = self.get_object()
        manual_ids = list(product.relations.order_by("-score").values_list("related_product_id", flat=True)[:8])
        if manual_ids:
            ordered = Product.objects.filter(id__in=manual_ids, is_active=True)
            return Response(ProductSerializer(ordered, many=True, context={"request": request}).data)
        qs = Product.objects.filter(is_active=True).exclude(id=product.id).filter(
            models.Q(category=product.category) | models.Q(brand=product.brand)
        ).order_by("-rating", "-sold_count")[:8]
        return Response(ProductSerializer(qs, many=True, context={"request": request}).data)

    @action(detail=False, methods=["get"], permission_classes=[permissions.AllowAny], url_path="popular-searches")
    def popular_searches(self, request):
        rows = SearchQuery.objects.values("normalized_query").annotate(
            count=Count("id")
        ).order_by("-count")[:10]
        return Response(list(rows))

    @action(detail=False, methods=["get"], permission_classes=[IsAdminRole], url_path="export-csv")
    def export_csv(self, request):
        response = _csv_download("products.csv")
        writer = csv.DictWriter(response, fieldnames=self.CSV_FIELDS)
        writer.writeheader()
        for product in self.filter_queryset(self.get_queryset()):
            writer.writerow({
                "sku": product.sku, "name": product.name, "slug": product.slug,
                "category": product.category.slug,
                "brand": product.brand.slug if product.brand else "",
                "price": product.price, "discount_percent": product.discount_percent,
                "stock": product.stock, "is_active": product.is_active,
                "is_featured": product.is_featured,
                "is_gaming": product.is_gaming,
                "short_description": product.short_description,
                "description": product.description, "warranty": product.warranty,
                "weight_grams": product.weight_grams,
                "search_keywords": product.search_keywords,
                "seo_title": product.seo_title,
                "seo_description": product.seo_description,
                "canonical_url": product.canonical_url,
                "specifications_json": json.dumps(product.specifications, ensure_ascii=False),
                "available_colors_json": json.dumps(product.available_colors, ensure_ascii=False),
                "shipping_options_json": json.dumps(product.shipping_options, ensure_ascii=False),
            })
        return response

    @action(detail=False, methods=["get"], permission_classes=[IsAdminRole], url_path="template-csv")
    def template_csv(self, request):
        response = _csv_download("products-template.csv")
        writer = csv.DictWriter(response, fieldnames=self.CSV_FIELDS)
        writer.writeheader()
        writer.writerow({
            "sku": "LAPTOP-001", "name": "لپ‌تاپ نمونه", "slug": "",
            "category": "laptop", "brand": "asus", "price": "45000000",
            "discount_percent": "5", "stock": "10", "is_active": "true",
            "is_featured": "false", "is_gaming": "true",
            "short_description": "توضیح کوتاه محصول",
            "description": "توضیحات کامل محصول", "warranty": "18 ماهه",
            "weight_grams": "1800", "search_keywords": "لپ تاپ, ایسوس",
            "seo_title": "خرید لپ‌تاپ نمونه", "seo_description": "توضیح سئوی محصول",
            "canonical_url": "",
            "specifications_json": '{"نوع حافظه":"DDR4"}',
            "available_colors_json": '[["مشکی","#111827"]]',
            "shipping_options_json": '[{"name":"عادی","cost":0}]',
        })
        return response

    @action(detail=False, methods=["post"], permission_classes=[IsAdminRole], url_path="import-csv")
    def import_csv(self, request):
        rows, error = _read_csv_upload(request)
        if error:
            return error
        required = {"sku", "name", "category", "price"}
        if not required.issubset(rows.fieldnames or []):
            return Response({
                "detail": "ستون‌های اجباری محصول: sku، name، category و price"
            }, status=400)
        created = updated = 0
        errors = []
        for row_number, row in enumerate(rows, start=2):
            try:
                sku = row["sku"].strip()
                name = row["name"].strip()
                slug = row.get("slug", "").strip()
                if not sku or not name:
                    raise ValueError("کد کالا و نام محصول اجباری است.")
                category_slug = row["category"].strip()
                category = Category.objects.filter(slug=category_slug).first()
                if not category:
                    raise ValueError(f"دسته‌بندی با اسلاگ «{category_slug}» پیدا نشد.")
                brand_slug = row.get("brand", "").strip()
                brand = Brand.objects.filter(slug=brand_slug).first() if brand_slug else None
                if brand_slug and not brand:
                    raise ValueError(f"برند با اسلاگ «{brand_slug}» پیدا نشد.")
                price = int(row["price"])
                discount = int(row.get("discount_percent") or 0)
                stock = int(row.get("stock") or 0)
                weight = int(row.get("weight_grams") or 0)
                if price < 0 or stock < 0 or weight < 0 or not 0 <= discount <= 100:
                    raise ValueError("قیمت، موجودی، وزن یا درصد تخفیف خارج از محدوده مجاز است.")
                defaults = {
                    "name": name, "category": category, "brand": brand,
                    "price": price, "discount_percent": discount, "stock": stock,
                    "is_active": _csv_bool(row.get("is_active"), True),
                    "is_featured": _csv_bool(row.get("is_featured"), False),
                    "is_gaming": _csv_bool(row.get("is_gaming"), False),
                    "short_description": row.get("short_description", "").strip(),
                    "description": row.get("description", "").strip(),
                    "warranty": row.get("warranty", "").strip(),
                    "weight_grams": weight,
                    "search_keywords": row.get("search_keywords", "").strip(),
                    "seo_title": row.get("seo_title", "").strip(),
                    "seo_description": row.get("seo_description", "").strip(),
                    "canonical_url": row.get("canonical_url", "").strip(),
                    "specifications": _csv_json(row.get("specifications_json"), {}),
                    "available_colors": _csv_json(row.get("available_colors_json"), []),
                    "shipping_options": _csv_json(row.get("shipping_options_json"), []),
                }
                if slug:
                    defaults["slug"] = slug
                with transaction.atomic():
                    previous = Product.objects.filter(sku=sku).first()
                    previous_price = previous.price if previous else None
                    previous_discount = previous.discount_percent if previous else None
                    product, was_created = Product.objects.update_or_create(
                        sku=sku, defaults=defaults,
                    )
                    if was_created or previous_price != price or previous_discount != discount:
                        PriceHistory.objects.create(
                            product=product, price=product.price,
                            discount_percent=product.discount_percent,
                        )
                created += int(was_created)
                updated += int(not was_created)
            except (IntegrityError, TypeError, ValueError) as exc:
                errors.append({"row": row_number, "sku": row.get("sku", ""), "message": str(exc)})
        return Response(_csv_import_result(created, updated, errors))

    @action(detail=False, methods=["post"], permission_classes=[IsAdminRole], url_path="bulk-update")
    def bulk_update(self, request):
        rows = request.data if isinstance(request.data, list) else request.data.get("items", [])
        updated = 0
        for row in rows:
            product = Product.objects.filter(id=row.get("id")).first()
            if not product:
                continue
            old_stock = product.stock
            fields = []
            for field in ("price", "discount_percent", "stock", "is_active"):
                if field in row:
                    setattr(product, field, row[field])
                    fields.append(field)
            if fields:
                product.save(update_fields=fields + ["updated_at"])
                if "price" in fields or "discount_percent" in fields:
                    PriceHistory.objects.create(
                        product=product, price=product.price,
                        discount_percent=product.discount_percent,
                    )
                if old_stock <= 0 < product.stock:
                    from ..services import notify_stock_available
                    notify_stock_available(product)
                updated += 1
        return Response({"updated": updated})
