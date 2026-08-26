from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0006_returnrequest_inventory_restocked_and_tracking_constraint"),
    ]

    operations = [
        migrations.AddField(
            model_name="returnrequest",
            name="refund_paid",
            field=models.BooleanField(default=False),
        ),
    ]
