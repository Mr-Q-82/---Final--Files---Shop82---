from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0038_category_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="category",
            name="gaming_image",
            field=models.ImageField(blank=True, upload_to="categories/gaming/"),
        ),
    ]
