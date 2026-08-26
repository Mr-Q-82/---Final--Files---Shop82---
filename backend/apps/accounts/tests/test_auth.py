from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient
from apps.accounts.models import (
    LoyaltyPointEntry, LoyaltyProfile, LoyaltySetting, Notification, OTP,
    ReferralEvent, User,
)

@override_settings(OTP_DEBUG_RETURN_CODE=True)
class OTPAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_registration_with_otp_returns_tokens_and_creates_verified_user(self):
        response = self.client.post("/api/v1/auth/otp/request/", {"phone": "09123456789", "purpose": "REGISTER"}, format="json")
        self.assertEqual(response.status_code, 201)
        code = response.data["debug_code"]
        verify = self.client.post("/api/v1/auth/otp/verify/", {
            "phone": "09123456789", "purpose": "REGISTER", "code": code,
            "first_name": "مهدی", "last_name": "پیرحیاتی",
            "password": "StrongPass123!",
            "password_confirm": "StrongPass123!",
        }, format="json")
        self.assertEqual(verify.status_code, 200)
        self.assertIn("access", verify.data)
        self.assertIn("refresh", verify.data)
        user = User.objects.get(phone="+989123456789")
        self.assertTrue(user.is_verified)
        self.assertTrue(user.check_password("StrongPass123!"))
        profile = LoyaltyProfile.objects.get(user=user)
        self.assertRegex(profile.referral_code, r"^[A-F0-9]{8,16}$")

    def test_existing_user_cannot_attach_referral_code_later(self):
        inviter_user = User.objects.create_user(
            phone="+989109999991", password="StrongPass123", is_verified=True
        )
        inviter = LoyaltyProfile.objects.create(user=inviter_user)
        existing_user = User.objects.create_user(
            phone="+989109999992", password="StrongPass123", is_verified=True
        )
        self.client.force_authenticate(existing_user)
        response = self.client.post(
            "/api/v1/auth/loyalty/",
            {"referral_code": inviter.referral_code},
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("فقط هنگام ثبت‌نام", response.data["detail"])

    def test_registration_referral_awards_admin_configured_points(self):
        inviter_user = User.objects.create_user(
            phone="+989101111111", password="StrongPass123", is_verified=True
        )
        inviter = LoyaltyProfile.objects.create(user=inviter_user)
        setting = LoyaltySetting.get_solo()
        setting.invited_user_bonus = 75
        setting.inviter_bonus = 150
        setting.save(update_fields=("invited_user_bonus", "inviter_bonus", "updated_at"))
        requested = self.client.post(
            "/api/v1/auth/otp/request/",
            {"phone": "09102222222", "purpose": "REGISTER"},
            format="json",
        )
        verified = self.client.post(
            "/api/v1/auth/otp/verify/",
            {
                "phone": "09102222222",
                "purpose": "REGISTER",
                "code": requested.data["debug_code"],
                "first_name": "کاربر جدید",
                "referral_code": inviter.referral_code,
                "password": "StrongPass123!",
                "password_confirm": "StrongPass123!",
            },
            format="json",
        )
        self.assertEqual(verified.status_code, 200, verified.data)
        invited = LoyaltyProfile.objects.get(user__phone="+989102222222")
        inviter.refresh_from_db()
        self.assertEqual(invited.referred_by, inviter_user)
        self.assertEqual(invited.points, 75)
        self.assertEqual(inviter.points, 150)
        invited_user = invited.user
        event = ReferralEvent.objects.get(
            inviter=inviter_user, invited_user=invited_user
        )
        self.assertEqual(event.referral_code, inviter.referral_code)
        self.assertEqual(event.inviter_points_awarded, 150)
        self.assertEqual(event.invited_points_awarded, 75)
        self.assertTrue(
            LoyaltyPointEntry.objects.filter(
                profile=inviter, amount=150, reference=f"REFERRAL-{event.pk}"
            ).exists()
        )
        self.assertTrue(
            Notification.objects.filter(
                user=inviter_user, target_section="loyalty", target_id=str(event.pk)
            ).exists()
        )
        self.client.force_authenticate(inviter_user)
        loyalty = self.client.get("/api/v1/auth/loyalty/")
        self.assertEqual(loyalty.status_code, 200)
        self.assertEqual(len(loyalty.data["referral_history"]), 1)
        self.assertEqual(
            loyalty.data["referral_history"][0]["invited_phone"],
            "+989102222222",
        )

    def test_existing_user_can_login_with_otp(self):
        user = User.objects.create_user(
            phone="+989121111111", password="StrongPass123", is_verified=True
        )
        requested = self.client.post(
            "/api/v1/auth/otp/request/",
            {"phone": "09121111111", "purpose": "LOGIN"},
            format="json",
        )
        self.assertEqual(requested.status_code, 201)
        logged_in = self.client.post(
            "/api/v1/auth/otp/verify/",
            {
                "phone": "09121111111",
                "purpose": "LOGIN",
                "code": requested.data["debug_code"],
            },
            format="json",
        )
        self.assertEqual(logged_in.status_code, 200)
        self.assertEqual(str(logged_in.data["user"]["id"]), str(user.id))
        self.assertIn("access", logged_in.data)

    def test_registration_rejects_mismatched_password_confirmation(self):
        requested = self.client.post(
            "/api/v1/auth/otp/request/",
            {"phone": "09127777777", "purpose": "REGISTER"},
            format="json",
        )
        response = self.client.post(
            "/api/v1/auth/otp/verify/",
            {
                "phone": "09127777777",
                "purpose": "REGISTER",
                "code": requested.data["debug_code"],
                "first_name": "کاربر تست",
                "password": "StrongPass123!",
                "password_confirm": "DifferentPass123!",
            },
            format="json",
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("password_confirm", response.data)

    def test_registration_otp_is_not_issued_for_existing_phone(self):
        User.objects.create_user(
            phone="+989128888888", password="StrongPass123!", is_verified=True
        )
        response = self.client.post(
            "/api/v1/auth/otp/request/",
            {"phone": "09128888888", "purpose": "REGISTER"},
            format="json",
        )
        self.assertEqual(response.status_code, 409)

    def test_existing_user_can_login_with_password(self):
        User.objects.create_user(
            phone="+989122222222", password="StrongPass123", is_verified=True
        )
        response = self.client.post(
            "/api/v1/auth/password/login/",
            {"phone": "09122222222", "password": "StrongPass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_invalid_old_bearer_token_does_not_block_public_login(self):
        User.objects.create_user(
            phone="+989133333333", password="StrongPass123", is_verified=True
        )
        self.client.credentials(HTTP_AUTHORIZATION="Bearer expired-or-invalid-token")
        response = self.client.post(
            "/api/v1/auth/password/login/",
            {"phone": "09133333333", "password": "StrongPass123"},
            format="json",
        )
        self.assertEqual(response.status_code, 200)

    def test_forgot_password_with_otp_changes_password(self):
        user = User.objects.create_user(
            phone="+989144444444", password="OldPassword123", is_verified=True
        )
        requested = self.client.post(
            "/api/v1/auth/otp/request/",
            {"phone": "09144444444", "purpose": "RESET_PASSWORD"},
            format="json",
        )
        self.assertEqual(requested.status_code, 201)
        reset = self.client.post(
            "/api/v1/auth/password/reset/",
            {
                "phone": "09144444444",
                "code": requested.data["debug_code"],
                "new_password": "NewPassword123!",
                "new_password_confirm": "NewPassword123!",
            },
            format="json",
        )
        self.assertEqual(reset.status_code, 200)
        user.refresh_from_db()
        self.assertTrue(user.check_password("NewPassword123!"))

    def test_login_otp_is_not_issued_for_unknown_phone(self):
        response = self.client.post(
            "/api/v1/auth/otp/request/",
            {"phone": "09155555555", "purpose": "LOGIN"},
            format="json",
        )
        self.assertEqual(response.status_code, 404)

    def test_admin_password_login_repairs_legacy_local_phone_format(self):
        user = User.objects.create(
            phone="09024711777",
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=True,
            is_active=True,
            is_verified=True,
        )
        user.set_password("StrongPass123!")
        user.save(update_fields=("password", "updated_at"))

        response = self.client.post(
            "/api/v1/auth/password/login/",
            {
                "phone": "09024711777",
                "password": "StrongPass123!",
                "admin_panel": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, 200)
        user.refresh_from_db()
        self.assertEqual(user.phone, "+989024711777")
        self.assertEqual(response.data["user"]["role"], User.Role.ADMIN)
