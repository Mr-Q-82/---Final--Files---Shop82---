from django.db import migrations


OLD_TITLE = "تکنولوژی فردا، امروز در دستان شما"
NEW_TITLE = "فناوری را لمس کن، متفاوت انتخاب کن"


def update_title(apps, schema_editor):
    HomeSection = apps.get_model("catalog", "HomeSection")
    HomeSection.objects.filter(key="hero", title=OLD_TITLE).update(title=NEW_TITLE)


def restore_title(apps, schema_editor):
    HomeSection = apps.get_model("catalog", "HomeSection")
    HomeSection.objects.filter(key="hero", title=NEW_TITLE).update(title=OLD_TITLE)


class Migration(migrations.Migration):
    dependencies = [("catalog", "0033_sitesetting_hero_marketing_cards")]
    operations = [migrations.RunPython(update_title, restore_title)]
