from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.catalog.models import Brand, Category, MenuItem, Product, ProductQuestion


class CatalogManagementFeatureTests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(
            phone="+989111111111", role="ADMIN", is_staff=True
        )
        self.client.force_authenticate(self.admin)
        self.category, _ = Category.objects.get_or_create(
            slug="laptop", defaults={"name": "لپ‌تاپ"}
        )
        self.brand = Brand.objects.create(name="ایسوس", slug="asus")
        self.product = Product.objects.create(
            name="محصول تست",
            slug="test-product",
            sku="TEST-1",
            category=self.category,
            brand=self.brand,
            price=1000,
        )

    def test_admin_can_manage_product_options(self):
        response = self.client.patch(
            f"/api/v1/catalog/products/{self.product.slug}/",
            {
                "warranty": "۱۸ ماهه شرکتی",
                "available_colors": [["مشکی", "#111827"]],
                "shipping_options": [{"name": "سریع", "cost": 150000}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["warranty"], "۱۸ ماهه شرکتی")
        self.assertEqual(response.data["available_colors"][0][0], "مشکی")

    def test_admin_can_manage_question_and_menu(self):
        question = self.client.post(
            "/api/v1/catalog/questions/",
            {
                "product": self.product.id,
                "question": "اصل است؟",
                "answer": "بله",
                "is_published": True,
            },
            format="json",
        )
        self.assertEqual(question.status_code, 201)
        self.assertTrue(ProductQuestion.objects.filter(question="اصل است؟").exists())
        menu = self.client.post(
            "/api/v1/catalog/menu-items/",
            {"title": "لپ‌تاپ", "target": "laptop", "is_active": True},
            format="json",
        )
        self.assertEqual(menu.status_code, 201)
        self.assertTrue(MenuItem.objects.filter(target="laptop").exists())

    def test_admin_can_create_and_edit_taxonomies(self):
        category = self.client.post(
            "/api/v1/catalog/categories/",
            {"name": "موبایل", "slug": "mobile", "icon": "phone", "is_active": True},
            format="json",
        )
        self.assertEqual(category.status_code, 201)
        changed = self.client.patch(
            "/api/v1/catalog/categories/mobile/",
            {"name": "گوشی موبایل"},
            format="json",
        )
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(changed.data["name"], "گوشی موبایل")

    def test_category_subcategories_and_product_delete(self):
        changed = self.client.patch(
            f"/api/v1/catalog/categories/{self.category.slug}/",
            {"subcategories": ["گیمینگ", "دانشجویی"]},
            format="json",
        )
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(changed.data["subcategories"], ["گیمینگ", "دانشجویی"])
        deleted = self.client.delete(
            f"/api/v1/catalog/products/{self.product.slug}/"
        )
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(Product.objects.filter(id=self.product.id).exists())
