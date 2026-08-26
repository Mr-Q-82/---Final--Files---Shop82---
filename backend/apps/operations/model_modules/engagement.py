from ._shared import *
from .procurement import *

class PromotionRule(TimeStampedModel):
    class Kind(models.TextChoices):
        FIRST_BUY = "FIRST_BUY", "خرید اول"
        FREE_SHIPPING = "FREE_SHIPPING", "ارسال رایگان"
        CATEGORY = "CATEGORY", "دسته‌بندی"
        BRAND = "BRAND", "برند"
        BUY_X_GET_Y = "BUY_X_GET_Y", "چندتایی"
    title = models.CharField(max_length=180)
    kind = models.CharField(max_length=20, choices=Kind.choices)
    percent = models.PositiveSmallIntegerField(default=0)
    fixed_amount = models.PositiveBigIntegerField(default=0)
    conditions = models.JSONField(default=dict, blank=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(percent__lte=100), name="promotion_percent_lte_100"),
            models.CheckConstraint(condition=models.Q(ends_at__isnull=True) | models.Q(starts_at__isnull=True) | models.Q(ends_at__gt=models.F("starts_at")), name="promotion_valid_date_range"),
        ]


class InventoryReservation(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    expires_at = models.DateTimeField()
    converted_order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    @property
    def expired(self):
        return self.expires_at <= timezone.now()


class AbandonedCart(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="abandoned_cart")
    items = models.JSONField(default=list)
    total = models.PositiveBigIntegerField(default=0)
    recovered_at = models.DateTimeField(null=True, blank=True)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)


class ShipmentEvent(TimeStampedModel):
    class Status(models.TextChoices):
        PACKING = "PACKING", "آماده‌سازی"
        POSTED = "POSTED", "تحویل پست"
        IN_TRANSIT = "IN_TRANSIT", "در مسیر"
        DELIVERED = "DELIVERED", "تحویل‌شده"
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="shipment_events")
    status = models.CharField(max_length=16, choices=Status.choices)
    location = models.CharField(max_length=180, blank=True)
    description = models.CharField(max_length=300, blank=True)


class AdminTwoFactor(TimeStampedModel):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="admin_two_factor")
    is_enabled = models.BooleanField(default=False)
    last_verified_at = models.DateTimeField(null=True, blank=True)


class BehaviorEvent(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    event_type = models.CharField(max_length=50)
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    session_key = models.CharField(max_length=80, blank=True)


class ServiceHealth(TimeStampedModel):
    service = models.CharField(max_length=80)
    is_healthy = models.BooleanField(default=True)
    latency_ms = models.PositiveIntegerField(default=0)
    message = models.CharField(max_length=300, blank=True)
    class Meta:
        ordering = ("-created_at",)


class CommunicationLog(TimeStampedModel):
    class Channel(models.TextChoices):
        SMS = "SMS", "پیامک"
        EMAIL = "EMAIL", "ایمیل"
        NOTIFICATION = "NOTIFICATION", "اعلان"
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    recipient = models.CharField(max_length=180)
    channel = models.CharField(max_length=16, choices=Channel.choices)
    subject = models.CharField(max_length=180, blank=True)
    message = models.TextField()
    is_success = models.BooleanField(default=True)
    provider_response = models.JSONField(default=dict, blank=True)
    class Meta:
        ordering = ("-created_at",)


