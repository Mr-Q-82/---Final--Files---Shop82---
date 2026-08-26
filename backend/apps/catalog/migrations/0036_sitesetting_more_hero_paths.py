from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0035_heroslide_product")]

    operations = [
        migrations.AddField(
            model_name="sitesetting",
            name="hero_monitor_image",
            field=models.ImageField(blank=True, upload_to="site/hero-paths/"),
        ),
        migrations.AddField(
            model_name="sitesetting",
            name="hero_audio_image",
            field=models.ImageField(blank=True, upload_to="site/hero-paths/"),
        ),
    ]
