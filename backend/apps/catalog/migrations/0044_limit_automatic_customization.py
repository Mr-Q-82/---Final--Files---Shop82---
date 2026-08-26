from django.db import migrations


def category_is_configurable(category):
    value = f"{category.slug} {category.name}".lower()
    part_markers = (
        "hdd", "هارد", "battery", "باتری", "motherboard", "مادربرد",
        "برد", "fan", "cool", "فن", "کول",
    )
    if any(marker in value for marker in part_markers):
        return False
    return any(marker in value for marker in (
        "laptop", "لپ", "لب", "case", "کیس", "desktop",
        "کامپیوتر رومیزی", "سیستم آماده",
    ))


def limit_automatic_customization(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Group = apps.get_model("catalog", "CustomizationGroup")

    for category in Category.objects.all().iterator():
        if category_is_configurable(category):
            continue
        # Old migrations generated category-wide configuration for every type
        # of product. Disable those records. Explicit product-scoped groups are
        # intentionally preserved for exceptional configurable products.
        Group.objects.filter(
            category=category,
            applies_to_all_products=True,
        ).update(is_active=False)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0043_ensure_default_product_customization")]
    operations = [
        migrations.RunPython(
            limit_automatic_customization,
            migrations.RunPython.noop,
        )
    ]
