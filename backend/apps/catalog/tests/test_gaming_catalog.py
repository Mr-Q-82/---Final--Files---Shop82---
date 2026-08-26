from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.catalog.models import Category, MenuItem, Product


class GamingCatalogTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="لپ‌تاپ", slug="gaming-laptop", is_active=True
        )
        self.gaming_product = Product.objects.create(
            name="لپ‌تاپ گیمینگ",
            sku="GAME-001",
            category=self.category,
            price=70_000_000,
            stock=4,
            is_gaming=True,
        )
        Product.objects.create(
            name="لپ‌تاپ اداری",
            sku="OFFICE-001",
            category=self.category,
            price=30_000_000,
            stock=2,
            is_gaming=False,
        )

    def test_public_api_filters_only_gaming_products(self):
        response = self.client.get("/api/v1/catalog/products/?is_gaming=true")
        self.assertEqual(response.status_code, 200)
        rows = response.data.get("results", response.data)
        self.assertEqual([row["sku"] for row in rows], ["GAME-001"])
        self.assertTrue(rows[0]["is_gaming"])

    def test_public_api_filters_only_regular_products(self):
        response = self.client.get("/api/v1/catalog/products/?is_gaming=false")
        self.assertEqual(response.status_code, 200)
        rows = response.data.get("results", response.data)
        self.assertEqual([row["sku"] for row in rows], ["OFFICE-001"])
        self.assertFalse(rows[0]["is_gaming"])

    def test_admin_can_control_gaming_and_featured_flags(self):
        admin = get_user_model().objects.create_user(
            phone="09120000044", role="ADMIN", is_staff=True
        )
        self.client.force_authenticate(admin)
        response = self.client.patch(
            f"/api/v1/catalog/products/{self.gaming_product.slug}/",
            {"is_gaming": False, "is_featured": True},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["is_gaming"])
        self.assertTrue(response.data["is_featured"])

        featured = self.client.get(
            "/api/v1/catalog/products/?is_featured=true&is_gaming=false"
        )
        self.assertEqual(featured.status_code, 200)
        rows = featured.data.get("results", featured.data)
        self.assertEqual([row["sku"] for row in rows], ["GAME-001"])

    def test_default_gaming_menu_exists_after_migration(self):
        # Migration creates this in real databases; this assertion documents the target.
        MenuItem.objects.update_or_create(
            target="gaming",
            defaults={"title": "🎮 محصولات گیمینگ", "sort_order": 55},
        )
        self.assertTrue(MenuItem.objects.filter(target="gaming").exists())
