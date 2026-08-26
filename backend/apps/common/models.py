import uuid
from django.db import models

class TimeStampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        abstract = True


class WebVitalEvent(TimeStampedModel):
    metric = models.CharField(max_length=20, db_index=True)
    value = models.FloatField()
    rating = models.CharField(max_length=20, blank=True)
    path = models.CharField(max_length=500)
    navigation_type = models.CharField(max_length=30, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)

    class Meta:
        indexes = [models.Index(fields=("metric", "-created_at"), name="vital_metric_created_idx")]
