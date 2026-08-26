import secrets
import string
from django.db import migrations


def populate_tracking_codes(apps, schema_editor):
    Order = apps.get_model("orders", "Order")
    used = set(Order.objects.exclude(tracking_code="").values_list("tracking_code", flat=True))
    for order in Order.objects.filter(tracking_code="").iterator():
        while True:
            code = "TSK-" + "".join(secrets.choice(string.digits) for _ in range(16))
            if code not in used:
                used.add(code)
                order.tracking_code = code
                order.save(update_fields=["tracking_code"])
                break


class Migration(migrations.Migration):
    dependencies = [
        ("orders", "0007_returnrequest_refund_paid"),
    ]

    operations = [
        migrations.RunPython(populate_tracking_codes, migrations.RunPython.noop),
    ]
