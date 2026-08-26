import apps.common.uploads
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0013_security_and_wallet_ledger")]
    operations = [
        migrations.AlterField(
            model_name="ticketmessage", name="attachment",
            field=models.FileField(blank=True, upload_to="tickets/%Y/%m/", validators=[apps.common.uploads.validate_support_attachment]),
        )
    ]
