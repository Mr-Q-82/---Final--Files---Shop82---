from django.db import migrations, models
from datetime import timedelta


def normalize_catalog_data(apps, schema_editor):
    Product = apps.get_model("catalog", "Product")
    PriceHistory = apps.get_model("catalog", "PriceHistory")
    FlashSale = apps.get_model("catalog", "FlashSale")
    Product.objects.filter(discount_percent__gt=100).update(discount_percent=100)
    Product.objects.filter(rating__lt=0).update(rating=0)
    Product.objects.filter(rating__gt=5).update(rating=5)
    PriceHistory.objects.filter(discount_percent__gt=100).update(discount_percent=100)
    FlashSale.objects.filter(discount_percent__gt=100).update(discount_percent=100)
    for sale in FlashSale.objects.all().iterator():
        fields = []
        if sale.ends_at <= sale.starts_at:
            sale.ends_at = sale.starts_at + timedelta(seconds=1)
            fields.append("ends_at")
        if sale.stock_limit and sale.sold_count > sale.stock_limit:
            sale.sold_count = sale.stock_limit
            fields.append("sold_count")
        if fields:
            sale.save(update_fields=fields)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0044_limit_automatic_customization")]
    operations = [
        migrations.RunPython(normalize_catalog_data, migrations.RunPython.noop),
        migrations.AddConstraint(model_name="product", constraint=models.CheckConstraint(condition=models.Q(("discount_percent__lte", 100)), name="product_discount_lte_100")),
        migrations.AddConstraint(model_name="product", constraint=models.CheckConstraint(condition=models.Q(("rating__gte", 0), ("rating__lte", 5)), name="product_rating_0_5")),
        migrations.AddConstraint(model_name="pricehistory", constraint=models.CheckConstraint(condition=models.Q(("discount_percent__lte", 100)), name="price_history_discount_lte_100")),
        migrations.AddConstraint(model_name="flashsale", constraint=models.CheckConstraint(condition=models.Q(("discount_percent__lte", 100)), name="flash_discount_lte_100")),
        migrations.AddConstraint(model_name="flashsale", constraint=models.CheckConstraint(condition=models.Q(("ends_at__gt", models.F("starts_at"))), name="flash_valid_date_range")),
        migrations.AddConstraint(model_name="flashsale", constraint=models.CheckConstraint(condition=models.Q(("sold_count__lte", models.F("stock_limit")), ("stock_limit", 0), _connector="OR"), name="flash_sold_within_limit")),
    ]
