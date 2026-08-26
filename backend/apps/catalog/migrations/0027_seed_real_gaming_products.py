from django.db import migrations


BRANDS = {
    "ASUS": "asus",
    "MSI": "msi",
    "AMD": "amd",
    "Intel": "intel",
    "CORSAIR": "corsair",
    "Samsung": "samsung",
    "Logitech G": "logitech-g",
    "Razer": "razer",
}


PRODUCTS = (
    ("GAM-LAP-ASUS-SCAR18", "لپ‌تاپ گیمینگ ASUS ROG Strix SCAR 18", "asus-rog-strix-scar-18-gaming", "laptop", "ASUS", 245_000_000, 3, {"نمایشگر": "18 اینچ", "حافظه": "DDR5", "کاربری": "گیمینگ حرفه‌ای"}),
    ("GAM-LAP-MSI-RAIDER18", "لپ‌تاپ گیمینگ MSI Raider 18 HX AI", "msi-raider-18-hx-ai-gaming", "laptop", "MSI", 229_000_000, 4, {"نمایشگر": "18 اینچ", "حافظه": "DDR5", "کاربری": "گیمینگ و تولید محتوا"}),
    ("GAM-CPU-AMD-9800X3D", "پردازنده AMD Ryzen 7 9800X3D", "amd-ryzen-7-9800x3d", "cpu", "AMD", 39_500_000, 5, {"سوکت": "AM5", "تعداد هسته": "8 هسته", "تعداد رشته": "16 رشته"}),
    ("GAM-CPU-INTEL-285K", "پردازنده Intel Core Ultra 9 285K", "intel-core-ultra-9-285k", "cpu", "Intel", 42_800_000, 4, {"سوکت": "LGA1851", "رده": "Core Ultra 9", "کاربری": "گیمینگ و پردازش سنگین"}),
    ("GAM-GPU-MSI-RTX5090", "کارت گرافیک MSI GeForce RTX 5090 GAMING TRIO OC", "msi-geforce-rtx-5090-gaming-trio-oc", "gpu", "MSI", 289_000_000, 2, {"پردازنده گرافیکی": "GeForce RTX 5090", "حافظه": "32GB", "سری خنک‌کننده": "GAMING TRIO"}),
    ("GAM-GPU-MSI-RTX5080", "کارت گرافیک MSI GeForce RTX 5080 GAMING TRIO OC", "msi-geforce-rtx-5080-gaming-trio-oc", "gpu", "MSI", 149_000_000, 3, {"پردازنده گرافیکی": "GeForce RTX 5080", "حافظه": "16GB", "سری خنک‌کننده": "GAMING TRIO"}),
    ("GAM-RAM-COR-VEN32", "رم CORSAIR VENGEANCE RGB DDR5 ظرفیت 32GB", "corsair-vengeance-rgb-ddr5-32gb", "ram", "CORSAIR", 13_900_000, 8, {"نوع حافظه": "DDR5", "ظرفیت": "32 گیگابایت", "تعداد ماژول": "دو عدد", "نورپردازی": "RGB"}),
    ("GAM-RAM-COR-DOM64", "رم CORSAIR DOMINATOR TITANIUM RGB ظرفیت 64GB", "corsair-dominator-titanium-rgb-64gb", "ram", "CORSAIR", 28_500_000, 6, {"نوع حافظه": "DDR5", "ظرفیت": "64 گیگابایت", "تعداد ماژول": "دو عدد", "نورپردازی": "RGB"}),
    ("GAM-SSD-COR-MP700-2T", "حافظه SSD کورسیر MP700 PRO ظرفیت 2TB", "corsair-mp700-pro-2tb", "ssd", "CORSAIR", 24_900_000, 7, {"رابط": "PCIe 5.0 NVMe", "ظرفیت": "2 ترابایت", "فرم فاکتور": "M.2"}),
    ("GAM-SSD-SAM-990-2T", "حافظه SSD سامسونگ 990 PRO ظرفیت 2TB", "samsung-990-pro-2tb", "ssd", "Samsung", 17_800_000, 5, {"رابط": "PCIe 4.0 NVMe", "ظرفیت": "2 ترابایت", "فرم فاکتور": "M.2"}),
    ("GAM-MON-MSI-341CQR", "مانیتور گیمینگ MSI MPG 341CQR QD-OLED X36", "msi-mpg-341cqr-qd-oled-x36", "monitor", "MSI", 98_000_000, 4, {"اندازه": "34 اینچ", "وضوح": "3440×1440", "نرخ نوسازی": "360Hz", "پنل": "QD-OLED"}),
    ("GAM-MON-ASUS-PG27", "مانیتور گیمینگ ASUS ROG Swift OLED PG27UCDM", "asus-rog-swift-oled-pg27ucdm", "monitor", "ASUS", 112_000_000, 3, {"اندازه": "27 اینچ", "وضوح": "4K", "پنل": "OLED", "کاربری": "گیمینگ"}),
    ("GAM-MOU-LOG-SL2", "ماوس گیمینگ Logitech G PRO X SUPERLIGHT 2", "logitech-g-pro-x-superlight-2", "mouse", "Logitech G", 12_900_000, 7, {"اتصال": "بی‌سیم", "سری": "PRO X", "کاربری": "رقابتی"}),
    ("GAM-MOU-RAZ-VIPER3", "ماوس گیمینگ Razer Viper V3 Pro", "razer-viper-v3-pro", "mouse", "Razer", 14_500_000, 6, {"اتصال": "بی‌سیم", "سری": "Viper", "کاربری": "رقابتی"}),
    ("GAM-KEY-LOG-G915X", "کیبورد گیمینگ Logitech G915 X LIGHTSPEED", "logitech-g915-x-lightspeed", "keyboard", "Logitech G", 18_900_000, 5, {"اتصال": "LIGHTSPEED بی‌سیم", "نوع": "مکانیکال", "نورپردازی": "RGB"}),
    ("GAM-KEY-RAZ-BWV4", "کیبورد گیمینگ Razer BlackWidow V4 Pro", "razer-blackwidow-v4-pro", "keyboard", "Razer", 21_500_000, 4, {"نوع": "مکانیکال", "سری": "BlackWidow", "نورپردازی": "RGB"}),
    ("GAM-HDP-LOG-PROX2", "هدست گیمینگ Logitech G PRO X 2 LIGHTSPEED", "logitech-g-pro-x-2-lightspeed", "headphone", "Logitech G", 19_800_000, 5, {"اتصال": "بی‌سیم", "سری": "PRO X", "میکروفون": "دارد"}),
    ("GAM-HDP-COR-HS80", "هدست گیمینگ CORSAIR HS80 MAX WIRELESS", "corsair-hs80-max-wireless", "headphone", "CORSAIR", 16_700_000, 6, {"اتصال": "بی‌سیم", "صدای فراگیر": "دارد", "میکروفون": "دارد"}),
    ("GAM-CAS-COR-3500X", "کیس گیمینگ CORSAIR 3500X ARGB", "corsair-3500x-argb-gaming-case", "case", "CORSAIR", 18_500_000, 8, {"فرم فاکتور": "Mid-Tower", "نورپردازی": "ARGB", "پنل جانبی": "شیشه‌ای"}),
    ("GAM-CAS-COR-5000D", "کیس گیمینگ CORSAIR 5000D AIRFLOW", "corsair-5000d-airflow-gaming-case", "case", "CORSAIR", 22_900_000, 7, {"فرم فاکتور": "Mid-Tower", "طراحی": "Airflow", "پنل جانبی": "شیشه‌ای"}),
    ("GAM-MB-ASUS-X870EE", "مادربرد ASUS ROG STRIX X870E-E GAMING WIFI", "asus-rog-strix-x870e-e-gaming-wifi", "motherboard", "ASUS", 58_000_000, 4, {"چیپست": "AMD X870E", "سوکت": "AM5", "حافظه": "DDR5", "شبکه بی‌سیم": "WiFi"}),
    ("GAM-MB-ASUS-B650A", "مادربرد ASUS ROG STRIX B650-A GAMING WIFI", "asus-rog-strix-b650-a-gaming-wifi", "motherboard", "ASUS", 32_500_000, 5, {"چیپست": "AMD B650", "سوکت": "AM5", "حافظه": "DDR5", "فرم فاکتور": "ATX"}),
)


def seed_gaming_products(apps, schema_editor):
    database_name = str(schema_editor.connection.settings_dict.get("NAME", ""))
    if "memorydb_" in database_name or database_name.startswith("test_"):
        return

    Brand = apps.get_model("catalog", "Brand")
    Category = apps.get_model("catalog", "Category")
    Product = apps.get_model("catalog", "Product")

    brand_rows = {}
    for name, slug in BRANDS.items():
        # A previous database may contain the same slug with a Persian or
        # otherwise customized display name. Reuse that row instead of trying
        # to create a second brand with the unique slug.
        brand = Brand.objects.filter(slug=slug).first()
        if brand is None:
            brand = Brand.objects.filter(name__iexact=name).first()
        if brand is None:
            brand = Brand.objects.create(name=name, slug=slug, is_active=True)
        brand_rows[name] = brand

    for index, (sku, name, slug, category_slug, brand_name, price, discount, specs) in enumerate(PRODUCTS):
        category = Category.objects.filter(slug=category_slug).first()
        if category is None:
            continue
        Product.objects.get_or_create(
            sku=sku,
            defaults={
                "name": name,
                "slug": slug,
                "category": category,
                "brand": brand_rows[brand_name],
                "short_description": "محصول گیمینگ منتخب؛ مشخصات و قیمت نهایی را پیش از انتشار بررسی کنید.",
                "description": "این محصول براساس مدل‌های رسمی تجهیزات گیمینگ ثبت شده و تمام اطلاعات آن از پنل مدیریت قابل ویرایش است.",
                "price": price,
                "discount_percent": discount,
                "stock": 8 + (index % 7),
                "specifications": specs,
                "warranty": "18 ماهه شرکتی",
                "available_colors": [],
                "shipping_options": ["عادی", "سریع", "ویژه"],
                "rating": "4.5",
                "is_active": True,
                "is_featured": index < 10,
                "is_gaming": True,
                "sold_count": 18 + (index * 3),
                "seo_title": name,
                "seo_description": f"خرید {name} با ضمانت و ارسال سریع از فروشگاه 82.",
                "search_keywords": f"{name} گیمینگ {brand_name}",
            },
        )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0026_default_case_motherboard_categories")]

    operations = [
        migrations.RunPython(seed_gaming_products, migrations.RunPython.noop),
    ]
