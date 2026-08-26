from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("operations", "0002_communicationlog")]

    operations = [
        migrations.AddIndex(
            model_name="inventorymovement",
            index=models.Index(
                fields=["product", "-created_at"],
                name="inventory_product_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="inventorymovement",
            index=models.Index(
                fields=["movement_type", "-created_at"],
                name="inventory_type_idx",
            ),
        ),
    ]
