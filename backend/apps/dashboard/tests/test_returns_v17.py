from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.catalog.models import Category, Product
from apps.orders.models import Order, ReturnRequest


class ReturnDashboardV17Tests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            phone="+989120000071", role=User.Role.ADMIN, is_staff=True
        )
        self.customer = User.objects.create_user(phone="+989120000072")
        category = Category.objects.create(name="داشبورد ۱۷", slug="dashboard-v17")
        self.product = Product.objects.create(
            name="محصول داشبورد", slug="dashboard-product-v17",
            sku="DASH-17", category=category, price=1_000_000, stock=1,
        )
        self.client.force_authenticate(self.admin)

    def test_returned_order_has_separate_status_without_increasing_total(self):
        delivered = Order.objects.create(
            user=self.customer, status=Order.Status.DELIVERED,
            address_snapshot={}, total=1_000_000,
        )
        Order.objects.create(
            user=self.customer, status=Order.Status.SENT,
            address_snapshot={}, total=1_000_000,
        )
        ReturnRequest.objects.create(
            order=delivered, user=self.customer, reason="خرابی",
            status=ReturnRequest.Status.APPROVED, refund_amount=1_000_000,
            refund_paid=True,
        )
        response = self.client.get("/api/v1/dashboard/overview/")
        self.assertEqual(response.status_code, 200)
        breakdown = {
            row["status"]: row["count"]
            for row in response.data["status_breakdown"]
        }
        self.assertEqual(sum(breakdown.values()), 2)
        self.assertEqual(breakdown["RETURNED"], 1)
        self.assertEqual(response.data["return_metrics"]["approved"], 1)
        self.assertEqual(response.data["return_metrics"]["amount"], 1_000_000)
