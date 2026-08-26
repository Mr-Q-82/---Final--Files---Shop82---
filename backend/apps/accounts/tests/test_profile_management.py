from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase

from apps.accounts.models import EmailVerification, Notification


class ProfileManagementTests(APITestCase):
    def setUp(self):
        User = get_user_model()
        self.admin = User.objects.create_user(
            phone="+989111111111", password="AdminPass123", role="ADMIN", is_staff=True
        )
        self.customer = User.objects.create_user(phone="+989122222222")

    def test_admin_can_add_and_edit_user(self):
        self.client.force_authenticate(self.admin)
        created = self.client.post(
            "/api/v1/auth/admin/users/",
            {
                "phone": "09133333333",
                "first_name": "مهدی",
                "role": "CUSTOMER",
                "password": "Customer123!",
                "is_active": True,
                "is_verified": True,
            },
            format="json",
        )
        self.assertEqual(created.status_code, 201)
        changed = self.client.patch(
            f"/api/v1/auth/admin/users/{created.data['id']}/",
            {"last_name": "پیرحیاتی"},
            format="json",
        )
        self.assertEqual(changed.status_code, 200)
        self.assertEqual(changed.data["last_name"], "پیرحیاتی")

    def test_address_location_profile_and_password(self):
        self.client.force_authenticate(self.customer)
        address = self.client.post(
            "/api/v1/auth/addresses/",
            {
                "title": "خانه",
                "recipient_name": "مهدی",
                "recipient_phone": "09122222222",
                "province": "همدان",
                "city": "ملایر",
                "postal_code": "1234567890",
                "national_id": "0013546120",
                "address": "همدان، ملایر، آدرس انتخاب‌شده روی نقشه",
                "latitude": "34.296900",
                "longitude": "48.823500",
            },
            format="json",
        )
        self.assertEqual(address.status_code, 201)
        profile = self.client.patch(
            "/api/v1/auth/me/",
            {"national_id": "0013546120", "avatar": "avatar-3"},
            format="json",
        )
        self.assertEqual(profile.status_code, 200)
        password = self.client.post(
            "/api/v1/auth/password/change/",
            {"current_password": "", "new_password": "NewPassword123!"},
            format="json",
        )
        self.assertEqual(password.status_code, 200)

    def test_admin_broadcasts_notification(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/auth/admin/notifications/",
            {"title": "خبر فروشگاه", "message": "پیام آزمایشی"},
            format="json",
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Notification.objects.count(), 2)

    def test_duplicate_phone_has_clear_error(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/auth/admin/users/",
            {"phone": self.customer.phone, "password": "Customer123!"},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("قبلاً ثبت شده", str(response.data))

    def test_email_must_be_verified_before_it_is_saved(self):
        self.client.force_authenticate(self.customer)
        requested = self.client.post(
            "/api/v1/auth/email/request/",
            {"email": "customer@example.com"},
            format="json",
        )
        self.assertEqual(requested.status_code, 201)
        item = EmailVerification.objects.get(user=self.customer)
        verified = self.client.post(
            "/api/v1/auth/email/verify/",
            {"email": item.email, "code": item.plain_code},
            format="json",
        )
        self.assertEqual(verified.status_code, 200)
        self.assertTrue(verified.data["email_verified"])

    def test_existing_user_can_login_with_password(self):
        self.customer.set_password("CustomerPass123")
        self.customer.save()
        response = self.client.post(
            "/api/v1/auth/password/login/",
            {"phone": "09122222222", "password": "CustomerPass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_user_can_mark_and_delete_notification(self):
        item = Notification.objects.create(
            user=self.customer, title="پیام", message="متن"
        )
        self.client.force_authenticate(self.customer)
        marked = self.client.post(
            f"/api/v1/auth/notifications/{item.id}/mark_read/"
        )
        self.assertEqual(marked.status_code, 200)
        self.assertTrue(marked.data["is_read"])
        deleted = self.client.delete(f"/api/v1/auth/notifications/{item.id}/")
        self.assertEqual(deleted.status_code, 204)
