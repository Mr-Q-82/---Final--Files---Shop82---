from datetime import timedelta

from django.db import migrations
from django.utils import timezone


TARGET_PER_CATALOG = 30

CATEGORY_CONFIG = {
    "desk": {
        "label": "میز کامپیوتر",
        "brands": [("DXRacer", "dxracer"), ("Fantech", "fantech"), ("Cougar", "cougar"), ("Green", "green"), ("IKEA", "ikea"), ("Razer", "razer")],
        "families": ["Ergo", "Pro Desk", "Battle", "Studio", "Lift", "Corner", "Arena", "Office"],
        "base_price": 8_900_000,
        "specs": {"جنس صفحه": "MDF مقاوم", "فریم": "فلزی", "مدیریت کابل": "دارد", "تحمل وزن": "80 کیلوگرم"},
    },
    "chair": {
        "label": "صندلی کامپیوتر",
        "brands": [("DXRacer", "dxracer"), ("Fantech", "fantech"), ("Cougar", "cougar"), ("Green", "green"), ("Razer", "razer"), ("Corsair", "corsair")],
        "families": ["Armor", "Master", "Ergo", "Air", "Titan", "Office", "Comfort", "Elite"],
        "base_price": 9_700_000,
        "specs": {"طراحی": "ارگونومیک", "تنظیم ارتفاع": "دارد", "پشتی قابل تنظیم": "دارد", "تحمل وزن": "120 کیلوگرم"},
    },
    "mouse-pad": {
        "label": "موس‌پد",
        "brands": [("Razer", "razer"), ("Logitech G", "logitech-g"), ("SteelSeries", "steelseries"), ("Corsair", "corsair"), ("Fantech", "fantech"), ("Green", "green")],
        "families": ["Control", "Speed", "Prism", "Studio", "Pro", "RGB", "Desk Mat", "Precision"],
        "base_price": 690_000,
        "specs": {"سطح": "پارچه میکروبافت", "کف": "لاستیک ضد لغزش", "لبه دوردوزی": "دارد", "ضد آب": "بله"},
    },
}


def get_brand(Brand, name, slug):
    brand = Brand.objects.filter(slug=slug).first()
    if brand is None:
        brand = Brand.objects.filter(name__iexact=name).first()
    if brand is None:
        brand = Brand.objects.create(name=name, slug=slug, is_active=True)
    return brand


def ensure_sixty_products(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Brand = apps.get_model("catalog", "Brand")
    Product = apps.get_model("catalog", "Product")
    FlashSale = apps.get_model("catalog", "FlashSale")
    Recommendation = apps.get_model("catalog", "CategoryProductRecommendation")
    Usage = apps.get_model("catalog", "CategoryUsageProfile")
    starts_at = timezone.now() - timedelta(days=1)
    ends_at = timezone.now() + timedelta(days=365)

    for category_slug, config in CATEGORY_CONFIG.items():
        category = Category.objects.filter(slug=category_slug).first()
        if category is None:
            continue
        brands = [get_brand(Brand, *row) for row in config["brands"]]
        for is_gaming, catalog in ((False, "NORMAL"), (True, "GAMING")):
            existing = Product.objects.filter(
                category=category, is_gaming=is_gaming
            ).count()
            missing = max(0, TARGET_PER_CATALOG - existing)
            profiles = list(Usage.objects.filter(
                category=category, catalog=catalog, is_active=True
            ).order_by("sort_order", "created_at"))
            sequence = 1
            created = 0
            while created < missing:
                prefix = "GAM" if is_gaming else "REG"
                sku = f"{prefix}-BULK-{category_slug.upper()}-{sequence:03d}"
                sequence += 1
                if Product.objects.filter(sku=sku).exists():
                    continue
                absolute_index = existing + created
                brand = brands[absolute_index % len(brands)]
                family = config["families"][absolute_index % len(config["families"])]
                model = 100 + absolute_index
                gaming_label = " گیمینگ" if is_gaming else ""
                name = f"{config['label']}{gaming_label} {brand.name} سری {family} مدل {model}"
                price_step = 850_000 if category_slug != "mouse-pad" else 145_000
                price = config["base_price"] + (absolute_index % 15) * price_step
                discount = 6 + (absolute_index % 8) * 2
                product = Product.objects.create(
                    sku=sku,
                    name=name,
                    slug=f"{prefix.lower()}-bulk-{category_slug}-{sequence - 1:03d}",
                    category=category,
                    brand=brand,
                    short_description=f"{name} با طراحی حرفه‌ای، کیفیت ساخت مناسب و ضمانت معتبر.",
                    description=(
                        f"{name} برای استفاده {'گیمینگ و حرفه‌ای' if is_gaming else 'خانگی، اداری و حرفه‌ای'} "
                        "طراحی شده است. قیمت، موجودی، تصاویر و همه مشخصات این محصول از پنل مدیریت قابل ویرایش است."
                    ),
                    price=price,
                    discount_percent=discount,
                    stock=8 + (absolute_index % 24),
                    specifications={
                        **config["specs"], "مدل": str(model), "سری": family,
                        "برند": brand.name,
                        "نوع کاربری": "گیمینگ" if is_gaming else "عادی و حرفه‌ای",
                    },
                    warranty="۱۸ ماهه شرکتی",
                    available_colors=[
                        ["مشکی", "#111827"], ["سفید", "#f8fafc"],
                        ["قرمز", "#dc2626"],
                    ],
                    shipping_options=["عادی", "سریع", "ویژه"],
                    rating=str(4 + (absolute_index % 10) / 10),
                    is_active=True,
                    is_featured=created < 8,
                    is_gaming=is_gaming,
                    sold_count=20 + absolute_index * 7,
                    seo_title=name,
                    seo_description=f"خرید {name} با ضمانت، موجودی واقعی و ارسال سریع از فروشگاه 82.",
                    search_keywords=f"{name} {config['label']} {brand.name} {family} {'گیمینگ' if is_gaming else 'اداری ارگونومیک'}",
                )
                if profiles:
                    profiles[absolute_index % len(profiles)].products.add(product)
                if created < 12:
                    Recommendation.objects.get_or_create(
                        category=category,
                        product=product,
                        defaults={
                            "sort_order": 20 + (10 if is_gaming else 0) + created,
                            "is_active": True,
                        },
                    )
                if created < 8:
                    FlashSale.objects.get_or_create(
                        product=product,
                        title=f"پیشنهاد ویژه {config['label']}",
                        defaults={
                            "discount_percent": min(30, discount + 5),
                            "special_price": None,
                            "starts_at": starts_at,
                            "ends_at": ends_at,
                            "stock_limit": 0,
                            "sold_count": 0,
                            "is_active": True,
                        },
                    )
                created += 1


def remove_bulk_products(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    Product.objects.filter(sku__contains="-BULK-DESK-").delete()
    Product.objects.filter(sku__contains="-BULK-CHAIR-").delete()
    Product.objects.filter(sku__contains="-BULK-MOUSE-PAD-").delete()


class Migration(migrations.Migration):
    dependencies = [("catalog", "0046_desk_chair_mousepad_catalog")]
    operations = [migrations.RunPython(ensure_sixty_products, remove_bulk_products)]
