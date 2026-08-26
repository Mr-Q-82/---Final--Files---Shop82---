from django.db import migrations


DEFAULT_MENU = [
    ("فروشگاه", "shop", 10),
    ("لپ‌تاپ", "laptop", 20),
    ("کارت گرافیک", "gpu", 30),
    ("لوازم جانبی", "mouse", 40),
    ("🔥 تخفیف‌ها", "off", 50),
]


def create_default_menu(apps, schema_editor):
    MenuItem = apps.get_model("catalog", "MenuItem")
    if MenuItem.objects.exists():
        return
    MenuItem.objects.bulk_create(
        [
            MenuItem(title=title, target=target, sort_order=sort_order, is_active=True)
            for title, target, sort_order in DEFAULT_MENU
        ]
    )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0002_menuitem_product_available_colors_and_more")]
    operations = [migrations.RunPython(create_default_menu, migrations.RunPython.noop)]
