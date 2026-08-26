from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import (
    AddressViewSet, AdminAuditLogViewSet, AdminNotificationViewSet, AdminUserViewSet,
    EmailRequestView, EmailVerifyView, LoyaltySettingView, LoyaltyView, MeView, NotificationViewSet,
    OTPRequestView, OTPVerifyView, PasswordChangeView, PasswordLoginView,
    PasswordResetView, StaffPermissionViewSet, SupportTicketViewSet, WalletView,
    LoyaltyMissionViewSet, LoyaltyPointEntryViewSet, ReferralEventViewSet,
    UserSessionViewSet, CookieTokenRefreshView, LogoutView, AdminRecoveryCodeView,
)

router = DefaultRouter()
router.register("addresses", AddressViewSet, basename="addresses")
router.register("admin/users", AdminUserViewSet, basename="admin-users")
router.register("notifications", NotificationViewSet, basename="notifications")
router.register("admin/notifications", AdminNotificationViewSet, basename="admin-notifications")
router.register("tickets", SupportTicketViewSet, basename="tickets")
router.register("admin/staff-permissions", StaffPermissionViewSet, basename="staff-permissions")
router.register("admin/audit-logs", AdminAuditLogViewSet, basename="audit-logs")
router.register("loyalty-missions", LoyaltyMissionViewSet, basename="loyalty-missions")
router.register("loyalty-points", LoyaltyPointEntryViewSet, basename="loyalty-points")
router.register("admin/referrals", ReferralEventViewSet, basename="admin-referrals")
router.register("sessions", UserSessionViewSet, basename="sessions")

urlpatterns = [
    path("otp/request/", OTPRequestView.as_view(), name="otp-request"),
    path("otp/verify/", OTPVerifyView.as_view(), name="otp-verify"),
    path("password/login/", PasswordLoginView.as_view(), name="password-login"),
    path("password/reset/", PasswordResetView.as_view(), name="password-reset"),
    path("token/refresh/", CookieTokenRefreshView.as_view(), name="cookie-token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("admin/recovery-codes/", AdminRecoveryCodeView.as_view(), name="admin-recovery-codes"),
    path("me/", MeView.as_view(), name="me"),
    path("password/change/", PasswordChangeView.as_view(), name="password-change"),
    path("email/request/", EmailRequestView.as_view(), name="email-request"),
    path("email/verify/", EmailVerifyView.as_view(), name="email-verify"),
    path("wallet/", WalletView.as_view(), name="wallet"),
    path("loyalty/", LoyaltyView.as_view(), name="loyalty"),
    path("admin/loyalty-settings/", LoyaltySettingView.as_view(), name="loyalty-settings"),
    path("", include(router.urls)),
]
