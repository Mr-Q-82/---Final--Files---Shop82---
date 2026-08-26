from ._shared import *
from .identity import *
from .finance import *
from .support import *

class LoyaltyMission(TimeStampedModel):
    class Kind(models.TextChoices):
        PURCHASE = "PURCHASE", "خرید"
        REVIEW = "REVIEW", "ثبت نظر"
        REFERRAL = "REFERRAL", "دعوت دوست"
        PROFILE = "PROFILE", "تکمیل پروفایل"
    title = models.CharField(max_length=160)
    kind = models.CharField(max_length=12, choices=Kind.choices)
    target = models.PositiveIntegerField(default=1)
    reward_points = models.PositiveIntegerField(default=10)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)


class LoyaltyPointEntry(TimeStampedModel):
    profile = models.ForeignKey(LoyaltyProfile, on_delete=models.CASCADE, related_name="point_entries")
    amount = models.IntegerField()
    reason = models.CharField(max_length=180)
    reference = models.CharField(max_length=100, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)


class ReferralEvent(models.Model):
    """Immutable audit record for a referral accepted during registration."""

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    inviter = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="successful_referrals",
    )
    invited_user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="registration_referral",
    )
    referral_code = models.CharField(max_length=16, db_index=True)
    inviter_points_awarded = models.PositiveIntegerField(default=50)
    invited_points_awarded = models.PositiveIntegerField(default=0)
    admin_note = models.CharField(max_length=240, blank=True)

    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["inviter", "-created_at"], name="referral_inviter_idx"),
        ]


class UserSession(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="active_sessions")
    refresh_jti = models.CharField(max_length=80, unique=True)
    device_name = models.CharField(max_length=140, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    last_seen_at = models.DateTimeField(default=timezone.now)
    revoked_at = models.DateTimeField(null=True, blank=True)


class AdminRecoveryCode(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="recovery_codes")
    code_hash = models.CharField(max_length=128)
    used_at = models.DateTimeField(null=True, blank=True)

    @classmethod
    def issue_batch(cls, user, count=10):
        cls.objects.filter(user=user, used_at__isnull=True).delete()
        plain_codes = [secrets.token_hex(5).upper() for _ in range(count)]
        cls.objects.bulk_create([
            cls(user=user, code_hash=make_password(code)) for code in plain_codes
        ])
        return plain_codes

    class Meta:
        indexes = [models.Index(fields=("user", "used_at"), name="recovery_user_used_idx")]
