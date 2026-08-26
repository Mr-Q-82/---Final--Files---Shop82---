import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="WebVitalEvent",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("metric", models.CharField(db_index=True, max_length=20)),
                ("value", models.FloatField()),
                ("rating", models.CharField(blank=True, max_length=20)),
                ("path", models.CharField(max_length=500)),
                ("navigation_type", models.CharField(blank=True, max_length=30)),
                ("user_agent", models.CharField(blank=True, max_length=300)),
            ],
        ),
        migrations.AddIndex(model_name="webvitalevent", index=models.Index(fields=["metric", "-created_at"], name="vital_metric_created_idx")),
    ]
