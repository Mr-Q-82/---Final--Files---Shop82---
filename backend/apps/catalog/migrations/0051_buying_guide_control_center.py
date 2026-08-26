from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("catalog", "0050_accessories_catalog")]
    operations = [
        migrations.AddField(model_name="sitesetting", name="guides_enabled", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="sitesetting", name="guides_eyebrow", field=models.CharField(default="مرکز دانش فروشگاه ۸۲", max_length=120)),
        migrations.AddField(model_name="sitesetting", name="guides_title", field=models.CharField(default="راهنمای جامع و تخصصی خرید", max_length=180)),
        migrations.AddField(model_name="sitesetting", name="guides_description", field=models.CharField(default="از انتخاب دسته‌بندی تا مقایسه مدل‌ها، بررسی سازگاری و تصمیم نهایی؛ همه اطلاعات در یک مسیر ساده قرار گرفته است.", max_length=500)),
        migrations.AddField(model_name="sitesetting", name="guides_search_placeholder", field=models.CharField(default="جست‌وجوی دسته یا موضوع...", max_length=180)),
        migrations.AddField(model_name="sitesetting", name="guides_header_button_title", field=models.CharField(default="راهنمای خرید", max_length=80)),
        migrations.AddField(model_name="sitesetting", name="guides_header_button_subtitle", field=models.CharField(default="انتخاب حرفه‌ای", max_length=100)),
        migrations.AddField(model_name="sitesetting", name="guides_show_product_tabs", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="sitesetting", name="guides_show_mistakes", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="sitesetting", name="guides_show_faq", field=models.BooleanField(default=True)),
        migrations.AddField(model_name="buyingguide", name="product", field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="buying_guides", to="catalog.product")),
        migrations.AddField(model_name="buyingguide", name="criteria", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="buyingguide", name="common_mistakes", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="buyingguide", name="checklist", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="buyingguide", name="faq_items", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="buyingguide", name="accent_color", field=models.CharField(blank=True, default="#6d28d9", max_length=20)),
        migrations.AddField(model_name="buyingguide", name="sort_order", field=models.PositiveIntegerField(default=0)),
        migrations.AddField(model_name="buyingguide", name="is_featured", field=models.BooleanField(default=False)),
        migrations.AddField(model_name="buyingguide", name="show_in_category_accordion", field=models.BooleanField(default=True)),
        migrations.AlterModelOptions(name="buyingguide", options={"ordering": ("sort_order", "title")}),
    ]
