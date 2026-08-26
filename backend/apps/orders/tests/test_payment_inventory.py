from django.test import override_settings
from rest_framework.test import APITestCase

from apps.accounts.models import Address, User
from apps.catalog.models import Category, Product
from apps.orders.models import Order, PaymentTransaction


@override_settings(PAYMENT_PROVIDER="mock")
class PaymentInventoryTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(phone="+989121234567")
        self.address = Address.objects.create(
            user=self.user, recipient_name="مهدی", recipient_phone="+989121234567",
            province="همدان", city="ملایر", postal_code="1234567890",
            address="ملایر، آدرس کامل آزمایشی",
        )
        category, _ = Category.objects.get_or_create(
            slug="payment", defaults={"name": "پرداخت"}
        )
        self.product = Product.objects.create(
            name="محصول پرداخت", slug="payment-product", sku="PAY-1",
            category=category, price=2_000_000, stock=5,
        )
        self.client.force_authenticate(self.user)

    def checkout(self, key="checkout-1"):
        return self.client.post(
            "/api/v1/orders/checkout/",
            {
                "address_id": str(self.address.id),
                "idempotency_key": key,
                "items": [{"product_id": str(self.product.id), "quantity": 2}],
            },
            format="json",
        )

    def test_duplicate_checkout_key_does_not_commit_stock(self):
        first = self.checkout()
        second = self.checkout()
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(first.data["id"], second.data["id"])
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)

    def test_cancel_restores_inventory(self):
        created = self.checkout()
        canceled = self.client.post(
            f"/api/v1/orders/{created.data['id']}/cancel/",
            {"reason": "انصراف"},
            format="json",
        )
        self.assertEqual(canceled.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 5)
        self.assertEqual(canceled.data["status"], Order.Status.CANCELED)

    def test_mock_payment_marks_order_paid_and_is_idempotent(self):
        created = self.checkout()
        payment = self.client.post(
            f"/api/v1/orders/{created.data['id']}/payment/", format="json"
        )
        self.assertEqual(payment.status_code, 201)
        authority = payment.data["transaction"]["authority"]
        self.client.force_authenticate(user=None)
        callback = self.client.get(
            "/api/v1/orders/payment-callback/",
            {"Authority": authority, "Status": "OK"},
        )
        self.assertEqual(callback.status_code, 200)
        self.assertTrue(callback.data["success"])
        transaction_item = PaymentTransaction.objects.get(authority=authority)
        self.assertEqual(transaction_item.status, PaymentTransaction.Status.SUCCEEDED)
        self.assertEqual(transaction_item.order.status, Order.Status.PAID)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 3)
