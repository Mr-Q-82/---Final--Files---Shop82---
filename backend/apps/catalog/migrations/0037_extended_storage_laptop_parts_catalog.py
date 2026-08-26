import uuid

from django.db import migrations
from django.utils import timezone


TARGET_PER_KIND = 50

CATEGORIES = {
    "hdd": {
        "name": "هارد HDD",
        "icon": "hdd",
        "subs": ["۱ ترابایت", "۲ ترابایت", "دسکتاپ", "ذخیره‌سازی"],
        "brands": ["Western Digital", "Seagate", "Toshiba"],
        "families": ["Blue", "Barracuda", "P300", "IronWolf"],
        "price": 2_900_000,
        "specs": {"نوع حافظه": "HDD", "رابط": "SATA III", "فرم فاکتور": "3.5 اینچ"},
    },
    "laptop-hdd": {
        "name": "هارد لپ‌تاپی",
        "icon": "hdd",
        "subs": ["۲.۵ اینچ", "SATA", "۵۰۰ گیگابایت", "۱ ترابایت"],
        "brands": ["Western Digital", "Seagate", "Toshiba"],
        "families": ["Mobile Blue", "Laptop Thin", "L200", "Travel Drive"],
        "price": 2_600_000,
        "specs": {"نوع حافظه": "HDD", "رابط": "SATA III", "فرم فاکتور": "2.5 اینچ"},
    },
    "laptop-battery": {
        "name": "باتری لپ‌تاپ",
        "icon": "battery",
        "subs": ["اورجینال", "داخلی", "قابل تعویض", "ظرفیت بالا"],
        "brands": ["ASUS", "Lenovo", "Dell", "HP"],
        "families": ["PowerCell", "LongLife", "Original Series", "Pro Battery"],
        "price": 2_200_000,
        "specs": {"نوع باتری": "لیتیوم یون", "ولتاژ": "11.4V", "وضعیت": "نو"},
    },
    "laptop-board": {
        "name": "برد کامپیوتر و لپ‌تاپ",
        "icon": "board",
        "subs": ["مادربرد لپ‌تاپ", "برد پاور", "برد گرافیک", "برد جانبی"],
        "brands": ["ASUS", "MSI", "Gigabyte", "Lenovo"],
        "families": ["Main Board", "Power Board", "Controller Board", "Pro PCB"],
        "price": 8_500_000,
        "specs": {"نوع قطعه": "برد الکترونیکی", "کاربری": "تعمیر و ارتقا", "وضعیت": "نو"},
    },
    "cooling-pad": {
        "name": "فن و کول‌پد",
        "icon": "cooling",
        "subs": ["فن لپ‌تاپ", "کول‌پد RGB", "خنک‌کننده", "فن کم‌صدا"],
        "brands": ["Cooler Master", "DeepCool", "ASUS", "MSI"],
        "families": ["Notepal", "Multi Core", "Wind Pro", "Frost Gaming"],
        "price": 1_800_000,
        "specs": {"نوع": "خنک‌کننده", "تعداد فن": "دو عدد", "اتصال": "USB"},
    },
}

BRAND_SLUGS = {
    "Western Digital": "western-digital",
    "Seagate": "seagate",
    "Toshiba": "toshiba",
    "ASUS": "asus",
    "Lenovo": "lenovo",
    "Dell": "dell",
    "HP": "hp",
    "MSI": "msi",
    "Gigabyte": "gigabyte",
    "Cooler Master": "cooler-master",
    "DeepCool": "deepcool",
}


def get_or_create_brand(Brand, name):
    slug = BRAND_SLUGS[name]
    brand = Brand.objects.filter(slug=slug).first()
    if brand is None:
        brand = Brand.objects.filter(name__iexact=name).first()
    if brand is None:
        brand = Brand.objects.create(name=name, slug=slug, is_active=True)
    elif not brand.is_active:
        brand.is_active = True
        brand.save(update_fields=["is_active"])
    return brand


def seed_extended_catalog(apps, schema_editor):
    database_name = str(schema_editor.connection.settings_dict.get("NAME", ""))
    if "memorydb_" in database_name or database_name.startswith("test_"):
        return

    Brand = apps.get_model("catalog", "Brand")
    Category = apps.get_model("catalog", "Category")
    Product = apps.get_model("catalog", "Product")
    now = timezone.now()

    brands = {
        name: get_or_create_brand(Brand, name)
        for name in BRAND_SLUGS
    }

    for category_index, (category_slug, config) in enumerate(CATEGORIES.items(), start=12):
        category, _ = Category.objects.update_or_create(
            slug=category_slug,
            defaults={
                "name": config["name"],
                "icon": config["icon"],
                "subcategories": config["subs"],
                "sort_order": category_index * 10,
                "is_active": True,
                "seo_title": f"خرید {config['name']} از فروشگاه 82",
                "seo_description": f"مشاهده و خرید انواع {config['name']} معمولی و گیمینگ با ضمانت و ارسال سریع.",
            },
        )

        existing_skus = set(
            Product.objects.filter(
                sku__startswith=f"EXT-{category_slug.upper()}-"
            ).values_list("sku", flat=True)
        )
        rows = []
        for is_gaming, kind_code in ((False, "REG"), (True, "GAM")):
            for sequence in range(1, TARGET_PER_KIND + 1):
                sku = f"EXT-{category_slug.upper()}-{kind_code}-{sequence:03d}"
                if sku in existing_skus:
                    continue
                brand_name = config["brands"][(sequence - 1) % len(config["brands"])]
                family = config["families"][(sequence - 1) % len(config["families"])]
                gaming_label = " گیمینگ" if is_gaming else ""
                product_name = (
                    f"{config['name']}{gaming_label} {brand_name} "
                    f"سری {family} مدل {sequence:02d}"
                )
                slug = f"extended-{category_slug}-{kind_code.lower()}-{sequence:03d}"
                specs = dict(config["specs"])
                specs["رده محصول"] = "گیمینگ" if is_gaming else "استاندارد"
                if is_gaming:
                    specs["ویژگی ویژه"] = "عملکرد تقویت‌شده و مناسب استفاده طولانی"
                rows.append(Product(
                    id=uuid.uuid4(),
                    created_at=now,
                    updated_at=now,
                    sku=sku,
                    name=product_name,
                    slug=slug,
                    category=category,
                    brand=brands[brand_name],
                    short_description=f"{product_name} با ضمانت معتبر و امکان مدیریت کامل از پنل ادمین.",
                    description=(
                        f"{product_name} یکی از محصولات دسته {config['name']} است. "
                        "مشخصات، قیمت، موجودی، تصاویر و شرایط ارسال این کالا از پنل مدیریت قابل ویرایش است."
                    ),
                    price=config["price"] + (sequence % 15) * 320_000 + (1_400_000 if is_gaming else 0),
                    discount_percent=(sequence % 5) * 2,
                    stock=10 + (sequence % 31),
                    specifications=specs,
                    warranty="18 ماهه شرکتی",
                    available_colors=[],
                    shipping_options=["عادی", "سریع", "ویژه"],
                    rating=str(4 + (sequence % 9) / 10),
                    is_active=True,
                    is_featured=sequence <= 8,
                    is_gaming=is_gaming,
                    sold_count=(sequence * 3) + (20 if is_gaming else 0),
                    seo_title=product_name,
                    seo_description=f"خرید {product_name} با ضمانت و ارسال سریع از فروشگاه 82.",
                    search_keywords=f"{product_name} {config['name']} {brand_name}",
                ))
        Product.objects.bulk_create(rows, batch_size=200, ignore_conflicts=True)


def remove_extended_catalog(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    Category = apps.get_model("catalog", "Category")
    Product.objects.filter(sku__startswith="EXT-").delete()
    for category in Category.objects.filter(slug__in=CATEGORIES):
        if not category.products.exists():
            category.delete()


class Migration(migrations.Migration):
    dependencies = [("catalog", "0036_sitesetting_more_hero_paths")]

    operations = [
        migrations.RunPython(seed_extended_catalog, remove_extended_catalog),
    ]
