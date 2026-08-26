from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import Address, LoyaltyProfile, SupportTicket, User, Wallet
from apps.catalog.models import Brand, Category, FlashSale, Product, ProductVariant
from apps.orders.models import Order, ReturnRequest


class CommerceV11Tests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(phone="+989120000011", password="strong-pass")
        self.admin = User.objects.create_user(
            phone="+989120000012", password="strong-pass", role=User.Role.ADMIN,
            is_staff=True,
        )
        self.address = Address.objects.create(
            user=self.user, recipient_name="کاربر تست", recipient_phone="+989120000011",
            province="تهران", city="تهران", postal_code="1234567890",
            national_id="0013546789", address="تهران، خیابان تست، پلاک ۱۰",
        )
        category = Category.objects.create(name="دسته تست نسخه ۱۱", slug="v11-test-category")
        brand = Brand.objects.create(name="برند تست نسخه ۱۱", slug="v11-test-brand")
        self.product = Product.objects.create(
            name="محصول تست", slug="test-product", sku="TEST-1",
            category=category, brand=brand, price=10_000_000, stock=10,
        )

    def test_wallet_loyalty_and_ticket_apis(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get("/api/v1/auth/wallet/").status_code, 200)
        profile = LoyaltyProfile.objects.create(user=self.user, points=200)
        response = self.client.post("/api/v1/auth/loyalty/", {"redeem_points": 100})
        self.assertEqual(response.status_code, 200)
        profile.refresh_from_db()
        self.assertEqual(profile.points, 100)
        self.assertEqual(Wallet.objects.get(user=self.user).balance, 100_000)
        response = self.client.post(
            "/api/v1/auth/tickets/",
            {"subject": "پیگیری سفارش", "initial_message": "لطفاً بررسی کنید"},
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(SupportTicket.objects.get().messages.count(), 1)

    def test_variant_flash_checkout_and_wallet_payment(self):
        variant = ProductVariant.objects.create(
            product=self.product, name="رم ۳۲ گیگ", sku="TEST-V1",
            attributes={"ram": "32GB"}, price=12_000_000, stock=3,
        )
        FlashSale.objects.create(
            title="فروش تست", product=self.product, discount_percent=10,
            starts_at=timezone.now() - timedelta(hours=1),
            ends_at=timezone.now() + timedelta(hours=1), stock_limit=2,
        )
        wallet = Wallet.objects.create(user=self.user, balance=20_000_000)
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/v1/orders/checkout/", {
            "address_id": str(self.address.id),
            "items": [{"product_id": str(self.product.id), "variant_id": str(variant.id), "quantity": 1}],
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        order = Order.objects.get(id=response.data["id"])
        self.assertEqual(order.items.get().unit_price, 10_800_000)
        self.assertEqual(self.client.post(f"/api/v1/orders/{order.id}/pay-wallet/").status_code, 200)
        wallet.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PAID)
        self.assertEqual(wallet.balance, 8_910_000)

    def test_return_refund_is_credited_once(self):
        order = Order.objects.create(
            user=self.user, status=Order.Status.DELIVERED, subtotal=1_000_000,
            total=1_000_000, address_snapshot={},
        )
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/v1/orders/returns/", {
            "order": str(order.id), "reason": "کالای معیوب",
        })
        self.assertEqual(response.status_code, 201, response.data)
        item = ReturnRequest.objects.get()
        self.client.force_authenticate(self.admin)
        for next_status in ("REVIEWING", "APPROVED", "REFUNDED"):
            response = self.client.patch(
                f"/api/v1/orders/returns/{item.id}/",
                {"status": next_status}, format="json",
            )
            self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Wallet.objects.get(user=self.user).balance, 1_000_000)
        response = self.client.patch(
            f"/api/v1/orders/returns/{item.id}/",
            {"status": "REFUNDED"}, format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Wallet.objects.get(user=self.user).balance, 1_000_000)
