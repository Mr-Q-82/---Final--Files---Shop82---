from ._shared import *
from .catalog import *
from .products import *

class FavoriteViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = FavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Favorite.objects.filter(user=self.request.user).select_related(
            "product", "product__category", "product__brand"
        )
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class ComparisonViewSet(
    mixins.ListModelMixin, mixins.CreateModelMixin, mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ComparisonItemSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return ComparisonItem.objects.filter(user=self.request.user).select_related(
            "product", "product__category", "product__brand"
        )
    def perform_create(self, serializer):
        if self.get_queryset().count() >= 4:
            from rest_framework.exceptions import ValidationError
            raise ValidationError("حداکثر ۴ محصول را می‌توانید مقایسه کنید.")
        serializer.save(user=self.request.user)

class ProductReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ProductReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    http_method_names = ("get", "post", "patch", "delete", "head", "options")
    filterset_fields = ("product", "product__slug", "status")
    def get_queryset(self):
        qs = ProductReview.objects.select_related("product", "user")
        user = self.request.user
        if user.is_authenticated:
            if user.role in {"ADMIN", "STAFF"}:
                return qs
            return qs.filter(models.Q(status=ProductReview.Status.APPROVED) | models.Q(user=user))
        return qs.filter(status=ProductReview.Status.APPROVED)
    def perform_update(self, serializer):
        if self.request.user.role not in {"ADMIN", "STAFF"} and serializer.instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        serializer.save()
    def perform_destroy(self, instance):
        if self.request.user.role not in {"ADMIN", "STAFF"} and instance.user != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied()
        instance.delete()
    def perform_create(self, serializer):
        review = serializer.save()
        for image in self.request.FILES.getlist("images")[:5]:
            ReviewImage.objects.create(review=review, image=image)
    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def helpful(self, request, pk=None):
        review = self.get_object()
        vote, _ = ReviewHelpfulVote.objects.update_or_create(
            review=review, user=request.user,
            defaults={"is_helpful": bool(request.data.get("is_helpful", True))},
        )
        review.helpful_count = review.helpful_votes.filter(is_helpful=True).count()
        review.save(update_fields=("helpful_count", "updated_at"))
        return Response({"helpful_count": review.helpful_count, "is_helpful": vote.is_helpful})

class AdminProductReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ProductReviewAdminSerializer
    permission_classes = [IsAdminRole]
    queryset = ProductReview.objects.select_related("product", "user")
    http_method_names = ("get", "patch", "delete", "head", "options")
    filterset_fields = ("status", "product")
    def perform_update(self, serializer):
        previous = serializer.instance.status
        review = serializer.save()
        if review.status != previous:
            from apps.accounts.models import Notification
            Notification.objects.create(
                user=review.user,
                title="وضعیت نظر شما تغییر کرد",
                message=(
                    f"نظر شما درباره «{review.product.name}» "
                    f"{'تأیید و منتشر شد' if review.status == ProductReview.Status.APPROVED else 'رد شد'}."
                ),
            )

