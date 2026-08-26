from django.test import TestCase
from rest_framework.test import APITestCase

from apps.accounts.models import LoyaltySetting, User
from apps.orders.models import Order


class AdminControlsV23Tests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            phone="09020000023", password="StrongPass123!"
        )
        self.customer = User.objects.create_user(
            phone="09020000024", password="StrongPass123!"
        )
        self.client.force_authenticate(self.admin)

    def test_admin_can_update_loyalty_rules(self):
        response = self.client.patch(
            "/api/v1/auth/admin/loyalty-settings/",
            {
                "purchase_step_amount": 250000,
                "points_per_step": 5,
                "toman_per_point": 1500,
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200, response.data)
        setting = LoyaltySetting.get_solo()
        self.assertEqual(setting.points_per_step, 5)

    def test_admin_can_soft_delete_another_user(self):
        response = self.client.delete(
            f"/api/v1/auth/admin/users/{self.customer.id}/"
        )
        self.assertEqual(response.status_code, 204)
        self.customer.refresh_from_db()
        self.assertTrue(self.customer.is_deleted)
        self.assertFalse(self.customer.is_active)

    def test_admin_cannot_delete_self(self):
        response = self.client.delete(
            f"/api/v1/auth/admin/users/{self.admin.id}/"
        )
        self.assertEqual(response.status_code, 400)


class AutomaticTrackingV23Tests(TestCase):
    def test_order_receives_tracking_code_on_creation(self):
        user = User.objects.create_user(
            phone="09020000025", password="StrongPass123!"
        )
        order = Order.objects.create(
            user=user,
            address_snapshot={},
            subtotal=1000,
            total=1000,
        )
        self.assertTrue(order.tracking_code.startswith("TSK-"))
        self.assertEqual(len(order.tracking_code), 20)
