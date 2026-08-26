from rest_framework.test import APITestCase
from apps.accounts.models import User, Wallet
from apps.catalog.models import Brand, Category, Product
from apps.orders.models import Order, OrderItem
from .models import (
    GiftCard, InventoryReservation, PurchaseOrder, PurchaseOrderItem, Supplier,
)


class OperationsV13Tests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            phone="+989120000031", password="strong-pass", role=User.Role.ADMIN,
            is_staff=True,
        )
        self.user = User.objects.create_user(phone="+989120000032", password="strong-pass")
        category = Category.objects.create(name="عملیات نسخه ۱۳", slug="operations-v13")
        brand = Brand.objects.create(name="برند عملیات ۱۳", slug="operations-brand-v13")
        self.product = Product.objects.create(
            name="محصول عملیات", slug="operations-product", sku="OPS-13",
            category=category, brand=brand, price=1_000_000, stock=5,
        )

    def test_inventory_entry_and_reservation(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post("/api/v1/operations/inventory/", {
            "product": str(self.product.id), "movement_type": "IN",
            "quantity": 4, "reason": "خرید",
        })
        self.assertEqual(response.status_code, 201, response.data)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 9)
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/v1/operations/reservations/", {
            "product": str(self.product.id), "quantity": 2,
        })
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(InventoryReservation.objects.get().quantity, 2)

    def test_gift_card_redeems_once(self):
        card = GiftCard.objects.create(initial_balance=500_000, balance=500_000)
        self.client.force_authenticate(self.user)
        response = self.client.post("/api/v1/operations/gift-cards/redeem/", {"code": card.code})
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Wallet.objects.get(user=self.user).balance, 500_000)
        self.assertEqual(
            self.client.post("/api/v1/operations/gift-cards/redeem/", {"code": card.code}).status_code,
            400,
        )

    def test_purchase_order_receive_is_idempotent(self):
        supplier = Supplier.objects.create(name="تأمین‌کننده تست")
        purchase = PurchaseOrder.objects.create(supplier=supplier)
        PurchaseOrderItem.objects.create(
            purchase_order=purchase, product=self.product, quantity=3, unit_cost=700_000
        )
        self.client.force_authenticate(self.admin)
        response = self.client.post(f"/api/v1/operations/purchase-orders/{purchase.id}/receive/")
        self.assertEqual(response.status_code, 200)
        self.product.refresh_from_db()
        self.assertEqual(self.product.stock, 8)
        self.assertEqual(
            self.client.post(f"/api/v1/operations/purchase-orders/{purchase.id}/receive/").status_code,
            409,
        )

    def test_pdf_invoice_and_public_health(self):
        order = Order.objects.create(
            user=self.user, status=Order.Status.PAID, address_snapshot={},
            subtotal=1_000_000, total=1_000_000,
        )
        OrderItem.objects.create(
            order=order, product=self.product, product_name=self.product.name,
            unit_price=1_000_000, quantity=1, line_total=1_000_000,
        )
        self.client.force_authenticate(self.user)
        response = self.client.get(f"/api/v1/orders/{order.id}/invoice-pdf/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response["Content-Type"], "application/pdf")
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get("/health/").status_code, 200)
        self.assertEqual(self.client.get("/sitemap.xml").status_code, 200)

    def test_admin_two_factor_requires_otp_after_password(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(
            self.client.post("/api/v1/operations/two-factor/", {"is_enabled": True}).status_code,
            200,
        )
        self.client.force_authenticate(None)
        response = self.client.post("/api/v1/auth/password/login/", {
            "phone": "09120000031", "password": "strong-pass", "admin_panel": True,
        })
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["requires_2fa"])
        self.assertNotIn("access", response.data)
