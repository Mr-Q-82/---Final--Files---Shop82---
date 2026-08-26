from django.db import migrations, models


def add_gaming_menu(apps, schema_editor):
    MenuItem = apps.get_model("catalog", "MenuItem")
    MenuItem.objects.update_or_create(
        target="gaming",
        defaults={
            "title": "🎮 محصولات گیمینگ",
            "sort_order": 55,
            "is_active": True,
        },
    )


class Migration(migrations.Migration):
    dependencies = [("catalog", "0023_promobanner")]

    operations = [
        migrations.AddField(
            model_name="product",
            name="is_gaming",
            field=models.BooleanField(default=False),
        ),
        migrations.RunPython(add_gaming_menu, migrations.RunPython.noop),
    ]
