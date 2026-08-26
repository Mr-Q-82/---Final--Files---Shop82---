from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.catalog.models import (
    Category, ComparisonItem, Favorite, HomeSection, Product, ProductQuestion,
    ProductReview,
)


class CustomerCatalogFeatureTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(phone="+989121234567")
        self.admin = User.objects.create_user(
            phone="+989111111111", role="ADMIN", is_staff=True
        )
        category, _ = Category.objects.get_or_create(
            slug="digital", defaults={"name": "دیجیتال"}
        )
        self.product = Product.objects.create(
            name="کالای تست", slug="feature-product", sku="FP-1",
            category=category, price=1_000_000, stock=10,
        )

    def test_favorites_and_comparison_are_saved_for_user(self):
        self.client.force_authenticate(self.user)
        favorite = self.client.post(
            "/api/v1/catalog/favorites/",
            {"product": str(self.product.id)},
            format="json",
        )
        comparison = self.client.post(
            "/api/v1/catalog/comparison/",
            {"product": str(self.product.id)},
            format="json",
        )
        self.assertEqual(favorite.status_code, 201)
        self.assertEqual(comparison.status_code, 201)
        self.assertTrue(Favorite.objects.filter(user=self.user).exists())
        self.assertTrue(ComparisonItem.objects.filter(user=self.user).exists())

    def test_review_is_pending_until_admin_approves_it(self):
        self.client.force_authenticate(self.user)
        created = self.client.post(
            "/api/v1/catalog/reviews/",
            {
                "product": str(self.product.id),
                "rating": 5,
                "title": "عالی",
                "comment": "از خرید این محصول راضی بودم.",
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        review = ProductReview.objects.get(user=self.user, product=self.product)
        self.assertEqual(review.status, ProductReview.Status.PENDING)
        self.client.force_authenticate(self.admin)
        approved = self.client.patch(
            f"/api/v1/catalog/admin/reviews/{review.id}/",
            {"status": ProductReview.Status.APPROVED, "admin_reply": "سپاس"},
            format="json",
        )
        self.assertEqual(approved.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(float(self.product.rating), 5.0)

    def test_admin_can_manage_homepage_content(self):
        self.client.force_authenticate(self.admin)
        HomeSection.objects.create(key="hero-test", title="قدیمی")
        response = self.client.patch(
            "/api/v1/catalog/home-sections/hero-test/",
            {"title": "عنوان جدید صفحه اصلی"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["title"], "عنوان جدید صفحه اصلی")

    def test_customer_can_ask_and_reply_to_product_question(self):
        self.client.force_authenticate(self.user)
        created = self.client.post(
            "/api/v1/catalog/questions/",
            {"product": str(self.product.id), "question": "برای کار حرفه‌ای مناسب است؟"},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        question = ProductQuestion.objects.get(pk=created.data["id"])
        self.assertEqual(question.user, self.user)
        replied = self.client.post(
            f"/api/v1/catalog/questions/{question.id}/reply/",
            {"answer": "بله، مشخصات فنی آن مناسب است."},
            format="json",
        )
        self.assertEqual(replied.status_code, 200)
        self.assertEqual(len(replied.data["replies"]), 1)
