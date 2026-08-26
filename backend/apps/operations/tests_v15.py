from rest_framework.test import APITestCase

from apps.accounts.models import AdminAuditLog, Notification, User
from apps.catalog.models import Brand, Category, Product, ProductReview
from apps.orders.models import Order


class CommerceV15Tests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            phone="+989120000051", password="strong-pass",
            first_name="کاربر", last_name="نظر",
        )
        self.admin = User.objects.create_user(
            phone="+989120000052", password="strong-pass",
            first_name="مدیر", last_name="فروشگاه",
            role=User.Role.ADMIN, is_staff=True,
        )
        category = Category.objects.create(name="نسخه پانزده", slug="v15")
        brand = Brand.objects.create(name="برند نسخه پانزده", slug="brand-v15")
        self.product = Product.objects.create(
            name="محصول سئو", slug="seo-product-v15", sku="V15-1",
            category=category, brand=brand, price=3_000_000, stock=2,
        )

    def test_review_admin_sees_identity_and_user_gets_moderation_notice(self):
        review = ProductReview.objects.create(
            product=self.product, user=self.user, rating=5,
            comment="نظر آزمایشی کامل", status=ProductReview.Status.PENDING,
        )
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/v1/catalog/admin/reviews/")
        self.assertEqual(response.status_code, 200)
        row = (response.data.get("results") or response.data)[0]
        self.assertEqual(row["user_phone"], self.user.phone)
        self.assertEqual(row["user_name"], self.user.full_name)
        response = self.client.patch(
            f"/api/v1/catalog/admin/reviews/{review.id}/",
            {"status": ProductReview.Status.APPROVED}, format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        self.assertTrue(
            Notification.objects.filter(
                user=self.user, title="وضعیت نظر شما تغییر کرد"
            ).exists()
        )

    def test_audit_log_has_human_readable_description(self):
        item = AdminAuditLog.objects.create(
            actor=self.admin, action="PATCH",
            target_type=f"/api/v1/catalog/products/{self.product.slug}/",
            target_id=self.product.slug, details={"status_code": 200},
        )
        self.client.force_authenticate(self.admin)
        response = self.client.get(
            f"/api/v1/auth/admin/audit-logs/{item.id}/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("محصول", response.data["description"])
        self.assertIn("ویرایش کرد", response.data["description"])
        self.assertEqual(response.data["actor_phone"], self.admin.phone)

    def test_sitemap_uses_clean_product_and_category_urls(self):
        response = self.client.get("/sitemap.xml")
        content = response.content.decode()
        self.assertEqual(response.status_code, 200)
        self.assertIn("/product/seo-product-v15", content)
        self.assertIn("/shop/v15", content)
        self.assertNotIn("#product", content)

    def test_delivered_order_accepts_return_reason(self):
        order = Order.objects.create(
            user=self.user, status=Order.Status.DELIVERED,
            address_snapshot={}, subtotal=3_000_000, total=3_000_000,
        )
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/v1/orders/returns/", {
            "order": str(order.id),
            "reason": "کالا آسیب‌دیده است",
            "description": "بسته هنگام تحویل آسیب داشت.",
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["reason"], "کالا آسیب‌دیده است")
