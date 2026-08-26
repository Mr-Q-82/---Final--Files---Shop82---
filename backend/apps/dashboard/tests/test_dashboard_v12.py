from datetime import datetime, timezone as dt_timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.catalog.models import Brand, Category, Product
from apps.common.jalali import format_jalali
from apps.orders.models import Order


class DashboardV12Tests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            phone="+989120000021", password="strong-pass",
            role=User.Role.ADMIN, is_staff=True,
        )
        self.customer = User.objects.create_user(
            phone="+989120000022", password="strong-pass",
            first_name="مشتری", last_name="تست",
        )
        category = Category.objects.create(name="داشبورد تست", slug="dashboard-v12")
        brand = Brand.objects.create(name="برند داشبورد", slug="dashboard-brand-v12")
        self.product = Product.objects.create(
            name="محصول داشبورد", slug="dashboard-product-v12", sku="DASH-V12",
            category=category, brand=brand, price=2_000_000, stock=2,
            sold_count=4,
        )
        Order.objects.create(
            user=self.customer, status=Order.Status.DELIVERED,
            subtotal=2_000_000, total=2_000_000, address_snapshot={},
        )

    def test_overview_contains_full_dashboard_data(self):
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/v1/dashboard/overview/")
        self.assertEqual(response.status_code, 200)
        for key in (
            "metrics", "growth", "sales_chart", "recent_orders", "top_products",
            "status_breakdown", "low_stock_products", "top_customers", "generated_at",
        ):
            self.assertIn(key, response.data)
        self.assertEqual(response.data["metrics"]["revenue"], 2_000_000)
        self.assertEqual(response.data["top_customers"][0]["orders_count"], 1)

    def test_jalali_formatter(self):
        value = format_jalali(datetime(2026, 3, 21, tzinfo=dt_timezone.utc))
        self.assertEqual(value, "1405/01/01")
