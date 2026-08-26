from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.catalog.models import Brand, Category, Product
from apps.operations.models import ShippingRule, Warehouse, WarehouseStock


class ProfessionalCommerceV37Tests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(phone="+989120003700", password="StrongPass37")
        self.customer = User.objects.create_user(phone="+989120003701", password="StrongPass37")
        category = Category.objects.create(name="لپ‌تاپ", slug="laptop-v37")
        brand = Brand.objects.create(name="برند ۳۷", slug="brand-v37")
        self.product = Product.objects.create(
            name="لپ‌تاپ حرفه‌ای DDR4", slug="professional-laptop-v37",
            sku="V37-LAPTOP", category=category, brand=brand,
            price=50_000_000, stock=12,
            specifications={"نوع حافظه": "DDR4"}, search_keywords="رم حافظه",
        )

    def test_smart_search_and_popular_queries(self):
        response = self.client.get("/api/v1/catalog/products/suggest/?q=حافظه")
        self.assertEqual(response.status_code, 200)
        self.assertIn("results", response.data)
        self.assertEqual(response.data["results"][0]["slug"], self.product.slug)
        popular = self.client.get("/api/v1/catalog/products/popular-searches/")
        self.assertEqual(popular.status_code, 200)
        self.assertEqual(popular.data[0]["normalized_query"], "حافظه")

    def test_multiple_wishlist_and_bulk_cart_payload(self):
        self.client.force_authenticate(self.customer)
        wishlist = self.client.post(
            "/api/v1/catalog/wishlists/",
            {"title": "خرید ماه آینده", "is_public": True},
            format="json",
        )
        self.assertEqual(wishlist.status_code, 201)
        added = self.client.post(
            f"/api/v1/catalog/wishlists/{wishlist.data['id']}/add_product/",
            {"product": str(self.product.id)},
            format="json",
        )
        self.assertEqual(added.status_code, 201)
        cart = self.client.post(
            f"/api/v1/catalog/wishlists/{wishlist.data['id']}/add-all-to-cart/"
        )
        self.assertEqual(cart.data["items"][0]["product"], self.product.id)

    def test_shipping_quote_and_warehouse_transfer(self):
        ShippingRule.objects.create(
            title="ارسال سریع تهران", method=ShippingRule.Method.EXPRESS,
            provinces=["تهران"], base_cost=100_000, cost_per_kg=20_000,
            free_above=100_000_000, estimated_days=1,
        )
        quote = self.client.post(
            "/api/v1/operations/shipping-rules/quote/",
            {"province": "تهران", "weight_grams": 2200, "subtotal": 50_000_000},
            format="json",
        )
        self.assertEqual(quote.status_code, 200)
        self.assertEqual(quote.data[0]["cost"], 160_000)

        source = Warehouse.objects.create(name="مرکزی", code="MAIN")
        destination = Warehouse.objects.create(name="شعبه", code="BRANCH")
        WarehouseStock.objects.create(
            warehouse=source, product=self.product, quantity=10, reserved_quantity=2
        )
        self.client.force_authenticate(self.admin)
        transfer = self.client.post(
            "/api/v1/operations/stock-transfers/",
            {
                "source": str(source.id), "destination": str(destination.id),
                "product": str(self.product.id), "quantity": 3,
            },
            format="json",
        )
        self.assertEqual(transfer.status_code, 201)
        received = self.client.post(
            f"/api/v1/operations/stock-transfers/{transfer.data['id']}/receive/"
        )
        self.assertEqual(received.status_code, 200)
        self.assertEqual(WarehouseStock.objects.get(warehouse=source, product=self.product).quantity, 7)
        self.assertEqual(WarehouseStock.objects.get(warehouse=destination, product=self.product).quantity, 3)
