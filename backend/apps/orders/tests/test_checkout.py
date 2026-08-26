from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import Address, User
from apps.catalog.models import Category, Product
from apps.orders.models import DiscountCode

class CheckoutTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user("+989123456789")
        self.address = Address.objects.create(
            user=self.user, recipient_name="مهدی", recipient_phone="+989123456789",
            province="همدان", city="ملایر", postal_code="1234567890", address="آدرس تست",
        )
        category = Category.objects.create(name="قطعات", slug="parts")
        self.product = Product.objects.create(name="CPU", slug="cpu", sku="CPU-1", category=category, price=10_000_000, stock=3)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(self.user).access_token}")

    def test_checkout_reserves_without_reducing_stock(self):
        response = self.client.post("/api/v1/orders/checkout/", {
            "address_id": str(self.address.id),
            "items": [{"product_id": str(self.product.id), "quantity": 2}],
        }, format="json")
        self.assertEqual(response.status_code, 201)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)

    def test_admin_can_create_discount_and_checkout_uses_it(self):
        admin = User.objects.create_user(
            "+989111111111", role="ADMIN", is_staff=True
        )
        admin_client = APIClient()
        admin_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(admin).access_token}"
        )
        created = admin_client.post(
            "/api/v1/orders/discounts/",
            {"code": "SAVE20", "percent": 20, "is_active": True},
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        response = self.client.post(
            "/api/v1/orders/checkout/",
            {
                "address_id": str(self.address.id),
                "discount_code": "SAVE20",
                "items": [{"product_id": str(self.product.id), "quantity": 1}],
            },
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["discount_amount"], 2_000_000)
        self.assertEqual(DiscountCode.objects.get(code="SAVE20").used_count, 1)
