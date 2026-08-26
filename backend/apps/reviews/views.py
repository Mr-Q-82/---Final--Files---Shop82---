"""Review and Q&A HTTP boundary; URLs remain backward compatible."""

from apps.catalog.views import (  # noqa: F401
    AdminProductReviewViewSet,
    ProductQuestionViewSet,
    ProductReviewViewSet,
)

__all__ = [
    "AdminProductReviewViewSet", "ProductQuestionViewSet", "ProductReviewViewSet",
]
