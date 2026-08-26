from django.db import migrations


def normalize_legacy_phones(apps, schema_editor):
    User = apps.get_model("accounts", "User")
    for user in User.objects.filter(phone__startswith="09").iterator():
        normalized = "+98" + user.phone[1:]
        if not User.objects.exclude(pk=user.pk).filter(phone=normalized).exists():
            user.phone = normalized
            user.save(update_fields=["phone"])


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0007_notification_broadcast_id_notification_created_by"),
    ]

    operations = [
        migrations.RunPython(normalize_legacy_phones, migrations.RunPython.noop),
    ]
