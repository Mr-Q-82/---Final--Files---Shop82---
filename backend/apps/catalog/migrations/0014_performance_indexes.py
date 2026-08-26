from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0013_heroslide_image_heroslide_icon_name")]

    operations = [
        migrations.AddIndex(
            model_name="product",
            index=models.Index(
                fields=["is_active", "stock", "-created_at"],
                name="product_available_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="product",
            index=models.Index(
                fields=["is_active", "-sold_count"],
                name="product_best_sell_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="productreview",
            index=models.Index(
                fields=["product", "status", "-created_at"],
                name="review_product_status_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="flashsale",
            index=models.Index(
                fields=["product", "is_active", "starts_at", "ends_at"],
                name="flash_product_active_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="stockalert",
            index=models.Index(
                fields=["product", "is_notified"],
                name="stock_alert_notify_idx",
            ),
        ),
    ]
