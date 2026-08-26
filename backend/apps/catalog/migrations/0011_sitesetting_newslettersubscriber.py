import uuid
from django.db import migrations, models


def create_default_setting(apps, schema_editor):
    SiteSetting = apps.get_model("catalog", "SiteSetting")
    SiteSetting.objects.get_or_create()


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0010_product_canonical_url_product_seo_description_and_more"),
    ]

    operations = [
        migrations.CreateModel(
            name="SiteSetting",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("site_name", models.CharField(default="تک‌استور", max_length=120)),
                ("logo", models.ImageField(blank=True, upload_to="site/")),
                ("footer_text", models.CharField(default="© ۱۴۰۵ تک‌استور · تمامی حقوق محفوظ است · طراحی و توسعه اختصاصی", max_length=300)),
                ("mega_promo_title", models.CharField(default="پیشنهاد ویژه هفته", max_length=180)),
                ("mega_promo_subtitle", models.CharField(default="تا ۳۵٪ تخفیف روی کارت‌های گرافیک گیمینگ", max_length=320)),
                ("category_title", models.CharField(default="دسته‌بندی محصولات", max_length=180)),
                ("category_subtitle", models.CharField(default="دسته مورد نظر خود را انتخاب کنید", max_length=320)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"abstract": False},
        ),
        migrations.CreateModel(
            name="NewsletterSubscriber",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("email", models.EmailField(max_length=254, unique=True)),
                ("is_active", models.BooleanField(default=True)),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.RunPython(create_default_setting, migrations.RunPython.noop),
    ]
