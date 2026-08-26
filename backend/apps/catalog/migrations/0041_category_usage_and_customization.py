import uuid
import django.db.models.deletion
from django.db import migrations, models


def seed_profiles_and_options(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Usage = apps.get_model("catalog", "CategoryUsageProfile")
    Group = apps.get_model("catalog", "CustomizationGroup")
    Option = apps.get_model("catalog", "CustomizationOption")

    usage_map = {
        "لپ": ["گیمینگ", "برنامه‌نویسی", "روزمره", "مهندسی", "اداری", "طراحی و تولید محتوا", "دانشجویی"],
        "کیس": ["گیمینگ", "رندرینگ", "مهندسی", "اداری", "برنامه‌نویسی", "خانگی"],
        "مانیتور": ["گیمینگ", "طراحی", "اداری", "برنامه‌نویسی"],
    }
    group_map = {
        "لپ": [
            ("پردازنده", "cpu", [("Core i5", 0), ("Core i7", 8_000_000), ("Core i9", 18_000_000)]),
            ("حافظه RAM", "ram", [("۸ گیگابایت", 0), ("۱۶ گیگابایت", 3_500_000), ("۳۲ گیگابایت", 8_500_000)]),
            ("حافظه ذخیره‌سازی", "storage", [("SSD 512GB", 0), ("SSD 1TB", 4_500_000), ("SSD 2TB", 10_000_000)]),
        ],
        "کیس": [
            ("پردازنده", "cpu", [("Core i5", 0), ("Core i7", 7_500_000), ("Ryzen 7", 8_000_000)]),
            ("حافظه RAM", "ram", [("۱۶ گیگابایت", 0), ("۳۲ گیگابایت", 6_000_000), ("۶۴ گیگابایت", 15_000_000)]),
            ("حافظه ذخیره‌سازی", "storage", [("SSD 512GB", 0), ("SSD 1TB", 4_000_000), ("SSD 2TB", 9_500_000)]),
        ],
        "RAM": [("ظرفیت", "capacity", [("۸ گیگابایت", 0), ("۱۶ گیگابایت", 2_500_000), ("۳۲ گیگابایت", 7_000_000)])],
        "SSD": [("ظرفیت", "capacity", [("۵۱۲ گیگابایت", 0), ("۱ ترابایت", 3_000_000), ("۲ ترابایت", 8_000_000)])],
        "پردازنده": [("رده عملکرد", "performance", [("استاندارد", 0), ("حرفه‌ای", 5_000_000), ("پرچمدار", 12_000_000)])],
        "گرافیک": [("حافظه گرافیکی", "vram", [("۸ گیگابایت", 0), ("۱۲ گیگابایت", 7_000_000), ("۱۶ گیگابایت", 15_000_000)])],
        "مانیتور": [("نرخ نوسازی", "refresh-rate", [("۷۵ هرتز", 0), ("۱۴۴ هرتز", 4_000_000), ("۲۴۰ هرتز", 10_000_000)])],
        "ماوس": [("نوع اتصال", "connection", [("باسیم", 0), ("بی‌سیم", 800_000), ("دوحالته", 1_400_000)])],
        "کیبورد": [("نوع کلید", "switch", [("ممبرین", 0), ("مکانیکال", 1_500_000), ("اپتیکال", 3_000_000)])],
        "هدفون": [("نوع اتصال", "connection", [("باسیم", 0), ("بلوتوث", 1_000_000), ("دانگل کم‌تأخیر", 2_000_000)])],
        "مادربرد": [("چیپست", "chipset", [("استاندارد", 0), ("حرفه‌ای", 4_000_000), ("اورکلاک", 9_000_000)])],
        "HDD": [("ظرفیت", "capacity", [("۱ ترابایت", 0), ("۲ ترابایت", 2_000_000), ("۴ ترابایت", 5_500_000)])],
        "باتری": [("ظرفیت", "capacity", [("استاندارد", 0), ("ظرفیت بالا", 1_500_000)])],
        "فن": [("اندازه و توان", "cooling", [("استاندارد", 0), ("حرفه‌ای", 1_200_000), ("پرفورمنس", 2_800_000)])],
    }
    for category in Category.objects.all():
        key = next((item for item in usage_map if item.lower() in category.name.lower()), None)
        labels = usage_map.get(key, ["استفاده روزمره", "حرفه‌ای", "اقتصادی"])
        for catalog in ("NORMAL", "GAMING"):
            for index, label in enumerate(labels):
                Usage.objects.get_or_create(
                    category=category, catalog=catalog, slug=f"usage-{catalog.lower()}-{index + 1}",
                    defaults={"name": label, "icon": "spark", "sort_order": index, "is_active": True},
                )
        config_key = next((item for item in group_map if item.lower() in category.name.lower()), None)
        fallback_groups = [("پیکربندی", "configuration", [("استاندارد", 0), ("حرفه‌ای", 1_000_000)])]
        for group_index, (name, code, options) in enumerate(group_map.get(config_key, fallback_groups)):
            group, _ = Group.objects.get_or_create(
                category=category, catalog="BOTH", code=code,
                defaults={"name": name, "sort_order": group_index, "is_required": True, "is_active": True},
            )
            for option_index, (option_name, delta) in enumerate(options):
                Option.objects.get_or_create(
                    group=group, name=option_name,
                    defaults={"price_delta": delta, "sort_order": option_index, "is_default": option_index == 0, "is_active": True},
                )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0040_sitesetting_page_presentation_controls")]
    operations = [
        migrations.CreateModel(
            name="CategoryUsageProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=120)),
                ("slug", models.SlugField(allow_unicode=True, max_length=160)),
                ("description", models.CharField(blank=True, max_length=260)),
                ("icon", models.CharField(blank=True, max_length=40)),
                ("catalog", models.CharField(choices=[("NORMAL", "فروشگاه عادی"), ("GAMING", "فروشگاه گیمینگ")], default="NORMAL", max_length=10)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="usage_profiles", to="catalog.category")),
                ("products", models.ManyToManyField(blank=True, related_name="usage_profiles", to="catalog.product")),
            ],
            options={"ordering": ("category_id", "catalog", "sort_order", "name")},
        ),
        migrations.CreateModel(
            name="CustomizationGroup",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=120)),
                ("code", models.SlugField(allow_unicode=True, max_length=80)),
                ("help_text", models.CharField(blank=True, max_length=260)),
                ("catalog", models.CharField(choices=[("BOTH", "هر دو فروشگاه"), ("NORMAL", "فروشگاه عادی"), ("GAMING", "فروشگاه گیمینگ")], default="BOTH", max_length=10)),
                ("applies_to_all_products", models.BooleanField(default=True)),
                ("is_required", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                ("category", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="customization_groups", to="catalog.category")),
                ("products", models.ManyToManyField(blank=True, related_name="customization_groups", to="catalog.product")),
            ],
            options={"ordering": ("category_id", "sort_order", "name")},
        ),
        migrations.CreateModel(
            name="CustomizationOption",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("name", models.CharField(max_length=140)),
                ("value", models.CharField(blank=True, max_length=180)),
                ("sku_suffix", models.SlugField(blank=True, max_length=50)),
                ("price_delta", models.BigIntegerField(default=0)),
                ("stock", models.PositiveIntegerField(blank=True, null=True)),
                ("specifications", models.JSONField(blank=True, default=dict)),
                ("is_default", models.BooleanField(default=False)),
                ("is_active", models.BooleanField(default=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("group", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="options", to="catalog.customizationgroup")),
            ],
            options={"ordering": ("group_id", "sort_order", "name")},
        ),
        migrations.AddConstraint(model_name="categoryusageprofile", constraint=models.UniqueConstraint(fields=("category", "catalog", "slug"), name="unique_category_catalog_usage_slug")),
        migrations.AddConstraint(model_name="customizationgroup", constraint=models.UniqueConstraint(fields=("category", "catalog", "code"), name="unique_category_catalog_custom_code")),
        migrations.AddConstraint(model_name="customizationoption", constraint=models.UniqueConstraint(fields=("group", "name"), name="unique_custom_option_name")),
        migrations.RunPython(seed_profiles_and_options, migrations.RunPython.noop),
    ]
