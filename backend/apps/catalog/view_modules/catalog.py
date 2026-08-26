from ._shared import *

class CategoryProductRecommendationViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    serializer_class = CategoryProductRecommendationSerializer
    filterset_fields = ["category", "category__slug", "product", "is_active"]
    ordering_fields = ["sort_order", "created_at"]

    def get_queryset(self):
        queryset = CategoryProductRecommendation.objects.select_related(
            "category", "product", "product__brand"
        )
        is_admin = (
            self.request.user.is_authenticated
            and self.request.user.role in {"ADMIN", "STAFF"}
        )
        if not is_admin:
            queryset = queryset.filter(
                is_active=True,
                product__is_active=True,
                product__stock__gt=0,
            )
        return queryset

class CategoryViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    queryset = Category.objects.annotate(products_count=Count("products")).order_by("sort_order", "name")
    serializer_class = CategorySerializer
    lookup_field = "slug"
    search_fields = ["name"]

class BrandViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    queryset = Brand.objects.annotate(
        products_count=Count(
            "products", filter=Q(products__is_active=True), distinct=True
        )
    ).order_by("-products_count", "name")
    serializer_class = BrandSerializer
    lookup_field = "slug"
    search_fields = ["name"]

    def get_queryset(self):
        queryset = super().get_queryset()
        category_slugs = [
            value.strip()
            for value in self.request.query_params.get("categories", "").split(",")
            if value.strip()
        ]
        if category_slugs:
            queryset = queryset.filter(
                products__category__slug__in=category_slugs,
                products__is_active=True,
            ).distinct()
        return queryset

    CSV_FIELDS = (
        "name", "slug", "is_active", "seo_title", "seo_description",
    )

    @action(detail=False, methods=["get"], permission_classes=[IsAdminRole], url_path="template-csv")
    def template_csv(self, request):
        response = _csv_download("brands-template.csv")
        writer = csv.DictWriter(response, fieldnames=self.CSV_FIELDS)
        writer.writeheader()
        writer.writerow({
            "name": "ایسوس", "slug": "asus", "is_active": "true",
            "seo_title": "محصولات ایسوس", "seo_description": "خرید محصولات برند ایسوس",
        })
        return response

    @action(detail=False, methods=["get"], permission_classes=[IsAdminRole], url_path="export-csv")
    def export_csv(self, request):
        response = _csv_download("brands.csv")
        writer = csv.DictWriter(response, fieldnames=self.CSV_FIELDS)
        writer.writeheader()
        for brand in self.filter_queryset(self.get_queryset()):
            writer.writerow({field: getattr(brand, field) for field in self.CSV_FIELDS})
        return response

    @action(detail=False, methods=["post"], permission_classes=[IsAdminRole], url_path="import-csv")
    def import_csv(self, request):
        rows, error = _read_csv_upload(request)
        if error:
            return error
        required = {"name", "slug"}
        if not required.issubset(rows.fieldnames or []):
            return Response({"detail": "ستون‌های اجباری فایل برند: name و slug"}, status=400)
        created = updated = 0
        errors = []
        for row_number, row in enumerate(rows, start=2):
            try:
                name, slug = row["name"].strip(), row["slug"].strip()
                if not name or not slug:
                    raise ValueError("نام و اسلاگ برند اجباری است.")
                with transaction.atomic():
                    brand, was_created = Brand.objects.update_or_create(
                        slug=slug,
                        defaults={
                            "name": name,
                            "is_active": _csv_bool(row.get("is_active"), True),
                            "seo_title": row.get("seo_title", "").strip(),
                            "seo_description": row.get("seo_description", "").strip(),
                        },
                    )
                created += int(was_created)
                updated += int(not was_created)
            except (IntegrityError, ValueError) as exc:
                errors.append({"row": row_number, "message": str(exc)})
        return Response(_csv_import_result(created, updated, errors))

class SiteSettingViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    serializer_class = SiteSettingSerializer
    parser_classes = [JSONParser, MultiPartParser, FormParser]
    def get_queryset(self):
        return SiteSetting.objects.all().order_by("created_at")
    def create(self, request, *args, **kwargs):
        if SiteSetting.objects.exists():
            return Response(
                {"detail": "تنظیمات سایت قبلاً ساخته شده است؛ آن را ویرایش کنید."},
                status=409,
            )
        return super().create(request, *args, **kwargs)

class NewsletterSubscriberViewSet(viewsets.ModelViewSet):
    serializer_class = NewsletterSubscriberSerializer
    queryset = NewsletterSubscriber.objects.all()
    http_method_names = ("get", "post", "delete", "head", "options")
    def get_permissions(self):
        return [permissions.AllowAny()] if self.action == "create" else [IsAdminRole()]
    def create(self, request, *args, **kwargs):
        submitted_email = str(request.data.get("email", "")).strip().lower()
        existing = NewsletterSubscriber.objects.filter(
            email__iexact=submitted_email
        ).first()
        if existing:
            if not existing.is_active:
                existing.is_active = True
                existing.save(update_fields=("is_active", "updated_at"))
            return Response(self.get_serializer(existing).data)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].strip().lower()
        item, created = NewsletterSubscriber.objects.update_or_create(
            email=email, defaults={"is_active": True}
        )
        return Response(
            self.get_serializer(item).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class NewsletterCampaignViewSet(viewsets.ModelViewSet):
    serializer_class = NewsletterCampaignSerializer
    queryset = NewsletterCampaign.objects.all()
    permission_classes = [IsAdminRole]
    http_method_names = ("get", "post", "delete", "head", "options")

    @action(detail=True, methods=["post"])
    def send(self, request, pk=None):
        campaign = self.get_object()
        selected_ids = request.data.get("subscriber_ids")
        subscribers = NewsletterSubscriber.objects.filter(is_active=True)
        if selected_ids is not None:
            if not isinstance(selected_ids, list):
                return Response({"detail": "فهرست گیرندگان معتبر نیست."}, status=400)
            subscribers = subscribers.filter(id__in=selected_ids)
        recipients = list(subscribers.values_list("email", flat=True))
        if not recipients:
            return Response({"detail": "حداقل یک گیرنده فعال انتخاب کنید."}, status=400)
        EmailMessage(
            subject=campaign.title,
            body=campaign.message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            bcc=recipients,
        ).send(fail_silently=False)
        campaign.sent_at = timezone.now()
        campaign.sent_count = len(recipients)
        campaign.save(update_fields=("sent_at", "sent_count", "updated_at"))
        return Response(self.get_serializer(campaign).data)


class HeroSlideViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    serializer_class = HeroSlideSerializer
    queryset = HeroSlide.objects.select_related(
        "product", "product__brand", "product__category"
    ).all()
    parser_classes = (JSONParser, MultiPartParser, FormParser)
    def get_queryset(self):
        qs = super().get_queryset()
        placement = self.request.query_params.get("placement")
        if placement in {HeroSlide.Placement.HOME, HeroSlide.Placement.GAMING}:
            qs = qs.filter(placement=placement)
        if self.action in {"list", "retrieve"} and not (
            self.request.user.is_authenticated
            and self.request.user.role in {"ADMIN", "STAFF"}
        ):
            qs = qs.filter(is_active=True)
        return qs


class PromoBannerViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    serializer_class = PromoBannerSerializer
    queryset = PromoBanner.objects.all()
    parser_classes = (JSONParser, MultiPartParser, FormParser)

    def get_queryset(self):
        qs = super().get_queryset()
        placement = self.request.query_params.get("placement")
        if placement in {PromoBanner.Placement.HOME, PromoBanner.Placement.GAMING}:
            qs = qs.filter(placement=placement)
        if self.action in {"list", "retrieve"} and not (
            self.request.user.is_authenticated
            and self.request.user.role in {"ADMIN", "STAFF"}
        ):
            qs = qs.filter(is_active=True)
        return qs


class PublicStoreStatsView(APIView):
    permission_classes = (permissions.AllowAny,)

    def get(self, request):
        from apps.accounts.models import User
        return Response({
            "products": Product.objects.filter(is_active=True, stock__gt=0).count(),
            "customers": User.objects.filter(
                role=User.Role.CUSTOMER, is_active=True, is_deleted=False
            ).count(),
            "support": "۲۴/۷",
        })

class MenuItemViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    queryset = MenuItem.objects.all()
    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in {"list", "retrieve"} and not (
            self.request.user.is_authenticated and self.request.user.role in {"ADMIN", "STAFF"}
        ):
            qs = qs.filter(is_active=True)
        return qs

class ProductQuestionViewSet(ReadOnlyOrAdmin, viewsets.ModelViewSet):
    serializer_class = ProductQuestionSerializer
    queryset = ProductQuestion.objects.select_related("product")
    filterset_fields = ["product", "product__slug", "is_published"]
    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in {"list", "retrieve"} and not (
            self.request.user.is_authenticated and self.request.user.role in {"ADMIN", "STAFF"}
        ):
            qs = qs.filter(is_published=True)
        return qs

    def get_permissions(self):
        if self.action in {"list", "retrieve"}:
            return [permissions.AllowAny()]
        if self.action in {"create", "reply"}:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user, is_published=True)

    @action(detail=True, methods=["post"])
    def reply(self, request, pk=None):
        question = self.get_object()
        text = str(request.data.get("answer", "")).strip()
        if len(text) < 2:
            return Response(
                {"answer": "متن پاسخ باید حداقل ۲ نویسه باشد."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        replies = list(question.replies or [])
        replies.append({
            "id": f"{request.user.pk}-{int(timezone.now().timestamp())}",
            "user_name": request.user.full_name or request.user.first_name or "کاربر فروشگاه 82",
            "answer": text[:1000],
            "created_at": timezone.now().isoformat(),
            "is_admin": request.user.role in {"ADMIN", "STAFF"},
        })
        question.replies = replies
        question.save(update_fields=("replies", "updated_at"))
        return Response(self.get_serializer(question).data)

