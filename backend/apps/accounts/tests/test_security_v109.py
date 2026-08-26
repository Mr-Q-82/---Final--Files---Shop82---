from django.test import TestCase, override_settings
from django.utils import timezone
from apps.accounts.models import OTP, StaffPermission, User, UserSession
from apps.common.permissions import IsAdminRole


class SecurityHardeningTests(TestCase):
    def test_otp_is_hashed_and_can_be_verified(self):
        item = OTP.issue("+989121234567", OTP.Purpose.LOGIN)
        plain = item.plain_code
        self.assertNotEqual(item.code, plain)
        self.assertTrue(item.verify(plain))

    def test_empty_staff_permissions_are_denied(self):
        user = User.objects.create_user(phone="+989121234568", password="StrongPass!123")
        user.role = User.Role.STAFF
        user.save(update_fields=["role"])
        StaffPermission.objects.create(user=user, permissions=[])
        request = type("Request", (), {"user": user, "method": "GET"})()
        view = type("View", (), {"basename": "orders", "action": "list"})()
        self.assertFalse(IsAdminRole().has_permission(request, view))

    def test_account_lock_flag(self):
        user = User.objects.create_user(phone="+989121234569", password="StrongPass!123")
        user.locked_until = timezone.now() + timezone.timedelta(minutes=5)
        self.assertTrue(user.is_temporarily_locked)
