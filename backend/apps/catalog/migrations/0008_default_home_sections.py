from django.db import migrations


def create_sections(apps, schema_editor):
    HomeSection = apps.get_model("catalog", "HomeSection")
    defaults = [
        ("hero", "تکنولوژی فردا، امروز در دستان شما", "بنر و معرفی اصلی فروشگاه", 0),
        ("featured", "محصولات ویژه", "انتخاب‌های محبوب تک‌استور", 10),
        ("offers", "پیشنهادهای شگفت‌انگیز", "تخفیف‌های محدود", 20),
        ("about", "درباره تک‌استور", "فروشگاه تخصصی محصولات دیجیتال", 30),
        ("contact", "تماس با ما", "پشتیبانی و راه‌های ارتباطی", 40),
    ]
    for key, title, subtitle, order in defaults:
        HomeSection.objects.get_or_create(
            key=key,
            defaults={
                "title": title,
                "subtitle": subtitle,
                "sort_order": order,
                "is_active": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0007_homesection_comparisonitem_favorite_productreview")]
    operations = [migrations.RunPython(create_sections, migrations.RunPython.noop)]
