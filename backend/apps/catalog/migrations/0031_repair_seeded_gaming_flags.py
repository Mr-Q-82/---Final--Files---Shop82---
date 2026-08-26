from django.db import migrations


def repair_seeded_gaming_flags(apps, schema_editor):
    """Repair gaming rows created by older seed/import versions.

    Only the project's reserved GAM-* SKU namespace is changed. Products
    created by an administrator remain fully controlled by the is_gaming
    checkbox.
    """
    Product = apps.get_model("catalog", "Product")
    Product.objects.filter(sku__startswith="GAM-").update(is_gaming=True)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0030_organize_product_media_paths")]

    operations = [
        migrations.RunPython(repair_seeded_gaming_flags, migrations.RunPython.noop),
    ]
