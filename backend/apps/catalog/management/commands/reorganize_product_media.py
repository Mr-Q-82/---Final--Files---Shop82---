from pathlib import PurePosixPath
from itertools import chain

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.catalog.models import product_gallery_image_upload_to, product_main_image_upload_to
from apps.products.models import Product, ProductImage


def _files_are_equal(storage, first, second):
    try:
        if storage.size(first) != storage.size(second):
            return False
        with storage.open(first, "rb") as left, storage.open(second, "rb") as right:
            while True:
                left_chunk = left.read(1024 * 1024)
                right_chunk = right.read(1024 * 1024)
                if left_chunk != right_chunk:
                    return False
                if not left_chunk:
                    return True
    except (OSError, ValueError):
        return False


class Command(BaseCommand):
    help = "تصاویر قبلی محصولات را براساس دسته‌بندی و محصول پوشه‌بندی می‌کند."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="فقط تغییرات را نمایش می‌دهد و چیزی جابه‌جا نمی‌کند.",
        )
        parser.add_argument(
            "--keep-originals",
            action="store_true",
            help="پس از انتقال موفق، فایل‌های مسیر قدیمی را نگه می‌دارد.",
        )
        parser.add_argument(
            "--category",
            help="فقط تصاویر دسته‌ای با این slug پردازش می‌شوند.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        keep_originals = options["keep_originals"]
        category = options.get("category")
        old_paths = set()
        moved = skipped = missing = failed = 0

        products = Product.objects.select_related("category").exclude(image="")
        gallery = ProductImage.objects.select_related("product__category").exclude(image="")
        if category:
            products = products.filter(category__slug=category)
            gallery = gallery.filter(product__category__slug=category)

        product_rows = (
            (item, Product, product_main_image_upload_to)
            for item in products.iterator(chunk_size=200)
        )
        gallery_rows = (
            (item, ProductImage, product_gallery_image_upload_to)
            for item in gallery.iterator(chunk_size=500)
        )

        for instance, model, upload_to in chain(product_rows, gallery_rows):
            current = str(instance.image.name or "").replace("\\", "/").lstrip("/")
            if not current:
                skipped += 1
                continue
            desired = upload_to(instance, PurePosixPath(current).name)
            if current == desired:
                skipped += 1
                continue

            storage = instance.image.storage
            if not storage.exists(current):
                missing += 1
                self.stderr.write(self.style.WARNING(f"فایل پیدا نشد: {current}"))
                continue
            self.stdout.write(f"{current}  ->  {desired}")
            if dry_run:
                moved += 1
                continue

            try:
                target = desired
                if storage.exists(target):
                    if _files_are_equal(storage, current, target):
                        target = desired
                    else:
                        target = storage.get_available_name(target)
                        with storage.open(current, "rb") as source:
                            target = storage.save(target, source)
                else:
                    with storage.open(current, "rb") as source:
                        target = storage.save(target, source)

                with transaction.atomic():
                    model.objects.filter(pk=instance.pk).update(image=target)
                old_paths.add((storage, current))
                moved += 1
            except Exception as exc:  # Report one bad file without stopping the rest.
                failed += 1
                self.stderr.write(self.style.ERROR(f"انتقال ناموفق {current}: {exc}"))

        deleted = 0
        if not dry_run and not keep_originals:
            for storage, old_path in old_paths:
                is_referenced = (
                    Product.objects.filter(image=old_path).exists()
                    or ProductImage.objects.filter(image=old_path).exists()
                )
                if not is_referenced and storage.exists(old_path):
                    storage.delete(old_path)
                    deleted += 1

        summary = (
            f"انتقال: {moved} | بدون تغییر: {skipped} | "
            f"فایل مفقود: {missing} | خطا: {failed} | حذف مسیر قدیمی: {deleted}"
        )
        self.stdout.write(self.style.SUCCESS(summary))
        if failed:
            raise RuntimeError("انتقال بعضی تصاویر کامل نشد؛ پیام‌های بالا را بررسی کنید.")
