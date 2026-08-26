from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def update_default_inviter_bonus(apps, schema_editor):
    LoyaltySetting = apps.get_model("accounts", "LoyaltySetting")
    LoyaltySetting.objects.filter(inviter_bonus=200).update(inviter_bonus=50)


class Migration(migrations.Migration):
    dependencies = [("accounts", "0011_loyaltymission_loyaltysetting_point_expiry_days_and_more")]

    operations = [
        migrations.AlterField(
            model_name="loyaltysetting",
            name="inviter_bonus",
            field=models.PositiveIntegerField(default=50),
        ),
        migrations.CreateModel(
            name="ReferralEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("referral_code", models.CharField(db_index=True, max_length=16)),
                ("inviter_points_awarded", models.PositiveIntegerField(default=50)),
                ("invited_points_awarded", models.PositiveIntegerField(default=0)),
                ("admin_note", models.CharField(blank=True, max_length=240)),
                ("invited_user", models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name="registration_referral", to=settings.AUTH_USER_MODEL)),
                ("inviter", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="successful_referrals", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ("-created_at",)},
        ),
        migrations.AddIndex(
            model_name="referralevent",
            index=models.Index(fields=["inviter", "-created_at"], name="referral_inviter_idx"),
        ),
        migrations.RunPython(update_default_inviter_bonus, migrations.RunPython.noop),
    ]
