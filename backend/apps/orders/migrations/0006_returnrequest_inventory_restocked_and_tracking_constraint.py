from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0005_order_inventory_committed"),
    ]

    operations = [
        migrations.AddField(
            model_name="returnrequest",
            name="inventory_restocked",
            field=models.BooleanField(default=False),
        ),
        migrations.AddConstraint(
            model_name="order",
            constraint=models.UniqueConstraint(
                condition=~models.Q(tracking_code=""),
                fields=("tracking_code",),
                name="unique_nonempty_order_tracking_code",
            ),
        ),
    ]
