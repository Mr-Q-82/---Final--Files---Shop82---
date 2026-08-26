from django.db import migrations


def seed_category_content(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    for category in Category.objects.all().iterator():
        name = category.name
        changed = []
        if not category.seo_title:
            category.seo_title = f"خرید {name} با ضمانت و ارسال سریع | فروشگاه 82"
            changed.append("seo_title")
        if not category.seo_description:
            category.seo_description = f"مقایسه قیمت و خرید انواع {name} اصل با مشخصات کامل، ضمانت، ارسال سریع و امکان مدیریت سفارش در فروشگاه 82."
            changed.append("seo_description")
        if not category.intro_text:
            category.intro_text = f"در این صفحه می‌توانید محصولات دسته {name} را براساس قیمت، موجودی، برند و امتیاز مقایسه کنید و گزینه مناسب نیاز خود را انتخاب کنید."
            changed.append("intro_text")
        if not category.buying_guide:
            category.buying_guide = f"برای انتخاب {name} ابتدا نوع استفاده، بودجه، ابعاد و سازگاری محصول را بررسی کنید. سپس مشخصات فنی، شرایط گارانتی و تجربه خریداران را با یکدیگر مقایسه کنید."
            changed.append("buying_guide")
        if not category.faq_items:
            category.faq_items = [
                {"question": f"چطور {name} مناسب را انتخاب کنیم؟", "answer": "نوع استفاده، بودجه، سازگاری، گارانتی و امتیاز خریداران را پیش از سفارش مقایسه کنید."},
                {"question": f"آیا محصولات {name} ضمانت دارند؟", "answer": "شرایط دقیق ضمانت و ارسال در صفحه هر محصول درج شده و پیش از پرداخت قابل بررسی است."},
            ]
            changed.append("faq_items")
        if changed:
            category.save(update_fields=changed)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0048_advanced_seo_fields")]
    operations = [migrations.RunPython(seed_category_content, migrations.RunPython.noop)]
