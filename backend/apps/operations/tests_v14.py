from rest_framework.test import APITestCase

from apps.accounts.models import Address, Notification, SupportTicket, User, Wallet
from apps.catalog.models import Brand, Category, Product, StockAlert
from apps.orders.models import Order


class CommerceV14Tests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            phone="+989120000041", password="strong-pass"
        )
        self.admin = User.objects.create_user(
            phone="+989120000042", password="strong-pass",
            role=User.Role.ADMIN, is_staff=True,
        )
        self.other_user = User.objects.create_user(
            phone="+989120000043", password="strong-pass"
        )
        self.address = Address.objects.create(
            user=self.user, recipient_name="کاربر تست",
            recipient_phone=self.user.phone, province="تهران", city="تهران",
            postal_code="1234567890", national_id="0013546789",
            address="تهران، خیابان تست، پلاک ده",
        )
        category = Category.objects.create(name="نسخه چهارده", slug="v14")
        brand = Brand.objects.create(name="برند نسخه چهارده", slug="brand-v14")
        self.product = Product.objects.create(
            name="محصول نسخه چهارده", slug="product-v14", sku="V14-1",
            category=category, brand=brand, price=2_000_000, stock=4,
        )

    def test_stock_is_deducted_only_after_payment(self):
        Wallet.objects.create(user=self.user, balance=10_000_000)
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/v1/orders/checkout/", {
            "address_id": str(self.address.id),
            "items": [{"product_id": str(self.product.id), "quantity": 2}],
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 4)
        order = Order.objects.get(pk=response.data["id"])
        self.assertFalse(order.inventory_committed)

        response = self.client.post(f"/api/v1/orders/{order.id}/pay-wallet/")
        self.assertEqual(response.status_code, 200, response.data)
        self.product.refresh_from_db()
        order.refresh_from_db()
        self.assertEqual(self.product.stock, 2)
        self.assertTrue(order.inventory_committed)

    def test_restock_notifies_waiting_customer_once(self):
        self.product.stock = 0
        self.product.save(update_fields=("stock", "updated_at"))
        StockAlert.objects.create(user=self.user, product=self.product)
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/v1/operations/inventory/", {
            "product": str(self.product.id), "movement_type": "IN",
            "quantity": 3, "reason": "شارژ مجدد",
        })
        self.assertEqual(response.status_code, 201, response.data)
        alert = StockAlert.objects.get(user=self.user, product=self.product)
        self.assertTrue(alert.is_notified)
        self.assertEqual(
            Notification.objects.filter(
                user=self.user, title="محصول دوباره موجود شد"
            ).count(),
            1,
        )

    def test_admin_broadcast_delete_removes_it_for_everyone(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/v1/auth/admin/notifications/", {
            "title": "پیام همگانی", "message": "متن آزمایشی",
        }, format="json")
        self.assertEqual(response.status_code, 201, response.data)
        broadcast_id = response.data["broadcast_id"]
        rows = Notification.objects.filter(broadcast_id=broadcast_id)
        self.assertEqual(rows.count(), 3)
        response = self.client.delete(
            f"/api/v1/auth/admin/notifications/{rows.first().id}/"
        )
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Notification.objects.filter(broadcast_id=broadcast_id).exists())

    def test_ticket_is_a_conversation_until_admin_closes_it(self):
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/v1/auth/tickets/", {
            "subject": "سؤال سفارش", "initial_message": "پیام اول کاربر",
        }, format="json")
        ticket = SupportTicket.objects.get(pk=response.data["id"])

        self.client.force_authenticate(self.admin)
        response = self.client.post(
            f"/api/v1/auth/tickets/{ticket.id}/reply/",
            {"message": "پاسخ مدیریت"}, format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)

        self.client.force_authenticate(self.user)
        response = self.client.post(
            f"/api/v1/auth/tickets/{ticket.id}/reply/",
            {"message": "سؤال دوم کاربر"}, format="json",
        )
        self.assertEqual(response.status_code, 201, response.data)

        self.client.force_authenticate(self.admin)
        self.assertEqual(
            self.client.post(f"/api/v1/auth/tickets/{ticket.id}/close/").status_code,
            200,
        )
        self.client.force_authenticate(self.user)
        response = self.client.post(
            f"/api/v1/auth/tickets/{ticket.id}/reply/",
            {"message": "نباید ثبت شود"}, format="json",
        )
        self.assertEqual(response.status_code, 409)
        self.assertEqual(ticket.messages.count(), 3)
