from django.db import migrations, models


def configure_product_sections(apps, schema_editor):
    HomeSection = apps.get_model("catalog", "HomeSection")
    defaults = [
        ("offers", "پیشنهادهای شگفت‌انگیز", "تخفیف‌های محدود", 20, "DISCOUNT"),
        ("best_sellers", "پرفروش‌ترین‌ها", "محبوب‌ترین انتخاب مشتریان", 21, "BEST_SELLING"),
        ("newest", "جدیدترین محصولات", "تازه‌ترین کالاهای فروشگاه", 22, "NEWEST"),
    ]
    for key, title, subtitle, order, ordering in defaults:
        section, _ = HomeSection.objects.get_or_create(
            key=key,
            defaults={"title": title, "subtitle": subtitle, "sort_order": order, "is_active": True},
        )
        section.product_ordering = ordering
        section.product_limit = 4
        section.save(update_fields=["product_ordering", "product_limit"])


class Migration(migrations.Migration):
    dependencies = [("catalog", "0017_alter_sitesetting_footer_text_and_more")]
    operations = [
        migrations.AddField(
            model_name="homesection",
            name="product_limit",
            field=models.PositiveSmallIntegerField(default=4),
        ),
        migrations.AddField(
            model_name="homesection",
            name="product_ordering",
            field=models.CharField(
                choices=[
                    ("BEST_SELLING", "پرفروش‌ترین"), ("NEWEST", "جدیدترین"),
                    ("DISCOUNT", "بیشترین تخفیف"), ("RATING", "بالاترین امتیاز"),
                    ("PRICE_ASC", "ارزان‌ترین"), ("PRICE_DESC", "گران‌ترین"),
                ],
                default="NEWEST", max_length=20,
            ),
        ),
        migrations.RunPython(configure_product_sections, migrations.RunPython.noop),
    ]
