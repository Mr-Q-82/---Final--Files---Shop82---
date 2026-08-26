from django.db import migrations


DEFAULT_CATEGORIES = [
    ("لپ‌تاپ", "laptop", "laptop"),
    ("پردازنده", "cpu", "cpu"),
    ("کارت گرافیک", "gpu", "gpu"),
    ("حافظه RAM", "ram", "ram"),
    ("حافظه SSD", "ssd", "ssd"),
    ("مانیتور", "monitor", "monitor"),
    ("ماوس", "mouse", "mouse"),
    ("کیبورد", "keyboard", "keyboard"),
    ("هدفون", "headphone", "headphone"),
]


def create_default_categories(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    for index, (name, slug, icon) in enumerate(DEFAULT_CATEGORIES, start=1):
        Category.objects.get_or_create(
            slug=slug,
            defaults={
                "name": name,
                "icon": icon,
                "sort_order": index * 10,
                "is_active": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0003_default_menu")]
    operations = [migrations.RunPython(create_default_categories, migrations.RunPython.noop)]
