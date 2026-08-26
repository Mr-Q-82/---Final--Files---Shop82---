from pathlib import Path
from django.core.exceptions import ValidationError
from PIL import Image


ALLOWED_IMAGE_TYPES = {"JPEG", "PNG", "WEBP", "AVIF"}


def validate_image_upload(file, max_bytes=10 * 1024 * 1024):
    if not file:
        return
    if file.size > max_bytes:
        raise ValidationError("حجم تصویر بیش از حد مجاز است.")
    extension = Path(file.name).suffix.lower()
    if extension not in {".jpg", ".jpeg", ".png", ".webp", ".avif"}:
        raise ValidationError("پسوند تصویر مجاز نیست.")
    position = file.tell()
    try:
        image = Image.open(file)
        image.verify()
        if image.format not in ALLOWED_IMAGE_TYPES:
            raise ValidationError("محتوای فایل یک تصویر مجاز نیست.")
    except (OSError, ValueError) as exc:
        raise ValidationError("فایل تصویر خراب یا نامعتبر است.") from exc
    finally:
        file.seek(position)


def validate_support_attachment(file):
    if not file:
        return
    if file.size > 10 * 1024 * 1024:
        raise ValidationError("حجم پیوست بیش از ۱۰ مگابایت است.")
    if Path(file.name).suffix.lower() not in {".jpg", ".jpeg", ".png", ".webp", ".pdf"}:
        raise ValidationError("نوع فایل پیوست مجاز نیست.")
