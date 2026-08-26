from django.db import migrations, models
from datetime import time, timedelta


def normalize_operations_data(apps, schema_editor):
    PromotionRule = apps.get_model("operations", "PromotionRule")
    WarehouseStock = apps.get_model("operations", "WarehouseStock")
    DeliverySlot = apps.get_model("operations", "DeliverySlot")
    StockTransfer = apps.get_model("operations", "StockTransfer")
    PromotionRule.objects.filter(percent__gt=100).update(percent=100)
    StockTransfer.objects.filter(source_id=models.F("destination_id")).delete()
    StockTransfer.objects.filter(quantity=0).delete()
    for item in PromotionRule.objects.exclude(starts_at=None).exclude(ends_at=None).iterator():
        if item.ends_at <= item.starts_at:
            item.ends_at = item.starts_at + timedelta(seconds=1)
            item.save(update_fields=["ends_at"])
    for item in WarehouseStock.objects.filter(reserved_quantity__gt=models.F("quantity")).iterator():
        item.reserved_quantity = item.quantity
        item.save(update_fields=["reserved_quantity"])
    for item in DeliverySlot.objects.all().iterator():
        fields = []
        if item.ends_at <= item.starts_at:
            if item.starts_at >= time(23, 59, 59):
                item.starts_at = time(23, 58, 59)
                fields.append("starts_at")
            item.ends_at = time(23, 59, 59)
            fields.append("ends_at")
        if item.reserved_count > item.capacity:
            item.reserved_count = item.capacity
            fields.append("reserved_count")
        if fields:
            item.save(update_fields=fields)


class Migration(migrations.Migration):
    dependencies = [("operations", "0004_deliveryslot_expense_messagetemplate_shippingrule_and_more")]
    operations = [
        migrations.RunPython(normalize_operations_data, migrations.RunPython.noop),
        migrations.AddConstraint(model_name="promotionrule", constraint=models.CheckConstraint(condition=models.Q(("percent__lte", 100)), name="promotion_percent_lte_100")),
        migrations.AddConstraint(model_name="promotionrule", constraint=models.CheckConstraint(condition=models.Q(("ends_at__isnull", True), ("starts_at__isnull", True), _connector="OR") | models.Q(("ends_at__gt", models.F("starts_at"))), name="promotion_valid_date_range")),
        migrations.AddConstraint(model_name="warehousestock", constraint=models.CheckConstraint(condition=models.Q(("reserved_quantity__lte", models.F("quantity"))), name="warehouse_reserved_lte_quantity")),
        migrations.AddConstraint(model_name="stocktransfer", constraint=models.CheckConstraint(condition=models.Q(("source", models.F("destination")), _negated=True), name="stock_transfer_distinct_warehouses")),
        migrations.AddConstraint(model_name="stocktransfer", constraint=models.CheckConstraint(condition=models.Q(("quantity__gt", 0)), name="stock_transfer_quantity_gt_zero")),
        migrations.AddConstraint(model_name="deliveryslot", constraint=models.CheckConstraint(condition=models.Q(("ends_at__gt", models.F("starts_at"))), name="delivery_slot_valid_time")),
        migrations.AddConstraint(model_name="deliveryslot", constraint=models.CheckConstraint(condition=models.Q(("reserved_count__lte", models.F("capacity"))), name="delivery_reserved_lte_capacity")),
    ]
