from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0020_flashsale_special_price_default_menu")]

    operations = [
        migrations.AddField(
            model_name="homesection",
            name="slider_interval_seconds",
            field=models.PositiveSmallIntegerField(default=5),
        ),
    ]
