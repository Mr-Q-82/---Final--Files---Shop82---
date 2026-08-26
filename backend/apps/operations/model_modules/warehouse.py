from ._shared import *
from .procurement import *
from .engagement import *

class Warehouse(TimeStampedModel):
    name = models.CharField(max_length=140)
    code = models.CharField(max_length=30, unique=True)
    address = models.TextField(blank=True)
    is_default = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)


class WarehouseStock(TimeStampedModel):
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, related_name="stocks")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="warehouse_stocks")
    quantity = models.PositiveIntegerField(default=0)
    reserved_quantity = models.PositiveIntegerField(default=0)
    reorder_point = models.PositiveIntegerField(default=0)
    average_cost = models.PositiveBigIntegerField(default=0)
    @property
    def sellable_quantity(self):
        return max(0, self.quantity - self.reserved_quantity)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("warehouse", "product"), name="unique_warehouse_product"),
            models.CheckConstraint(condition=models.Q(reserved_quantity__lte=models.F("quantity")), name="warehouse_reserved_lte_quantity"),
        ]


class StockTransfer(TimeStampedModel):
    class Status(models.TextChoices):
        DRAFT = "DRAFT", "پیش‌نویس"
        IN_TRANSIT = "IN_TRANSIT", "در مسیر"
        RECEIVED = "RECEIVED", "دریافت‌شده"
        CANCELED = "CANCELED", "لغوشده"
    source = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="outgoing_transfers")
    destination = models.ForeignKey(Warehouse, on_delete=models.PROTECT, related_name="incoming_transfers")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.DRAFT)
    reference = models.CharField(max_length=80, blank=True)
    note = models.TextField(blank=True)
    class Meta:
        constraints = [
            models.CheckConstraint(condition=~models.Q(source=models.F("destination")), name="stock_transfer_distinct_warehouses"),
            models.CheckConstraint(condition=models.Q(quantity__gt=0), name="stock_transfer_quantity_gt_zero"),
        ]


class ProductSupplier(TimeStampedModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="suppliers")
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="products")
    supplier_sku = models.CharField(max_length=80, blank=True)
    purchase_price = models.PositiveBigIntegerField(default=0)
    lead_time_days = models.PositiveSmallIntegerField(default=0)
    is_preferred = models.BooleanField(default=False)
    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("product", "supplier"), name="unique_product_supplier")
        ]


class SupplierLedger(TimeStampedModel):
    class Type(models.TextChoices):
        PURCHASE = "PURCHASE", "خرید"
        PAYMENT = "PAYMENT", "تسویه"
        CREDIT = "CREDIT", "بستانکاری"
    supplier = models.ForeignKey(Supplier, on_delete=models.PROTECT, related_name="ledger")
    entry_type = models.CharField(max_length=12, choices=Type.choices)
    amount = models.PositiveBigIntegerField()
    reference = models.CharField(max_length=100, blank=True)
    description = models.CharField(max_length=240, blank=True)


class Expense(TimeStampedModel):
    title = models.CharField(max_length=180)
    category = models.CharField(max_length=80, default="عمومی")
    amount = models.PositiveBigIntegerField()
    incurred_at = models.DateField(default=timezone.localdate)
    reference = models.CharField(max_length=100, blank=True)
    note = models.TextField(blank=True)


class ShippingRule(TimeStampedModel):
    class Method(models.TextChoices):
        NORMAL = "NORMAL", "عادی"
        EXPRESS = "EXPRESS", "سریع"
        SPECIAL = "SPECIAL", "ویژه"
    title = models.CharField(max_length=140)
    method = models.CharField(max_length=12, choices=Method.choices)
    provinces = models.JSONField(default=list, blank=True)
    min_weight = models.PositiveIntegerField(default=0)
    max_weight = models.PositiveIntegerField(default=0)
    min_order_amount = models.PositiveBigIntegerField(default=0)
    base_cost = models.PositiveBigIntegerField(default=0)
    cost_per_kg = models.PositiveBigIntegerField(default=0)
    free_above = models.PositiveBigIntegerField(default=0)
    estimated_days = models.PositiveSmallIntegerField(default=3)
    is_active = models.BooleanField(default=True)


class DeliverySlot(TimeStampedModel):
    title = models.CharField(max_length=120)
    date = models.DateField()
    starts_at = models.TimeField()
    ends_at = models.TimeField()
    capacity = models.PositiveIntegerField(default=20)
    reserved_count = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(ends_at__gt=models.F("starts_at")), name="delivery_slot_valid_time"),
            models.CheckConstraint(condition=models.Q(reserved_count__lte=models.F("capacity")), name="delivery_reserved_lte_capacity"),
        ]


class MessageTemplate(TimeStampedModel):
    class Channel(models.TextChoices):
        SMS = "SMS", "پیامک"
        EMAIL = "EMAIL", "ایمیل"
        NOTIFICATION = "NOTIFICATION", "اعلان"
    key = models.SlugField(max_length=80, unique=True)
    title = models.CharField(max_length=180)
    channel = models.CharField(max_length=16, choices=Channel.choices)
    subject = models.CharField(max_length=180, blank=True)
    body = models.TextField(help_text="متغیرها را به شکل {{name}} بنویسید.")
    is_active = models.BooleanField(default=True)


class ScheduledMessage(TimeStampedModel):
    template = models.ForeignKey(MessageTemplate, on_delete=models.PROTECT, related_name="schedules")
    audience = models.CharField(max_length=40, default="ALL")
    recipient = models.CharField(max_length=180, blank=True)
    context = models.JSONField(default=dict, blank=True)
    scheduled_at = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    is_canceled = models.BooleanField(default=False)
