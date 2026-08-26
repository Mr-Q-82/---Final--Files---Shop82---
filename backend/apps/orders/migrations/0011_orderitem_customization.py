from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("orders", "0010_order_delivery_slot_order_gateway_paid_amount_and_more")]
    operations = [
        migrations.AddField(model_name="orderitem", name="customization_snapshot", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="orderitem", name="customization_price", field=models.BigIntegerField(default=0)),
    ]
