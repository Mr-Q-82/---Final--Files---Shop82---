from django.db import migrations, models


def normalize_order_data(apps, schema_editor):
    DiscountCode = apps.get_model("orders", "DiscountCode")
    Order = apps.get_model("orders", "Order")
    Payment = apps.get_model("orders", "PaymentTransaction")
    DiscountCode.objects.filter(percent__gt=100).update(percent=100)
    seen = set()
    for item in Order.objects.exclude(idempotency_key="").order_by("created_at").iterator():
        key = (item.user_id, item.idempotency_key)
        if key in seen:
            item.idempotency_key = ""
            item.save(update_fields=["idempotency_key"])
        seen.add(key)
    seen = set()
    for item in Payment.objects.exclude(authority="").order_by("created_at").iterator():
        key = (item.provider, item.authority)
        if key in seen:
            item.authority = ""
            item.save(update_fields=["authority"])
        seen.add(key)


class Migration(migrations.Migration):
    dependencies = [("orders", "0011_orderitem_customization")]
    operations = [
        migrations.AddField(model_name="order", name="expires_at", field=models.DateTimeField(blank=True, db_index=True, null=True)),
        migrations.RunPython(normalize_order_data, migrations.RunPython.noop),
        migrations.AddConstraint(model_name="discountcode", constraint=models.CheckConstraint(condition=models.Q(("percent__lte", 100)), name="discount_percent_lte_100")),
        migrations.AddConstraint(model_name="discountcode", constraint=models.CheckConstraint(condition=models.Q(("expires_at__isnull", True), ("starts_at__isnull", True), _connector="OR") | models.Q(("expires_at__gt", models.F("starts_at"))), name="discount_valid_date_range")),
        migrations.AddConstraint(model_name="order", constraint=models.UniqueConstraint(condition=models.Q(("idempotency_key", ""), _negated=True), fields=("user", "idempotency_key"), name="unique_user_order_idempotency")),
        migrations.AddConstraint(model_name="orderitem", constraint=models.CheckConstraint(condition=models.Q(("quantity__gt", 0)), name="order_item_quantity_gt_zero")),
        migrations.AddConstraint(model_name="orderitem", constraint=models.CheckConstraint(condition=models.Q(("line_total__gte", 0)), name="order_item_total_nonnegative")),
        migrations.AddConstraint(model_name="paymenttransaction", constraint=models.CheckConstraint(condition=models.Q(("amount__gt", 0)), name="payment_amount_gt_zero")),
        migrations.AddConstraint(model_name="paymenttransaction", constraint=models.UniqueConstraint(condition=models.Q(("authority", ""), _negated=True), fields=("provider", "authority"), name="unique_provider_authority")),
    ]
