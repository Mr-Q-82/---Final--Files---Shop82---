from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0037_extended_storage_laptop_parts_catalog"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="image",
            field=models.ImageField(blank=True, upload_to="categories/"),
        ),
    ]
