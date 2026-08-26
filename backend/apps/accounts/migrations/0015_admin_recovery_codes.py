import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("accounts", "0014_secure_upload_validators")]
    operations = [
        migrations.CreateModel(
            name="AdminRecoveryCode",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("code_hash", models.CharField(max_length=128)),
                ("used_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="recovery_codes", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.AddIndex(model_name="adminrecoverycode", index=models.Index(fields=["user", "used_at"], name="recovery_user_used_idx")),
    ]
