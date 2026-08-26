from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("orders", "0008_populate_order_tracking_codes")]

    operations = [
        migrations.AddIndex(
            model_name="order",
            index=models.Index(
                fields=["user", "status", "-created_at"],
                name="order_user_status_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="order",
            index=models.Index(
                fields=["status", "-created_at"],
                name="order_status_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="returnrequest",
            index=models.Index(
                fields=["user", "status", "-created_at"],
                name="return_user_status_idx",
            ),
        ),
    ]
