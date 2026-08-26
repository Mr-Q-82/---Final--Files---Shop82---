from ._shared import *

class Supplier(TimeStampedModel):
    name = models.CharField(max_length=180)
    contact_name = models.CharField(max_length=140, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    credit_limit = models.PositiveBigIntegerField(default=0)
    current_balance = models.BigIntegerField(default=0)


class InventoryMovement(TimeStampedModel):
    class Type(models.TextChoices):
        IN = "IN", "ورود"
        OUT = "OUT", "خروج"
        ADJUST = "ADJUST", "اصلاح"
        RESERVE = "RESERVE", "رزرو"
        RELEASE = "RELEASE", "آزادسازی"
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="inventory_movements")
    movement_type = models.CharField(max_length=10, choices=Type.choices)
    quantity = models.IntegerField()
    stock_after = models.PositiveIntegerField(default=0)
    reason = models.CharField(max_length=240)
    reference = models.CharField(max_length=100, blank=True)
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["product", "-created_at"], name="inventory_product_idx"),
            models.Index(fields=["movement_type", "-created_at"], name="inventory_type_idx"),
        ]


class PurchaseOrder(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "پیش‌نویس"
        ORDERED = "ORDERED", "سفارش داده‌شده"
        RECEIVED = "RECEIVED", "دریافت‌شده"
        CANCELED = "CANCELED", "لغوشده"
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="purchase_orders")
    status = models.CharField(max_length=12, choices=Status.choices, default=Status.DRAFT)
    expected_at = models.DateTimeField(null=True, blank=True)
    total_cost = models.PositiveBigIntegerField(default=0)
    note = models.TextField(blank=True)


class PurchaseOrderItem(TimeStampedModel):
    purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_cost = models.PositiveBigIntegerField()


class ProductBundle(TimeStampedModel):
    title = models.CharField(max_length=180)
    slug = models.SlugField(unique=True)
    price = models.PositiveBigIntegerField()
    is_active = models.BooleanField(default=True)


class BundleItem(TimeStampedModel):
    bundle = models.ForeignKey(ProductBundle, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    class Meta:
        constraints = [models.UniqueConstraint(fields=("bundle", "product"), name="unique_bundle_product")]


class GiftCard(TimeStampedModel):
    code = models.CharField(max_length=32, unique=True, blank=True)
    initial_balance = models.PositiveBigIntegerField()
    balance = models.PositiveBigIntegerField()
    expires_at = models.DateTimeField(null=True, blank=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    def save(self, *args, **kwargs):
        if not self.code:
            self.code = "GIFT-" + secrets.token_hex(5).upper()
        super().save(*args, **kwargs)


