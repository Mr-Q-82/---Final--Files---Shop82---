from django.db import models
from django.conf import settings
from django.utils.text import slugify
from django.utils.text import get_valid_filename
from django.utils import timezone
from apps.common.models import TimeStampedModel


def _safe_media_segment(value, fallback):
    """Return a traversal-safe folder name while keeping Persian slugs readable."""
    value = str(value or "").strip().replace("\\", "-").replace("/", "-")
    value = value.strip(". ")
    return value or fallback


def _safe_media_filename(filename):
    filename = str(filename or "image").replace("\\", "/").rsplit("/", 1)[-1]
    return get_valid_filename(filename) or "image"


def product_main_image_upload_to(instance, filename):
    category_slug = _safe_media_segment(
        getattr(getattr(instance, "category", None), "slug", None),
        "uncategorized",
    )
    product_slug = _safe_media_segment(
        instance.slug or slugify(instance.name, allow_unicode=True),
        "product",
    )
    return "/".join(
        ("products", category_slug, product_slug, "main", _safe_media_filename(filename))
    )


def product_gallery_image_upload_to(instance, filename):
    product = instance.product
    category_slug = _safe_media_segment(
        getattr(getattr(product, "category", None), "slug", None),
        "uncategorized",
    )
    product_slug = _safe_media_segment(
        product.slug or slugify(product.name, allow_unicode=True),
        "product",
    )
    return "/".join(
        ("products", category_slug, product_slug, "gallery", _safe_media_filename(filename))
    )


__all__ = [name for name in globals() if not name.startswith('__')]
