from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("catalog", "0034_update_home_hero_title")]

    operations = [
        migrations.AddField(
            model_name="heroslide",
            name="product",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="hero_slides",
                to="catalog.product",
            ),
        ),
    ]
