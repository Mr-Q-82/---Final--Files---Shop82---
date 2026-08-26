from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0032_category_product_recommendation")]

    operations = [
        migrations.AddField(
            model_name="sitesetting",
            name="hero_slogan",
            field=models.CharField(
                default="هوشمند انتخاب کن؛ قدرتمندتر زندگی کن",
                max_length=240,
            ),
        ),
        migrations.AddField(
            model_name="sitesetting",
            name="hero_laptop_image",
            field=models.ImageField(blank=True, upload_to="site/hero-paths/"),
        ),
        migrations.AddField(
            model_name="sitesetting",
            name="hero_components_image",
            field=models.ImageField(blank=True, upload_to="site/hero-paths/"),
        ),
        migrations.AddField(
            model_name="sitesetting",
            name="hero_gaming_image",
            field=models.ImageField(blank=True, upload_to="site/hero-paths/"),
        ),
    ]
