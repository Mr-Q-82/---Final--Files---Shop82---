"""Built-in product configuration presets.

Only products whose hardware can genuinely be configured receive built-in
presets. Admin-defined, product-scoped groups are preserved for exceptional
products in other categories.
"""

DEFAULT_GROUPS = {
    "laptop": [
        ("پردازنده", "cpu", (("Core i5", 0), ("Core i7", 8_000_000), ("Core i9", 18_000_000))),
        ("حافظه RAM", "ram", (("۸ گیگابایت", 0), ("۱۶ گیگابایت", 3_500_000), ("۳۲ گیگابایت", 8_500_000))),
        ("حافظه ذخیره‌سازی", "storage", (("SSD 512GB", 0), ("SSD 1TB", 4_500_000), ("SSD 2TB", 10_000_000))),
    ],
    "case": [
        ("سطح عملکرد", "performance", (("استاندارد", 0), ("حرفه‌ای", 7_500_000), ("گیمینگ", 15_000_000))),
        ("حافظه RAM", "ram", (("۱۶ گیگابایت", 0), ("۳۲ گیگابایت", 6_000_000), ("۶۴ گیگابایت", 15_000_000))),
        ("فضای ذخیره‌سازی", "storage", (("SSD 512GB", 0), ("SSD 1TB", 4_000_000), ("SSD 2TB", 9_500_000))),
    ],
    "ram": [("ظرفیت", "capacity", (("۸ گیگابایت", 0), ("۱۶ گیگابایت", 2_500_000), ("۳۲ گیگابایت", 7_000_000)))],
    "ssd": [("ظرفیت", "capacity", (("۵۱۲ گیگابایت", 0), ("۱ ترابایت", 3_000_000), ("۲ ترابایت", 8_000_000)))],
    "hdd": [("ظرفیت", "capacity", (("۱ ترابایت", 0), ("۲ ترابایت", 2_000_000), ("۴ ترابایت", 5_500_000)))],
    "cpu": [("رده عملکرد", "performance", (("استاندارد", 0), ("حرفه‌ای", 5_000_000), ("پرچمدار", 12_000_000)))],
    "gpu": [("حافظه گرافیکی", "vram", (("۸ گیگابایت", 0), ("۱۲ گیگابایت", 7_000_000), ("۱۶ گیگابایت", 15_000_000)))],
    "monitor": [("نرخ نوسازی", "refresh-rate", (("۷۵ هرتز", 0), ("۱۴۴ هرتز", 4_000_000), ("۲۴۰ هرتز", 10_000_000)))],
    "mouse": [("نوع اتصال", "connection", (("باسیم", 0), ("بی‌سیم", 800_000), ("دوحالته", 1_400_000)))],
    "keyboard": [("نوع کلید", "switch", (("ممبرین", 0), ("مکانیکال", 1_500_000), ("اپتیکال", 3_000_000)))],
    "headphone": [("نوع اتصال", "connection", (("باسیم", 0), ("بلوتوث", 1_000_000), ("دانگل کم‌تأخیر", 2_000_000)))],
    "motherboard": [("رده چیپست", "chipset", (("استاندارد", 0), ("حرفه‌ای", 4_000_000), ("اورکلاک", 9_000_000)))],
    "battery": [("ظرفیت", "capacity", (("استاندارد", 0), ("ظرفیت بالا", 1_500_000)))],
    "cooling": [("توان خنک‌کنندگی", "cooling", (("استاندارد", 0), ("حرفه‌ای", 1_200_000), ("پرفورمنس", 2_800_000)))],
    "desk": [("ابعاد میز", "size", (("استاندارد", 0), ("بزرگ", 2_500_000), ("L شکل", 5_500_000)))],
    "chair": [("روکش صندلی", "cover", (("پارچه‌ای", 0), ("چرم مصنوعی", 1_500_000), ("مش حرفه‌ای", 2_800_000)))],
    "mousepad": [("ابعاد موس‌پد", "size", (("متوسط", 0), ("بزرگ", 350_000), ("Desk Mat", 650_000)))],
    "default": [("نسخه محصول", "configuration", (("استاندارد", 0), ("حرفه‌ای", 1_000_000), ("پریمیوم", 2_500_000)))],
}

# A mouse, keyboard, monitor or standalone component can have variants, but it
# is not assembled to the customer's requested hardware configuration. Keep
# automatic configuration limited to products that can actually be built or
# upgraded before dispatch.
CONFIGURABLE_TEMPLATE_KEYS = frozenset({"laptop", "case"})


def category_template_key(category):
    value = f"{category.slug} {category.name}".lower()
    checks = (
        # Specific laptop parts must be classified before the broad "laptop"
        # keyword, otherwise a laptop battery or laptop HDD becomes a laptop.
        ("hdd", ("hdd", "هارد")),
        ("battery", ("battery", "باتری")),
        ("motherboard", ("motherboard", "مادربرد", "برد")),
        ("cooling", ("fan", "cool", "فن", "کول")),
        ("laptop", ("laptop", "لپ", "لب")), ("cpu", ("cpu", "پردازنده")),
        ("gpu", ("gpu", "گرافیک")), ("ram", ("ram", "رم")),
        ("ssd", ("ssd",)), ("monitor", ("monitor", "مانیتور")),
        ("mousepad", ("mouse-pad", "mousepad", "موس پد", "موس‌پد", "ماوس پد")),
        ("mouse", ("mouse", "ماوس")), ("keyboard", ("keyboard", "کیبورد")),
        ("headphone", ("headphone", "هدفون")),
        ("desk", ("desk", "میز")), ("chair", ("chair", "صندلی")),
        ("case", ("case", "کیس", "desktop", "کامپیوتر رومیزی", "سیستم آماده")),
    )
    return next((key for key, words in checks if any(word in value for word in words)), "default")


def category_supports_customization(category):
    return category_template_key(category) in CONFIGURABLE_TEMPLATE_KEYS


def ensure_category_customization(category):
    from apps.products.models import CustomizationGroup, CustomizationOption

    template_key = category_template_key(category)
    if template_key not in CONFIGURABLE_TEMPLATE_KEYS:
        return

    templates = DEFAULT_GROUPS[template_key]
    for group_order, (name, code, options) in enumerate(templates):
        group, _ = CustomizationGroup.objects.get_or_create(
            category=category,
            catalog=CustomizationGroup.Catalog.BOTH,
            code=code,
            defaults={
                "name": name,
                "help_text": "گزینه مناسب را براساس نیاز خود انتخاب کنید.",
                "applies_to_all_products": True,
                "is_required": True,
                "sort_order": group_order,
                "is_active": True,
            },
        )
        for option_order, (option_name, price_delta) in enumerate(options):
            CustomizationOption.objects.get_or_create(
                group=group,
                name=option_name,
                defaults={
                    "value": option_name,
                    "price_delta": price_delta,
                    "is_default": option_order == 0,
                    "is_active": True,
                    "sort_order": option_order,
                },
            )
