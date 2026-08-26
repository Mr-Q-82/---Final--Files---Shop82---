import uuid
from django.db import migrations, models


def create_default_loyalty_setting(apps, schema_editor):
    LoyaltySetting = apps.get_model("accounts", "LoyaltySetting")
    LoyaltySetting.objects.get_or_create()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0008_normalize_legacy_phone_numbers"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="is_deleted",
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name="user",
            name="deleted_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="notification",
            name="target_section",
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name="notification",
            name="target_id",
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.CreateModel(
            name="LoyaltySetting",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("purchase_step_amount", models.PositiveBigIntegerField(default=100000, help_text="به‌ازای هر چند تومان خرید امتیاز داده شود")),
                ("points_per_step", models.PositiveIntegerField(default=1)),
                ("toman_per_point", models.PositiveIntegerField(default=1000)),
                ("min_redeem_points", models.PositiveIntegerField(default=100)),
                ("invited_user_bonus", models.PositiveIntegerField(default=100)),
                ("inviter_bonus", models.PositiveIntegerField(default=200)),
                ("silver_threshold", models.PositiveIntegerField(default=1000)),
                ("gold_threshold", models.PositiveIntegerField(default=5000)),
                ("is_active", models.BooleanField(default=True)),
            ],
        ),
        migrations.RunPython(
            create_default_loyalty_setting,
            migrations.RunPython.noop,
        ),
    ]
