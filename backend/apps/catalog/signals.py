from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Category
from .default_customization import ensure_category_customization


@receiver(post_save, sender=Category, dispatch_uid="catalog_default_customization")
def create_default_customization_for_category(
    sender, instance, created, raw=False, **kwargs
):
    # Django sends post_save with raw=True while loaddata is restoring a
    # fixture. Creating defaults at that point duplicates the customization
    # rows that are already present in the backup and aborts the restore.
    if created and not raw:
        ensure_category_customization(instance)
