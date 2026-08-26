from django.contrib.auth.hashers import identify_hasher, make_password
from django.db import migrations, models


def hash_legacy_codes(apps, schema_editor):
    for model_name in ("OTP", "EmailVerification"):
        model = apps.get_model("accounts", model_name)
        for item in model.objects.all().only("id", "code").iterator():
            try:
                identify_hasher(item.code)
            except ValueError:
                item.code = make_password(item.code)
                item.save(update_fields=["code"])


class Migration(migrations.Migration):
    dependencies = [("accounts", "0012_referralevent_inviter_bonus_default")]
    operations = [
        migrations.AddField(model_name="user", name="failed_login_attempts", field=models.PositiveSmallIntegerField(default=0)),
        migrations.AddField(model_name="user", name="locked_until", field=models.DateTimeField(blank=True, null=True)),
        migrations.AddField(model_name="user", name="credentials_changed_at", field=models.DateTimeField(blank=True, null=True)),
        migrations.AlterField(model_name="otp", name="code", field=models.CharField(max_length=128)),
        migrations.AlterField(model_name="emailverification", name="code", field=models.CharField(max_length=128)),
        migrations.AddField(model_name="wallettransaction", name="balance_before", field=models.PositiveBigIntegerField(default=0)),
        migrations.AddField(model_name="wallettransaction", name="idempotency_key", field=models.CharField(blank=True, max_length=100, null=True, unique=True)),
        migrations.AddConstraint(
            model_name="wallettransaction",
            constraint=models.CheckConstraint(condition=models.Q(("amount__gt", 0)), name="wallet_tx_amount_gt_zero"),
        ),
        migrations.RunPython(hash_legacy_codes, migrations.RunPython.noop),
    ]
