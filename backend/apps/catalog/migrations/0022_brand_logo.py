from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0021_homesection_slider_interval_seconds")]

    operations = [
        migrations.AddField(
            model_name="brand",
            name="logo",
            field=models.ImageField(blank=True, upload_to="brands/"),
        ),
    ]
