from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0009_loyaltysetting_notification_targets_user_soft_delete")]

    operations = [
        migrations.AddIndex(
            model_name="user",
            index=models.Index(
                fields=["role", "-created_at"],
                name="user_role_created_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="user",
            index=models.Index(
                fields=["role", "is_active", "is_deleted"],
                name="user_role_active_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="notification",
            index=models.Index(
                fields=["user", "is_read", "-created_at"],
                name="notif_user_read_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="otp",
            index=models.Index(
                fields=["phone", "purpose", "is_used", "-created_at"],
                name="otp_lookup_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="supportticket",
            index=models.Index(
                fields=["user", "status", "-updated_at"],
                name="ticket_user_status_idx",
            ),
        ),
    ]
