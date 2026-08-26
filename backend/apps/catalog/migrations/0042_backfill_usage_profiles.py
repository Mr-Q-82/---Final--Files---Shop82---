from django.db import migrations


TEMPLATES = {
    "laptop": [("گیمینگ", "laptop"), ("برنامه‌نویسی", "keyboard"), ("دانشجویی", "laptop"), ("اداری", "case"), ("مهندسی", "cpu"), ("طراحی و تولید محتوا", "gpu"), ("استفاده روزمره", "mouse")],
    "cpu": [("گیمینگ", "cpu"), ("رندرینگ", "gpu"), ("مهندسی", "cpu"), ("سیستم اداری", "case"), ("سرور و پردازش سنگین", "motherboard")],
    "gpu": [("گیمینگ", "gpu"), ("رندر سه‌بعدی", "gpu"), ("هوش مصنوعی", "cpu"), ("طراحی و تدوین", "monitor"), ("کار حرفه‌ای", "motherboard")],
    "ram": [("گیمینگ", "ram"), ("برنامه‌نویسی", "keyboard"), ("رندرینگ", "gpu"), ("اداری", "case"), ("سرور", "motherboard")],
    "ssd": [("گیمینگ", "ssd"), ("ارتقای لپ‌تاپ", "laptop"), ("آرشیو سریع", "ssd"), ("تدوین و محتوا", "monitor"), ("استفاده روزمره", "case")],
    "monitor": [("گیمینگ", "monitor"), ("طراحی گرافیک", "gpu"), ("برنامه‌نویسی", "keyboard"), ("اداری", "case"), ("تدوین ویدئو", "monitor")],
    "mouse": [("گیمینگ", "mouse"), ("طراحی", "mouse"), ("ارگونومیک", "mouse"), ("اداری", "case"), ("قابل حمل", "laptop")],
    "keyboard": [("گیمینگ", "keyboard"), ("برنامه‌نویسی", "keyboard"), ("تایپ حرفه‌ای", "keyboard"), ("اداری", "case"), ("طراحی", "monitor")],
    "headphone": [("گیمینگ", "headphone"), ("موسیقی", "headphone"), ("تماس و جلسه", "speaker"), ("استودیو", "headphone"), ("استفاده روزمره", "headphone")],
    "case": [("گیمینگ", "case"), ("رندرینگ", "gpu"), ("مهندسی", "cpu"), ("اداری", "case"), ("برنامه‌نویسی", "keyboard"), ("خانگی", "case")],
    "motherboard": [("گیمینگ", "motherboard"), ("اورکلاک", "cpu"), ("ورک‌استیشن", "gpu"), ("اداری", "case"), ("ارتقای سیستم", "motherboard")],
    "hdd": [("آرشیو اطلاعات", "ssd"), ("دوربین و نظارت", "monitor"), ("استفاده خانگی", "case"), ("ذخیره پشتیبان", "ssd"), ("سرور", "motherboard")],
    "battery": [("استفاده روزمره", "laptop"), ("سفر و قابل حمل", "laptop"), ("کار طولانی", "battery"), ("دانشجویی", "laptop")],
    "cooling": [("گیمینگ", "fan"), ("رندرینگ", "cpu"), ("خنک‌کاری لپ‌تاپ", "laptop"), ("سیستم کم‌صدا", "fan"), ("اورکلاک", "motherboard")],
    "default": [("استفاده روزمره", "case"), ("حرفه‌ای", "cpu"), ("اقتصادی", "mouse"), ("گیمینگ", "gpu")],
}


def category_key(category):
    value = f"{category.slug} {category.name}".lower()
    checks = [
        ("laptop", ("laptop", "لپ", "لب")), ("cpu", ("cpu", "پردازنده")),
        ("gpu", ("gpu", "گرافیک")), ("ram", ("ram", "رم")),
        ("ssd", ("ssd",)), ("monitor", ("monitor", "مانیتور")),
        ("mouse", ("mouse", "ماوس")), ("keyboard", ("keyboard", "کیبورد")),
        ("headphone", ("headphone", "هدفون")), ("motherboard", ("motherboard", "مادربرد")),
        ("case", ("case", "کیس")), ("hdd", ("hdd", "هارد")),
        ("battery", ("battery", "باتری")), ("cooling", ("fan", "cool", "فن", "کول")),
    ]
    return next((key for key, words in checks if any(word in value for word in words)), "default")


def backfill_usage_profiles(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    Usage = apps.get_model("catalog", "CategoryUsageProfile")
    Product = apps.get_model("catalog", "Product")

    for category in Category.objects.all().iterator():
        templates = TEMPLATES[category_key(category)]
        for catalog, is_gaming in (("NORMAL", False), ("GAMING", True)):
            managed = list(Usage.objects.filter(
                category=category, catalog=catalog, slug__startswith="usage-"
            ).order_by("sort_order", "created_at"))
            profiles = []
            for index, (name, icon) in enumerate(templates):
                if index < len(managed):
                    profile = managed[index]
                    profile.name = name
                    profile.icon = icon
                    profile.description = f"محصولات مناسب {name}"
                    profile.sort_order = index
                    profile.is_active = True
                    profile.save(update_fields=("name", "icon", "description", "sort_order", "is_active"))
                else:
                    profile = Usage.objects.create(
                        category=category,
                        catalog=catalog,
                        slug=f"usage-{catalog.lower()}-{index + 1}",
                        name=name,
                        icon=icon,
                        description=f"محصولات مناسب {name}",
                        sort_order=index,
                        is_active=True,
                    )
                profiles.append(profile)
            products = list(Product.objects.filter(category=category, is_gaming=is_gaming).order_by("id"))
            if profiles and products and not any(profile.products.exists() for profile in profiles):
                for index, product in enumerate(products):
                    profiles[index % len(profiles)].products.add(product)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0041_category_usage_and_customization")]
    operations = [migrations.RunPython(backfill_usage_profiles, migrations.RunPython.noop)]
