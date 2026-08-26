import secrets
import string
import uuid
from django.conf import settings
from django.db import models
from apps.common.models import TimeStampedModel
from apps.products.models import Product
from apps.common.uploads import validate_image_upload

class DiscountCode(TimeStampedModel):
    code = models.CharField(max_length=40, unique=True)
    percent = models.PositiveSmallIntegerField(default=0)
    fixed_amount = models.PositiveBigIntegerField(default=0)
    min_purchase = models.PositiveBigIntegerField(default=0)
    usage_limit = models.PositiveIntegerField(default=0, help_text="صفر یعنی بدون محدودیت")
    used_count = models.PositiveIntegerField(default=0)
    starts_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    def __str__(self):
        return self.code
    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(percent__lte=100), name="discount_percent_lte_100"),
            models.CheckConstraint(
                condition=models.Q(expires_at__isnull=True) | models.Q(starts_at__isnull=True) | models.Q(expires_at__gt=models.F("starts_at")),
                name="discount_valid_date_range",
            ),
        ]

class Order(TimeStampedModel):
    class Status(models.TextChoices):
        PENDING = "PENDING", "در انتظار پرداخت"
        PAID = "PAID", "پرداخت‌شده"
        PROCESSING = "PROCESSING", "در حال آماده‌سازی"
        SENT = "SENT", "ارسال‌شده"
        DELIVERED = "DELIVERED", "تحویل‌شده"
        CANCELED = "CANCELED", "لغوشده"
    number = models.CharField(max_length=24, unique=True, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.PENDING)
    address_snapshot = models.JSONField()
    subtotal = models.PositiveBigIntegerField(default=0)
    shipping_cost = models.PositiveBigIntegerField(default=0)
    tax_amount = models.PositiveBigIntegerField(default=0)
    wallet_paid_amount = models.PositiveBigIntegerField(default=0)
    gateway_paid_amount = models.PositiveBigIntegerField(default=0)
    shipping_method = models.CharField(max_length=20, blank=True)
    delivery_slot = models.ForeignKey(
        "operations.DeliverySlot", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="orders",
    )
    discount_amount = models.PositiveBigIntegerField(default=0)
    discount_code = models.CharField(max_length=40, blank=True)
    total = models.PositiveBigIntegerField(default=0)
    tracking_code = models.CharField(max_length=80, blank=True)
    idempotency_key = models.CharField(max_length=80, blank=True, db_index=True)
    inventory_committed = models.BooleanField(default=False)
    inventory_restored = models.BooleanField(default=False)
    paid_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True, db_index=True)
    note = models.TextField(blank=True)
    @classmethod
    def make_tracking_code(cls):
        """Build a human-readable, collision-safe tracking code."""
        alphabet = string.digits
        for _ in range(20):
            code = "TSK-" + "".join(secrets.choice(alphabet) for _ in range(16))
            if not cls.objects.filter(tracking_code=code).exists():
                return code
        return "TSK-" + uuid.uuid4().hex.upper()

    def ensure_tracking_code(self):
        if not self.tracking_code:
            self.tracking_code = self.make_tracking_code()
            self.save(update_fields=("tracking_code", "updated_at"))
        return self.tracking_code

    def save(self, *args, **kwargs):
        if not self.number:
            self.number = f"TS-{uuid.uuid4().hex[:10].upper()}"
        if not self.tracking_code:
            self.tracking_code = self.make_tracking_code()
        super().save(*args, **kwargs)
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("tracking_code",),
                condition=~models.Q(tracking_code=""),
                name="unique_nonempty_order_tracking_code",
            ),
            models.UniqueConstraint(
                fields=("user", "idempotency_key"),
                condition=~models.Q(idempotency_key=""),
                name="unique_user_order_idempotency",
            ),
        ]
        indexes = [
            models.Index(fields=["user", "status", "-created_at"], name="order_user_status_idx"),
            models.Index(fields=["status", "-created_at"], name="order_status_created_idx"),
        ]

class OrderItem(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    product_name = models.CharField(max_length=220)
    unit_price = models.PositiveBigIntegerField()
    quantity = models.PositiveIntegerField()
    line_total = models.PositiveBigIntegerField()
    variant_name = models.CharField(max_length=140, blank=True)
    variant_sku = models.CharField(max_length=70, blank=True)
    customization_snapshot = models.JSONField(default=list, blank=True)
    customization_price = models.BigIntegerField(default=0)
    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(quantity__gt=0), name="order_item_quantity_gt_zero"),
            models.CheckConstraint(condition=models.Q(line_total__gte=0), name="order_item_total_nonnegative"),
        ]

class PaymentTransaction(TimeStampedModel):
    class Status(models.TextChoices):
        CREATED = "CREATED", "ایجادشده"
        PENDING = "PENDING", "در انتظار پرداخت"
        SUCCEEDED = "SUCCEEDED", "موفق"
        FAILED = "FAILED", "ناموفق"
        CANCELED = "CANCELED", "لغوشده"
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="payments")
    provider = models.CharField(max_length=30, default="MOCK")
    amount = models.PositiveBigIntegerField()
    authority = models.CharField(max_length=100, blank=True, db_index=True)
    reference_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.CREATED)
    idempotency_key = models.CharField(max_length=100, unique=True)
    raw_response = models.JSONField(default=dict, blank=True)
    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(amount__gt=0), name="payment_amount_gt_zero"),
            models.UniqueConstraint(
                fields=("provider", "authority"),
                condition=~models.Q(authority=""),
                name="unique_provider_authority",
            ),
        ]

class OrderStatusHistory(TimeStampedModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    from_status = models.CharField(max_length=16, blank=True)
    to_status = models.CharField(max_length=16, choices=Order.Status.choices)
    note = models.CharField(max_length=300, blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    class Meta:
        ordering = ("created_at",)

class ReturnRequest(TimeStampedModel):
    class Status(models.TextChoices):
        REQUESTED = "REQUESTED", "ثبت‌شده"
        REVIEWING = "REVIEWING", "در حال بررسی"
        APPROVED = "APPROVED", "تأییدشده"
        REJECTED = "REJECTED", "ردشده"
        REFUNDED = "REFUNDED", "بازپرداخت‌شده"
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="return_requests")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="return_requests")
    reason = models.CharField(max_length=300)
    description = models.TextField(blank=True)
    image = models.ImageField(upload_to="returns/%Y/%m/", blank=True, validators=[validate_image_upload])
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.REQUESTED)
    refund_amount = models.PositiveBigIntegerField(default=0)
    refund_paid = models.BooleanField(default=False)
    admin_note = models.TextField(blank=True)
    inventory_restocked = models.BooleanField(default=False)
    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "status", "-created_at"], name="return_user_status_idx")
        ]
