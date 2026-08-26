from django.db import migrations


DEFAULT_CATEGORIES = (
    {
        "name": "کیس",
        "slug": "case",
        "icon": "case",
        "subcategories": ["میدتاور", "فول‌تاور", "گیمینگ RGB", "Mini-ITX"],
        "sort_order": 100,
    },
    {
        "name": "مادربرد",
        "slug": "motherboard",
        "icon": "motherboard",
        "subcategories": ["Intel", "AMD", "ATX", "Micro-ATX"],
        "sort_order": 110,
    },
)


def add_default_categories(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    for item in DEFAULT_CATEGORIES:
        Category.objects.update_or_create(
            slug=item["slug"],
            defaults={
                "name": item["name"],
                "icon": item["icon"],
                "subcategories": item["subcategories"],
                "sort_order": item["sort_order"],
                "is_active": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0025_gaming_content_placement")]

    operations = [
        migrations.RunPython(add_default_categories, migrations.RunPython.noop),
    ]
