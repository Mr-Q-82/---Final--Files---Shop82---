import uuid
from django.db import migrations, models


def create_database_slides(apps, schema_editor):
    HeroSlide = apps.get_model("catalog", "HeroSlide")
    defaults = [
        ("محصول موجود", "تنوع واقعی فروشگاه", "PRODUCTS", "", 10),
        ("مشتری راضی", "کاربران فعال فروشگاه", "CUSTOMERS", "", 20),
        ("پشتیبانی", "پاسخ‌گویی در تمام روزهای هفته", "CUSTOM", "۲۴/۷", 30),
    ]
    for title, subtitle, metric_type, custom_value, sort_order in defaults:
        HeroSlide.objects.get_or_create(
            title=title,
            defaults={
                "subtitle": subtitle,
                "metric_type": metric_type,
                "custom_value": custom_value,
                "sort_order": sort_order,
                "is_active": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0011_sitesetting_newslettersubscriber"),
    ]

    operations = [
        migrations.CreateModel(
            name="NewsletterCampaign",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=180)),
                ("message", models.TextField()),
                ("sent_at", models.DateTimeField(blank=True, null=True)),
                ("sent_count", models.PositiveIntegerField(default=0)),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.CreateModel(
            name="HeroSlide",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("title", models.CharField(max_length=160)),
                ("subtitle", models.CharField(blank=True, max_length=260)),
                ("metric_type", models.CharField(choices=[("PRODUCTS", "تعداد محصولات موجود"), ("CUSTOMERS", "تعداد مشتریان"), ("CUSTOM", "مقدار دلخواه")], default="CUSTOM", max_length=20)),
                ("custom_value", models.CharField(blank=True, max_length=80)),
                ("target", models.CharField(blank=True, max_length=250)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ("sort_order", "created_at")},
        ),
        migrations.RunPython(create_database_slides, migrations.RunPython.noop),
    ]
