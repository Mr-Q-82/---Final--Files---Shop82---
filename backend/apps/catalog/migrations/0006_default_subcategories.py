from django.db import migrations


DEFAULTS = {
    "laptop": ["گیمینگ", "اولترابوک", "مهندسی", "دانشجویی", "مک‌بوک"],
    "cpu": ["Intel Core i9", "Intel Core i7", "AMD Ryzen 9", "AMD Ryzen 7"],
    "gpu": ["RTX 4090", "RTX 4070", "RX 7900", "RTX 4060"],
    "ram": ["DDR5", "DDR4", "32GB", "16GB"],
    "ssd": ["NVMe", "SATA", "1TB", "2TB"],
    "monitor": ["گیمینگ 144Hz", "4K", "منحنی", "اولترا واید"],
    "mouse": ["گیمینگ", "بی‌سیم", "ارگونومیک"],
    "keyboard": ["مکانیکال", "بی‌سیم", "RGB"],
    "headphone": ["گیمینگ", "بی‌سیم", "نویزکنسلینگ"],
}


def populate_defaults(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    for slug, items in DEFAULTS.items():
        Category.objects.filter(slug=slug, subcategories=[]).update(subcategories=items)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0005_category_subcategories")]
    operations = [migrations.RunPython(populate_defaults, migrations.RunPython.noop)]
