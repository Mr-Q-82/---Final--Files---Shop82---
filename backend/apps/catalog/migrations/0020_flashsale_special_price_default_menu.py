from django.db import migrations, models


DEFAULT_MENU_ITEMS = [
    ("فروشگاه", "shop", 10),
    ("لپ‌تاپ", "laptop", 20),
    ("پردازنده", "cpu", 30),
    ("کارت گرافیک", "gpu", 40),
    ("حافظه RAM", "ram", 50),
    ("حافظه SSD", "ssd", 60),
    ("مانیتور", "monitor", 70),
    ("ماوس", "mouse", 80),
    ("کیبورد", "keyboard", 90),
    ("هدفون", "headphone", 100),
    ("🔥 تخفیف‌ها", "off", 110),
]


def complete_default_menu(apps, schema_editor):
    MenuItem = apps.get_model("catalog", "MenuItem")
    HomeSection = apps.get_model("catalog", "HomeSection")
    legacy_defaults = {
        "shop": ("فروشگاه", 10),
        "laptop": ("لپ‌تاپ", 20),
        "gpu": ("کارت گرافیک", 30),
        "mouse": ("لوازم جانبی", 40),
        "off": ("🔥 تخفیف‌ها", 50),
    }
    for title, target, sort_order in DEFAULT_MENU_ITEMS:
        existing = MenuItem.objects.filter(target=target).first()
        if existing:
            legacy = legacy_defaults.get(target)
            if (
                legacy
                and existing.title == legacy[0]
                and existing.sort_order == legacy[1]
            ):
                existing.title = title
                existing.sort_order = sort_order
                existing.save(update_fields=("title", "sort_order"))
            continue
        MenuItem.objects.create(
            title=title,
            target=target,
            sort_order=sort_order,
            is_active=True,
        )
    HomeSection.objects.filter(key="offers", product_limit=4).update(
        product_limit=8
    )
    HomeSection.objects.filter(
        key__in=("best_sellers", "newest"), product_limit=4
    ).update(product_limit=12)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0019_sitesetting_mega_promo_image")]

    operations = [
        migrations.AlterField(
            model_name="flashsale",
            name="discount_percent",
            field=models.PositiveSmallIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="flashsale",
            name="special_price",
            field=models.PositiveBigIntegerField(blank=True, null=True),
        ),
        migrations.RunPython(complete_default_menu, migrations.RunPython.noop),
    ]
