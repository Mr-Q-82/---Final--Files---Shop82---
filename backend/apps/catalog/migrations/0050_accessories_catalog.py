from datetime import timedelta

from django.db import migrations
from django.utils import timezone


PRODUCTS_PER_CATALOG = 12


def ensure_brand(Brand, name, slug):
    brand = Brand.objects.filter(slug=slug).first() or Brand.objects.filter(name__iexact=name).first()
    return brand or Brand.objects.create(name=name, slug=slug, is_active=True)


def add_accessories_catalog(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Brand = apps.get_model("catalog", "Brand")
    Product = apps.get_model("catalog", "Product")
    MenuItem = apps.get_model("catalog", "MenuItem")
    FlashSale = apps.get_model("catalog", "FlashSale")
    Recommendation = apps.get_model("catalog", "CategoryProductRecommendation")
    Usage = apps.get_model("catalog", "CategoryUsageProfile")

    category, _ = Category.objects.update_or_create(
        slug="accessories",
        defaults={
            "name": "لوازم جانبی",
            "icon": "gift",
            "subcategories": ["هاب و مبدل", "کابل", "شارژر", "پایه نگهدارنده", "وب‌کم", "ابزار نظافت"],
            "is_active": True,
            "sort_order": 220,
            "seo_title": "خرید لوازم جانبی کامپیوتر و لپ‌تاپ | فروشگاه 82",
            "seo_description": "خرید و مقایسه لوازم جانبی کامپیوتر و لپ‌تاپ شامل هاب، مبدل، کابل، شارژر، پایه و وب‌کم با ضمانت و ارسال سریع.",
            "intro_text": "لوازم جانبی مناسب، اتصال تجهیزات را ساده‌تر و استفاده روزانه از کامپیوتر و لپ‌تاپ را ایمن‌تر و حرفه‌ای‌تر می‌کند.",
            "buying_guide": "پیش از خرید نوع درگاه، توان، استاندارد اتصال، سازگاری با سیستم‌عامل، کیفیت ساخت و شرایط ضمانت را بررسی کنید.",
            "faq_items": [
                {"question": "چطور از سازگاری لوازم جانبی مطمئن شویم؟", "answer": "مدل دستگاه، نوع و نسخه درگاه، توان ورودی و سیستم‌عامل پشتیبانی‌شده را با مشخصات محصول تطبیق دهید."},
                {"question": "برای شارژر و هاب چه نکته‌ای مهم‌تر است؟", "answer": "توان واقعی، پروتکل‌های ایمنی، کیفیت کابل و اصالت کالا را در کنار ضمانت بررسی کنید."},
            ],
        },
    )

    MenuItem.objects.filter(target="off").delete()
    MenuItem.objects.filter(title__icontains="لوازم جانبی").exclude(target="accessories").delete()
    MenuItem.objects.update_or_create(
        target="accessories",
        defaults={"title": "لوازم جانبی", "sort_order": 110, "is_active": True},
    )

    usage_rows = [
        ("اتصال و توسعه درگاه", "connectivity", "هاب‌ها، مبدل‌ها و کابل‌های کاربردی"),
        ("میز کار حرفه‌ای", "workspace", "پایه، وب‌کم و تجهیزات میز کار"),
        ("حمل و سفر", "travel", "لوازم سبک و مقاوم برای استفاده همراه"),
        ("گیمینگ", "gaming", "اکسسوری مناسب ستاپ و بازی"),
    ]
    for catalog in ("NORMAL", "GAMING"):
        profiles = []
        for order, (name, slug, description) in enumerate(usage_rows, start=10):
            profile, _ = Usage.objects.update_or_create(
                category=category, catalog=catalog, slug=slug,
                defaults={"name": name, "description": description, "icon": "gift", "sort_order": order, "is_active": True},
            )
            profiles.append(profile)

        brands = [
            ensure_brand(Brand, "Baseus", "baseus"),
            ensure_brand(Brand, "UGREEN", "ugreen"),
            ensure_brand(Brand, "Anker", "anker"),
            ensure_brand(Brand, "Razer", "razer"),
        ]
        families = ["هاب USB-C", "وب‌کم Full HD", "پایه لپ‌تاپ", "مبدل چندکاره", "کابل پرسرعت", "شارژر GaN"]
        is_gaming = catalog == "GAMING"
        prefix = "GAM" if is_gaming else "REG"
        for index in range(PRODUCTS_PER_CATALOG):
            brand = brands[index % len(brands)]
            family = families[index % len(families)]
            number = index + 1
            sku = f"{prefix}-ACCESSORIES-{number:03d}"
            name = f"{family} {'گیمینگ ' if is_gaming else ''}{brand.name} مدل A{100 + number}"
            product, _ = Product.objects.update_or_create(
                sku=sku,
                defaults={
                    "name": name, "slug": f"{prefix.lower()}-accessories-{number:03d}",
                    "category": category, "brand": brand,
                    "short_description": f"{name} با کیفیت ساخت حرفه‌ای و ضمانت معتبر.",
                    "description": "این محصول از پنل مدیریت قابل ویرایش است و برای استفاده روزانه، حرفه‌ای و تجهیزات کامپیوتری طراحی شده است.",
                    "price": 890_000 + index * 275_000 + (1_200_000 if is_gaming else 0),
                    "discount_percent": 8 + index % 6, "stock": 10 + index * 2,
                    "specifications": {"نوع": family, "رابط": "USB / USB-C", "برند": brand.name, "کاربری": "گیمینگ" if is_gaming else "عمومی و حرفه‌ای"},
                    "warranty": "۱۸ ماهه شرکتی", "available_colors": [["مشکی", "#111827"], ["سفید", "#f8fafc"]],
                    "shipping_options": ["عادی", "سریع", "ویژه"], "rating": str(4 + (index % 9) / 10),
                    "is_active": True, "is_featured": index < 8, "is_gaming": is_gaming, "sold_count": 25 + index * 11,
                    "seo_title": name, "seo_description": f"خرید {name} با ضمانت و ارسال سریع از فروشگاه 82.",
                    "search_keywords": f"{name} لوازم جانبی اکسسوری هاب مبدل کابل شارژر وب کم",
                },
            )
            profiles[index % len(profiles)].products.add(product)
            if index < 8:
                Recommendation.objects.update_or_create(
                    category=category, product=product,
                    defaults={"sort_order": 10 + index + (20 if is_gaming else 0), "is_active": True},
                )
                FlashSale.objects.update_or_create(
                    product=product, title="پیشنهاد ویژه لوازم جانبی",
                    defaults={"discount_percent": 15 + index % 6, "special_price": None,
                              "starts_at": timezone.now() - timedelta(days=1), "ends_at": timezone.now() + timedelta(days=365),
                              "stock_limit": 0, "sold_count": 0, "is_active": True},
                )


def remove_accessories_catalog(apps, schema_editor):
    MenuItem = apps.get_model("catalog", "MenuItem")
    Product = apps.get_model("catalog", "Product")
    Category = apps.get_model("catalog", "Category")
    MenuItem.objects.filter(target="accessories").delete()
    Product.objects.filter(sku__contains="-ACCESSORIES-").delete()
    Category.objects.filter(slug="accessories").delete()


class Migration(migrations.Migration):
    dependencies = [("catalog", "0049_seed_category_seo_content")]
    operations = [migrations.RunPython(add_accessories_catalog, remove_accessories_catalog)]
