from django.db import migrations


TARGET_PER_CATEGORY = 50

BRANDS = {
    "ASUS": "asus",
    "MSI": "msi",
    "AMD": "amd",
    "Intel": "intel",
    "CORSAIR": "corsair",
    "Samsung": "samsung",
    "Logitech G": "logitech-g",
    "Razer": "razer",
    "Gigabyte": "gigabyte",
    "Kingston": "kingston",
    "Acer": "acer",
    "Lenovo": "lenovo",
    "HyperX": "hyperx",
}

CATEGORY_CONFIG = {
    "laptop": {
        "label": "لپ‌تاپ",
        "brands": ["ASUS", "MSI", "Acer", "Lenovo"],
        "families": ["Strix", "Raider", "Predator", "Legion"],
        "price": 72_000_000,
        "specs": {"نمایشگر": "16 اینچ 165Hz", "حافظه": "DDR5", "کاربری": "گیمینگ"},
    },
    "cpu": {
        "label": "پردازنده",
        "brands": ["AMD", "Intel"],
        "families": ["Ryzen Gaming", "Core Ultra", "X3D", "Performance"],
        "price": 16_000_000,
        "specs": {"کاربری": "گیمینگ", "حافظه قابل پشتیبانی": "DDR5", "نسل رابط": "PCIe 5.0"},
    },
    "gpu": {
        "label": "کارت گرافیک",
        "brands": ["MSI", "ASUS", "Gigabyte"],
        "families": ["Gaming Trio", "ROG Strix", "AORUS", "Ventus"],
        "price": 38_000_000,
        "specs": {"کاربری": "گیمینگ", "خنک‌کننده": "چند فن", "نورپردازی": "RGB"},
    },
    "ram": {
        "label": "حافظه RAM",
        "brands": ["CORSAIR", "Kingston", "HyperX"],
        "families": ["Vengeance", "Fury", "Dominator", "Beast"],
        "price": 5_800_000,
        "specs": {"نوع حافظه": "DDR5", "معماری حافظه": "دو کاناله", "تعداد ماژول": "دو عدد"},
    },
    "ssd": {
        "label": "حافظه SSD",
        "brands": ["Samsung", "CORSAIR", "Kingston"],
        "families": ["PRO NVMe", "MP Gaming", "Fury Renegade", "EVO"],
        "price": 6_900_000,
        "specs": {"رابط": "NVMe", "فرم فاکتور": "M.2", "کاربری": "گیمینگ"},
    },
    "monitor": {
        "label": "مانیتور",
        "brands": ["MSI", "ASUS", "Gigabyte", "Samsung"],
        "families": ["OLED Gaming", "ROG Swift", "AORUS", "Odyssey"],
        "price": 24_000_000,
        "specs": {"نرخ نوسازی": "165Hz", "زمان پاسخ": "1ms", "کاربری": "گیمینگ"},
    },
    "mouse": {
        "label": "ماوس",
        "brands": ["Logitech G", "Razer", "HyperX"],
        "families": ["Superlight", "Viper", "Pulsefire", "Pro Wireless"],
        "price": 3_800_000,
        "specs": {"نوع اتصال": "بی‌سیم", "حسگر": "اپتیکال", "کاربری": "گیمینگ"},
    },
    "keyboard": {
        "label": "کیبورد",
        "brands": ["Logitech G", "Razer", "HyperX", "CORSAIR"],
        "families": ["Lightspeed", "BlackWidow", "Alloy", "K-Series"],
        "price": 5_200_000,
        "specs": {"نوع": "مکانیکال", "نورپردازی": "RGB", "کاربری": "گیمینگ"},
    },
    "headphone": {
        "label": "هدست",
        "brands": ["Logitech G", "Razer", "HyperX", "CORSAIR"],
        "families": ["PRO X", "BlackShark", "Cloud", "HS Wireless"],
        "price": 4_900_000,
        "specs": {"میکروفون": "دارد", "صدای فراگیر": "دارد", "کاربری": "گیمینگ"},
    },
    "case": {
        "label": "کیس",
        "brands": ["CORSAIR", "ASUS", "MSI", "Gigabyte"],
        "families": ["Airflow", "ROG", "MAG", "AORUS"],
        "price": 7_500_000,
        "specs": {"فرم فاکتور": "Mid-Tower", "پنل جانبی": "شیشه‌ای", "نورپردازی": "ARGB"},
    },
    "motherboard": {
        "label": "مادربرد",
        "brands": ["ASUS", "MSI", "Gigabyte"],
        "families": ["ROG Strix", "MPG Gaming", "AORUS", "TUF Gaming"],
        "price": 14_000_000,
        "specs": {"حافظه": "DDR5", "فرم فاکتور": "ATX", "کاربری": "گیمینگ"},
    },
}


def get_or_create_brand(Brand, name, slug):
    brand = Brand.objects.filter(slug=slug).first()
    if brand is None:
        brand = Brand.objects.filter(name__iexact=name).first()
    if brand is None:
        brand = Brand.objects.create(name=name, slug=slug, is_active=True)
    return brand


def ensure_gaming_catalog(apps, schema_editor):
    database_name = str(schema_editor.connection.settings_dict.get("NAME", ""))
    if "memorydb_" in database_name or database_name.startswith("test_"):
        return

    Brand = apps.get_model("catalog", "Brand")
    Category = apps.get_model("catalog", "Category")
    Product = apps.get_model("catalog", "Product")
    brand_rows = {
        name: get_or_create_brand(Brand, name, slug)
        for name, slug in BRANDS.items()
    }

    for category_slug, config in CATEGORY_CONFIG.items():
        category = Category.objects.filter(slug=category_slug).first()
        if category is None:
            continue
        current_count = Product.objects.filter(
            category=category,
            is_gaming=True,
            is_active=True,
        ).count()
        missing = max(0, TARGET_PER_CATEGORY - current_count)
        created = 0
        sequence = 1
        while created < missing:
            sku = f"GAM-BULK-{category_slug.upper()}-{sequence:03d}"
            sequence += 1
            if Product.objects.filter(sku=sku).exists():
                continue
            brand_name = config["brands"][created % len(config["brands"])]
            family = config["families"][created % len(config["families"])]
            model_number = 20 + created
            name = (
                f"{config['label']} گیمینگ {brand_name} "
                f"سری {family} مدل {model_number}"
            )
            slug = f"gaming-{category_slug}-{sequence - 1:03d}"
            Product.objects.create(
                sku=sku,
                name=name,
                slug=slug,
                category=category,
                brand=brand_rows[brand_name],
                short_description="محصول گیمینگ قابل ویرایش از پنل مدیریت فروشگاه 82.",
                description="این ردیف برای تکمیل کاتالوگ گیمینگ ساخته شده است؛ قیمت و مشخصات نهایی را پیش از انتشار بررسی کنید.",
                price=config["price"] + (created % 12) * 850_000,
                discount_percent=(created % 6) * 2,
                stock=8 + (created % 18),
                specifications=config["specs"],
                warranty="18 ماهه شرکتی",
                available_colors=[],
                shipping_options=["عادی", "سریع", "ویژه"],
                rating=str(4 + (created % 9) / 10),
                is_active=True,
                is_featured=created < 8,
                is_gaming=True,
                sold_count=12 + created * 4,
                seo_title=name,
                seo_description=f"خرید {name} با ضمانت و ارسال سریع از فروشگاه 82.",
                search_keywords=f"{name} {brand_name} گیمینگ",
            )
            created += 1


def remove_bulk_gaming_catalog(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    Product.objects.filter(sku__startswith="GAM-BULK-").delete()


class Migration(migrations.Migration):
    dependencies = [("catalog", "0027_seed_real_gaming_products")]

    operations = [
        migrations.RunPython(ensure_gaming_catalog, remove_bulk_gaming_catalog),
    ]
