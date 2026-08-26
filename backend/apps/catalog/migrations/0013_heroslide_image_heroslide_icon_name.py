from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0012_heroslide_newslettercampaign")]

    operations = [
        migrations.AddField(
            model_name="heroslide",
            name="icon_name",
            field=models.CharField(blank=True, default="gpu", max_length=40),
        ),
        migrations.AddField(
            model_name="heroslide",
            name="image",
            field=models.ImageField(blank=True, upload_to="hero/slides/"),
        ),
    ]
