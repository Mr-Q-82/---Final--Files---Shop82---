from unittest.mock import patch

from rest_framework.test import APITestCase

from apps.accounts.models import Notification, User, Wallet
from apps.catalog.models import Category, Product
from apps.operations.models import InventoryMovement
from apps.orders.models import Order, OrderItem, ReturnRequest


class AdminOrderReturnV16Tests(APITestCase):
    def setUp(self):
        self.customer = User.objects.create_user(
            phone="+989120000061", first_name="مشتری", last_name="آزمایشی"
        )
        self.customer.national_id = "0013546789"
        self.customer.save(update_fields=("national_id", "updated_at"))
        self.admin = User.objects.create_user(
            phone="+989120000062", role=User.Role.ADMIN, is_staff=True
        )
        category = Category.objects.create(name="نسخه شانزده", slug="v16")
        self.product = Product.objects.create(
            name="کالای مرجوعی", slug="return-v16", sku="RET-16",
            category=category, price=4_000_000, stock=2, sold_count=1,
        )
        self.order = Order.objects.create(
            user=self.customer, status=Order.Status.DELIVERED,
            address_snapshot={
                "recipient_name": "مشتری آزمایشی", "province": "تهران",
                "city": "تهران", "address": "خیابان تست، پلاک ۱۶",
                "postal_code": "1234567890",
            },
            subtotal=4_000_000, total=4_000_000, inventory_committed=True,
        )
        OrderItem.objects.create(
            order=self.order, product=self.product,
            product_name=self.product.name, unit_price=4_000_000,
            quantity=1, line_total=4_000_000,
        )
        self.client.force_authenticate(self.admin)

    def test_tracking_code_is_unique_and_idempotent(self):
        second = Order.objects.create(
            user=self.customer, address_snapshot={}, total=1
        )
        first_response = self.client.post(
            f"/api/v1/orders/admin/all/{self.order.id}/generate-tracking/"
        )
        repeated_response = self.client.post(
            f"/api/v1/orders/admin/all/{self.order.id}/generate-tracking/"
        )
        second_response = self.client.post(
            f"/api/v1/orders/admin/all/{second.id}/generate-tracking/"
        )
        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(
            first_response.data["tracking_code"],
            repeated_response.data["tracking_code"],
        )
        self.assertNotEqual(
            first_response.data["tracking_code"],
            second_response.data["tracking_code"],
        )
        self.assertTrue(first_response.data["tracking_code"].startswith("TSK-"))

    def test_admin_order_details_include_customer(self):
        response = self.client.get(
            f"/api/v1/orders/admin/all/{self.order.id}/"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["customer"]["phone"], self.customer.phone)
        self.assertEqual(response.data["customer"]["national_id"], "0013546789")
        self.assertEqual(response.data["items"][0]["product_name"], self.product.name)

    @patch("apps.accounts.services.send_sms")
    def test_return_notifies_customer_and_refund_restocks_once(self, _send_sms):
        request_item = ReturnRequest.objects.create(
            order=self.order, user=self.customer, reason="کالا آسیب دیده است"
        )
        reviewing = self.client.patch(
            f"/api/v1/orders/returns/{request_item.id}/",
            {"status": ReturnRequest.Status.REVIEWING}, format="json",
        )
        self.assertEqual(reviewing.status_code, 200, reviewing.data)
        approved = self.client.patch(
            f"/api/v1/orders/returns/{request_item.id}/",
            {"status": ReturnRequest.Status.APPROVED}, format="json",
        )
        self.assertEqual(approved.status_code, 200, approved.data)
        notice = Notification.objects.filter(
            user=self.customer, title__contains="مرجوعی"
        ).latest("created_at")
        self.assertIn("به کیف پول شما بازگردانده شد", notice.message)
        self.assertIn("پیک ما", notice.message)
        self.assertIn("خیابان تست", notice.message)
        request_item.refresh_from_db()
        self.assertTrue(request_item.refund_paid)
        self.assertEqual(
            Wallet.objects.get(user=self.customer).balance, 4_000_000
        )

        refunded = self.client.patch(
            f"/api/v1/orders/returns/{request_item.id}/",
            {"status": ReturnRequest.Status.REFUNDED}, format="json",
        )
        self.assertEqual(refunded.status_code, 200, refunded.data)
        self.product.refresh_from_db()
        request_item.refresh_from_db()
        self.assertEqual(self.product.stock, 3)
        self.assertTrue(request_item.inventory_restocked)
        # Moving to the final stage must not credit the wallet a second time.
        self.assertEqual(Wallet.objects.get(user=self.customer).balance, 4_000_000)
        self.assertEqual(
            InventoryMovement.objects.filter(
                reference=str(request_item.id),
                movement_type=InventoryMovement.Type.IN,
            ).count(),
            1,
        )
