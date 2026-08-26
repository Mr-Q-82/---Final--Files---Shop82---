from datetime import timedelta

from django.db import migrations
from django.utils import timezone


CATEGORIES = {
    "desk": {
        "name": "میز کامپیوتر",
        "icon": "desk",
        "subs": ["گیمینگ", "اداری", "ارگونومیک", "ارتفاع قابل تنظیم", "L شکل", "مدیریت کابل"],
        "normal": [
            ("Green", "GD-120", "میز کامپیوتر گرین GD-120", 9_800_000),
            ("Fantech", "GD-714", "میز کامپیوتر فنتک GD-714", 13_500_000),
            ("IKEA", "UTESPELARE", "میز کامپیوتر ایکیا UTESPELARE", 18_900_000),
            ("Green", "ERGOLIFT", "میز ارگونومیک برقی ErgoLift", 29_500_000),
        ],
        "gaming": [
            ("DXRacer", "GD-1000", "میز گیمینگ DXRacer GD-1000", 34_900_000),
            ("Razer", "BATTLESTATION", "میز گیمینگ Razer Battlestation", 42_500_000),
            ("Fantech", "BETA-GD612", "میز گیمینگ Fantech BETA GD612", 21_800_000),
            ("Cougar", "MARS-120", "میز گیمینگ Cougar MARS 120", 38_700_000),
        ],
        "specs": {"جنس صفحه": "MDF مقاوم", "مدیریت کابل": "دارد", "حداکثر تحمل وزن": "80 کیلوگرم", "کاربری": "کامپیوتر و تجهیزات دیجیتال"},
    },
    "chair": {
        "name": "صندلی کامپیوتر",
        "icon": "chair",
        "subs": ["گیمینگ", "اداری", "ارگونومیک", "طبی", "پارچه‌ای", "چرمی"],
        "normal": [
            ("Green", "GCR-203", "صندلی کامپیوتر گرین GCR-203", 12_900_000),
            ("Cougar", "ARMOR-ONE", "صندلی ارگونومیک Cougar Armor One", 19_600_000),
            ("DXRacer", "AIR-R1", "صندلی اداری ارگونومیک DXRacer Air R1", 24_800_000),
            ("Fantech", "OC-A258", "صندلی کامپیوتر Fantech OC-A258", 10_700_000),
        ],
        "gaming": [
            ("DXRacer", "MASTER-DMC", "صندلی گیمینگ DXRacer Master DMC", 39_500_000),
            ("Razer", "ISKUR-V2", "صندلی گیمینگ Razer Iskur V2", 47_900_000),
            ("Cougar", "ARMOR-TITAN", "صندلی گیمینگ Cougar Armor Titan", 35_800_000),
            ("Fantech", "GC-283", "صندلی گیمینگ Fantech GC-283", 18_400_000),
        ],
        "specs": {"طراحی": "ارگونومیک", "تنظیم ارتفاع": "دارد", "پشتی قابل تنظیم": "دارد", "حداکثر تحمل وزن": "120 کیلوگرم"},
    },
    "mouse-pad": {
        "name": "موس‌پد",
        "icon": "mousepad",
        "subs": ["گیمینگ", "RGB", "کنترل", "سرعت", "سایز بزرگ", "ضد لغزش"],
        "normal": [
            ("Logitech", "STUDIO", "موس‌پد Logitech Studio Series", 1_250_000),
            ("Razer", "GIGANTUS-V2", "موس‌پد Razer Gigantus V2", 1_680_000),
            ("Fantech", "MP35", "موس‌پد Fantech MP35 Control", 790_000),
            ("Green", "GMP-460", "موس‌پد بزرگ گرین GMP-460", 980_000),
        ],
        "gaming": [
            ("Razer", "FIREFLY-V2", "موس‌پد گیمینگ RGB Razer Firefly V2", 6_900_000),
            ("Logitech G", "POWERPLAY", "موس‌پد گیمینگ Logitech G Powerplay", 15_800_000),
            ("SteelSeries", "QCK-PRISM", "موس‌پد گیمینگ SteelSeries QcK Prism", 5_600_000),
            ("Corsair", "MM700-RGB", "موس‌پد گیمینگ Corsair MM700 RGB", 4_900_000),
        ],
        "specs": {"سطح": "پارچه میکروبافت", "کف": "لاستیک ضد لغزش", "لبه دوردوزی": "دارد", "کاربری": "کنترل و سرعت"},
    },
}

USAGES = {
    "desk": [("گیمینگ", "desk"), ("کار و برنامه‌نویسی", "keyboard"), ("اداری", "desk"), ("استودیو", "monitor"), ("فضای کوچک", "desk")],
    "chair": [("گیمینگ", "chair"), ("ارگونومیک", "chair"), ("اداری", "case"), ("نشستن طولانی", "chair"), ("اقتصادی", "chair")],
    "mouse-pad": [("گیمینگ", "mouse"), ("کنترل", "mouse"), ("سرعت", "mouse"), ("RGB", "mousepad"), ("سایز بزرگ", "desk")],
}


def slugify_ascii(value):
    return value.lower().replace(" ", "-").replace("_", "-")


def seed_catalog(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Brand = apps.get_model("catalog", "Brand")
    Product = apps.get_model("catalog", "Product")
    MenuItem = apps.get_model("catalog", "MenuItem")
    FlashSale = apps.get_model("catalog", "FlashSale")
    Recommendation = apps.get_model("catalog", "CategoryProductRecommendation")
    Usage = apps.get_model("catalog", "CategoryUsageProfile")
    starts_at = timezone.now() - timedelta(days=1)
    ends_at = timezone.now() + timedelta(days=365)

    for category_order, (category_slug, config) in enumerate(CATEGORIES.items(), start=30):
        category, _ = Category.objects.update_or_create(
            slug=category_slug,
            defaults={
                "name": config["name"], "icon": config["icon"],
                "subcategories": config["subs"], "is_active": True,
                "sort_order": category_order,
                "seo_title": f"خرید {config['name']} عادی و گیمینگ",
                "seo_description": f"مشاهده و خرید انواع {config['name']} با ضمانت و ارسال سریع.",
            },
        )
        MenuItem.objects.update_or_create(
            target=category_slug,
            defaults={"title": config["name"], "sort_order": 120 + category_order, "is_active": True},
        )
        catalog_products = {False: [], True: []}
        for is_gaming, rows in ((False, config["normal"]), (True, config["gaming"])):
            for index, (brand_name, model, name, price) in enumerate(rows):
                brand_slug = slugify_ascii(brand_name)
                brand = Brand.objects.filter(slug=brand_slug).first()
                if brand is None:
                    brand = Brand.objects.filter(name__iexact=brand_name).first()
                if brand is None:
                    brand = Brand.objects.create(name=brand_name, slug=brand_slug, is_active=True)
                prefix = "GAM" if is_gaming else "REG"
                sku = f"{prefix}-{category_slug.upper()}-{model}"[:50]
                product, _ = Product.objects.update_or_create(
                    sku=sku,
                    defaults={
                        "name": name,
                        "slug": slugify_ascii(f"{prefix}-{category_slug}-{model}"),
                        "category": category, "brand": brand,
                        "short_description": f"{name} با طراحی حرفه‌ای و ضمانت معتبر.",
                        "description": f"{name} مناسب استفاده {'گیمینگ حرفه‌ای' if is_gaming else 'خانگی، اداری و حرفه‌ای'} است و همه مشخصات آن از پنل مدیریت قابل ویرایش است.",
                        "price": price, "discount_percent": 10 + index * 3,
                        "stock": 12 + index * 4,
                        "specifications": {**config["specs"], "مدل": model, "برند": brand_name},
                        "warranty": "۱۸ ماهه شرکتی",
                        "available_colors": [["مشکی", "#111827"], ["سفید", "#f8fafc"], ["قرمز", "#dc2626"]],
                        "shipping_options": ["عادی", "سریع", "ویژه"],
                        "rating": str(4.4 + index / 10),
                        "is_active": True, "is_featured": True,
                        "is_gaming": is_gaming, "sold_count": 45 + index * 23,
                        "seo_title": name,
                        "seo_description": f"خرید {name} با قیمت مناسب، ضمانت و ارسال سریع از فروشگاه 82.",
                        "search_keywords": f"{name} {config['name']} {brand_name} {'گیمینگ' if is_gaming else 'اداری ارگونومیک'}",
                    },
                )
                catalog_products[is_gaming].append(product)
                Recommendation.objects.update_or_create(
                    category=category, product=product,
                    defaults={"sort_order": index + (10 if is_gaming else 0), "is_active": True},
                )
                FlashSale.objects.update_or_create(
                    product=product, title=f"پیشنهاد ویژه {config['name']}",
                    defaults={
                        "discount_percent": 15 + index * 2,
                        "special_price": None, "starts_at": starts_at,
                        "ends_at": ends_at, "stock_limit": 0,
                        "sold_count": 0, "is_active": True,
                    },
                )
        for catalog, is_gaming in (("NORMAL", False), ("GAMING", True)):
            profiles = []
            for index, (name, icon) in enumerate(USAGES[category_slug]):
                profile, _ = Usage.objects.update_or_create(
                    category=category, catalog=catalog, slug=f"usage-{catalog.lower()}-{index + 1}",
                    defaults={
                        "name": name, "icon": icon,
                        "description": f"محصولات مناسب {name}",
                        "sort_order": index, "is_active": True,
                    },
                )
                profiles.append(profile)
            for index, product in enumerate(catalog_products[is_gaming]):
                profiles[index % len(profiles)].products.add(product)


def remove_catalog(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    MenuItem = apps.get_model("catalog", "MenuItem")
    Category = apps.get_model("catalog", "Category")
    Product.objects.filter(sku__regex=r"^(REG|GAM)-(DESK|CHAIR|MOUSE-PAD)-").delete()
    MenuItem.objects.filter(target__in=CATEGORIES.keys()).delete()
    Category.objects.filter(slug__in=CATEGORIES.keys(), products__isnull=True).delete()


class Migration(migrations.Migration):
    dependencies = [("catalog", "0045_professional_catalog_constraints")]
    operations = [migrations.RunPython(seed_catalog, remove_catalog)]
