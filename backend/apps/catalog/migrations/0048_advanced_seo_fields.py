from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0047_ensure_sixty_furniture_products")]
    operations = [
        migrations.AddField(model_name="category", name="intro_text", field=models.TextField(blank=True)),
        migrations.AddField(model_name="category", name="buying_guide", field=models.TextField(blank=True)),
        migrations.AddField(model_name="category", name="faq_items", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="sitesetting", name="bing_site_verification", field=models.CharField(blank=True, max_length=180)),
        migrations.AddField(model_name="sitesetting", name="organization_phone", field=models.CharField(blank=True, max_length=30)),
        migrations.AddField(model_name="sitesetting", name="organization_email", field=models.EmailField(blank=True, max_length=254)),
        migrations.AddField(model_name="sitesetting", name="organization_address", field=models.CharField(blank=True, max_length=300)),
        migrations.AddField(model_name="sitesetting", name="organization_social_links", field=models.JSONField(blank=True, default=list)),
        migrations.AddField(model_name="sitesetting", name="merchant_name", field=models.CharField(blank=True, max_length=160)),
        migrations.AddField(model_name="sitesetting", name="shipping_cost", field=models.PositiveBigIntegerField(default=0)),
        migrations.AddField(model_name="sitesetting", name="shipping_min_days", field=models.PositiveSmallIntegerField(default=1)),
        migrations.AddField(model_name="sitesetting", name="shipping_max_days", field=models.PositiveSmallIntegerField(default=5)),
        migrations.AddField(model_name="sitesetting", name="return_window_days", field=models.PositiveSmallIntegerField(default=7)),
        migrations.AddField(model_name="product", name="gtin", field=models.CharField(blank=True, db_index=True, max_length=14)),
        migrations.AddField(model_name="product", name="mpn", field=models.CharField(blank=True, max_length=80)),
        migrations.AddField(model_name="product", name="material", field=models.CharField(blank=True, max_length=120)),
        migrations.AddField(model_name="product", name="product_group_id", field=models.CharField(blank=True, db_index=True, max_length=80)),
    ]
