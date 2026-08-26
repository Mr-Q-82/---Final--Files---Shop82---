from datetime import timedelta

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.catalog.models import Category, FlashSale, HomeSection, MenuItem, Product


class FlashSaleHomepageTests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(
            phone="+989120000082", role="ADMIN", is_staff=True
        )
        category = Category.objects.create(
            name="لپ‌تاپ", slug="flash-laptop", is_active=True
        )
        self.product = Product.objects.create(
            name="لپ‌تاپ فروش ویژه",
            sku="FLASH-1",
            category=category,
            price=10_000_000,
            stock=5,
        )

    def test_special_price_is_used_and_exposed_to_storefront(self):
        sale = FlashSale.objects.create(
            title="شگفت‌انگیز تست",
            product=self.product,
            discount_percent=0,
            special_price=7_250_000,
            starts_at=timezone.now() - timedelta(minutes=5),
            ends_at=timezone.now() + timedelta(hours=2),
        )

        response = self.client.get("/api/v1/catalog/products/?page_size=100")

        self.assertEqual(response.status_code, 200)
        item = response.data["results"][0]
        self.assertEqual(item["final_price"], 7_250_000)
        self.assertEqual(item["active_flash_sale"]["id"], str(sale.id))
        self.assertEqual(item["active_flash_sale"]["special_price"], 7_250_000)

    def test_flash_sale_requires_discount_or_special_price(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/catalog/flash-sales/",
            {
                "title": "فروش نامعتبر",
                "product": str(self.product.id),
                "discount_percent": 0,
                "starts_at": timezone.now(),
                "ends_at": timezone.now() + timedelta(hours=1),
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)

    def test_default_menu_and_slider_limits_are_completed(self):
        targets = set(MenuItem.objects.values_list("target", flat=True))
        self.assertTrue(
            {"cpu", "ram", "ssd", "monitor", "keyboard", "headphone"}.issubset(
                targets
            )
        )
        self.assertEqual(HomeSection.objects.get(key="offers").product_limit, 8)
        self.assertEqual(
            HomeSection.objects.get(key="best_sellers").product_limit, 12
        )
        self.assertEqual(HomeSection.objects.get(key="newest").product_limit, 12)
        self.assertEqual(
            HomeSection.objects.get(key="offers").slider_interval_seconds, 5
        )

    def test_admin_can_bulk_create_sales_and_limit_cannot_exceed_stock(self):
        second_product = Product.objects.create(
            name="محصول دوم فروش ویژه",
            sku="FLASH-2",
            category=self.product.category,
            price=8_000_000,
            stock=3,
        )
        self.client.force_authenticate(self.admin)
        payload = {
            "title": "کمپین گروهی",
            "product_ids": [str(self.product.id), str(second_product.id)],
            "discount_percent": 10,
            "starts_at": timezone.now(),
            "ends_at": timezone.now() + timedelta(hours=2),
            "stock_limit": 3,
            "is_active": True,
        }
        response = self.client.post(
            "/api/v1/catalog/flash-sales/bulk-create/", payload, format="json"
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(FlashSale.objects.filter(title="کمپین گروهی").count(), 2)

        payload["title"] = "سقف نامعتبر"
        payload["stock_limit"] = 4
        response = self.client.post(
            "/api/v1/catalog/flash-sales/bulk-create/", payload, format="json"
        )
        self.assertEqual(response.status_code, 400)
        self.assertFalse(FlashSale.objects.filter(title="سقف نامعتبر").exists())
