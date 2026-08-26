import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0022_brand_logo")]

    operations = [
        migrations.CreateModel(
            name="PromoBanner",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4, editable=False, primary_key=True, serialize=False
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(blank=True, max_length=160)),
                ("subtitle", models.CharField(blank=True, max_length=260)),
                ("image", models.ImageField(upload_to="home/banners/")),
                ("target", models.CharField(blank=True, max_length=250)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ("sort_order", "created_at")},
        )
    ]
