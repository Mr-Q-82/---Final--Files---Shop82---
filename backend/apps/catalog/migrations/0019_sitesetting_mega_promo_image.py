from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0018_homesection_product_controls")]
    operations = [
        migrations.AddField(
            model_name="sitesetting",
            name="mega_promo_image",
            field=models.ImageField(blank=True, upload_to="site/mega-menu/"),
        ),
    ]
