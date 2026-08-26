from django.db import migrations


def ensure_default_product_customization(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Group = apps.get_model("catalog", "CustomizationGroup")
    Option = apps.get_model("catalog", "CustomizationOption")

    for category in Category.objects.all().iterator():
        usable_group = Group.objects.filter(
            category=category,
            is_active=True,
            options__is_active=True,
        ).distinct().first()
        if usable_group:
            continue

        group, _ = Group.objects.get_or_create(
            category=category,
            catalog="BOTH",
            code="built-in-default",
            defaults={
                "name": "نسخه محصول",
                "help_text": "نسخه مناسب را براساس نیاز خود انتخاب کنید.",
                "applies_to_all_products": True,
                "is_required": True,
                "sort_order": 0,
                "is_active": True,
            },
        )
        group.is_active = True
        group.applies_to_all_products = True
        group.is_required = True
        group.save(update_fields=("is_active", "applies_to_all_products", "is_required"))

        for order, (name, delta) in enumerate((
            ("استاندارد", 0),
            ("حرفه‌ای", 1_000_000),
            ("پریمیوم", 2_500_000),
        )):
            Option.objects.get_or_create(
                group=group,
                name=name,
                defaults={
                    "value": name,
                    "price_delta": delta,
                    "is_default": order == 0,
                    "is_active": True,
                    "sort_order": order,
                },
            )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0042_backfill_usage_profiles")]
    operations = [
        migrations.RunPython(
            ensure_default_product_customization,
            migrations.RunPython.noop,
        )
    ]
