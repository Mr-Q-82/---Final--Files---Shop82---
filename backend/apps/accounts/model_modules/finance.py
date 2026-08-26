from ._shared import *
from .identity import *

class Wallet(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wallet")
    balance = models.PositiveBigIntegerField(default=0)

class WalletTransaction(TimeStampedModel):
    class Type(models.TextChoices):
        CREDIT = "CREDIT", "واریز"
        DEBIT = "DEBIT", "برداشت"
        REFUND = "REFUND", "بازپرداخت"
        REWARD = "REWARD", "پاداش"
    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="transactions")
    transaction_type = models.CharField(max_length=10, choices=Type.choices)
    amount = models.PositiveBigIntegerField()
    description = models.CharField(max_length=240)
    reference = models.CharField(max_length=100, blank=True)
    idempotency_key = models.CharField(max_length=100, blank=True, null=True, unique=True)
    balance_before = models.PositiveBigIntegerField(default=0)
    balance_after = models.PositiveBigIntegerField()
    class Meta:
        ordering = ("-created_at",)
        constraints = [
            models.CheckConstraint(condition=models.Q(amount__gt=0), name="wallet_tx_amount_gt_zero"),
        ]

    def save(self, *args, **kwargs):
        if self.pk and not self._state.adding:
            raise ValueError("رکورد دفتر مالی پس از ثبت قابل ویرایش نیست.")
        if not self.balance_before:
            if self.transaction_type == self.Type.DEBIT:
                self.balance_before = self.balance_after + self.amount
            else:
                self.balance_before = max(0, self.balance_after - self.amount)
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("رکورد دفتر مالی قابل حذف نیست.")

class LoyaltyProfile(TimeStampedModel):
    class Level(models.TextChoices):
        BRONZE = "BRONZE", "برنزی"
        SILVER = "SILVER", "نقره‌ای"
        GOLD = "GOLD", "طلایی"
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="loyalty")
    points = models.PositiveIntegerField(default=0)
    level = models.CharField(max_length=10, choices=Level.choices, default=Level.BRONZE)
    referral_code = models.CharField(max_length=16, unique=True, blank=True)
    referred_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="referred_customers",
    )

    @classmethod
    def generate_referral_code(cls):
        """Return a hard-to-guess code that is not assigned to another account."""
        for _ in range(20):
            code = secrets.token_hex(4).upper()
            if not cls.objects.filter(referral_code=code).exists():
                return code
        # Practically unreachable, but keeps collision handling explicit.
        return secrets.token_hex(8).upper()

    def save(self, *args, **kwargs):
        if not self.referral_code:
            self.referral_code = self.generate_referral_code()
        silver_threshold, gold_threshold = 1_000, 5_000
        try:
            setting = LoyaltySetting.objects.order_by("created_at").first()
            if setting:
                silver_threshold = setting.silver_threshold
                gold_threshold = setting.gold_threshold
        except (OperationalError, ProgrammingError):
            pass
        if self.points >= gold_threshold:
            self.level = self.Level.GOLD
        elif self.points >= silver_threshold:
            self.level = self.Level.SILVER
        else:
            self.level = self.Level.BRONZE
        super().save(*args, **kwargs)


class LoyaltySetting(TimeStampedModel):
    purchase_step_amount = models.PositiveBigIntegerField(
        default=100_000, help_text="به‌ازای هر چند تومان خرید امتیاز داده شود"
    )
    points_per_step = models.PositiveIntegerField(default=1)
    toman_per_point = models.PositiveIntegerField(default=1_000)
    min_redeem_points = models.PositiveIntegerField(default=100)
    invited_user_bonus = models.PositiveIntegerField(default=100)
    inviter_bonus = models.PositiveIntegerField(default=50)
    silver_threshold = models.PositiveIntegerField(default=1_000)
    gold_threshold = models.PositiveIntegerField(default=5_000)
    review_bonus = models.PositiveIntegerField(default=20)
    referral_bonus = models.PositiveIntegerField(default=200)
    point_expiry_days = models.PositiveIntegerField(default=365)
    is_active = models.BooleanField(default=True)

    @classmethod
    def get_solo(cls):
        return cls.objects.order_by("created_at").first() or cls.objects.create()

