from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0024_product_is_gaming_default_gaming_menu")]

    operations = [
        migrations.AddField(
            model_name="heroslide",
            name="placement",
            field=models.CharField(
                choices=[("HOME", "صفحه اصلی"), ("GAMING", "صفحه گیمینگ")],
                default="HOME",
                max_length=16,
            ),
        ),
        migrations.AddField(
            model_name="promobanner",
            name="placement",
            field=models.CharField(
                choices=[("HOME", "صفحه اصلی"), ("GAMING", "صفحه گیمینگ")],
                default="HOME",
                max_length=16,
            ),
        ),
    ]
