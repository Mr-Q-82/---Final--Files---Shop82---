from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.products.models import Product, ProductImage


SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"}
SEED_ALT_PREFIX = "[seed-product-image]"


@dataclass(frozen=True)
class ImageGroup:
    category_slug: str
    is_gaming: bool
    directory: Path
    images: tuple[Path, ...]

    @property
    def label(self) -> str:
        product_type = "گیمینگ" if self.is_gaming else "عادی"
        return f"{self.category_slug} / {product_type}"


def discover_groups(asset_root: Path) -> list[ImageGroup]:
    groups: list[ImageGroup] = []
    if not asset_root.is_dir():
        return groups

    for category_dir in sorted(path for path in asset_root.iterdir() if path.is_dir()):
        for folder_name, is_gaming in (("regular", False), ("gaming", True)):
            directory = category_dir / folder_name
            if not directory.is_dir():
                continue
            images = tuple(
                sorted(
                    path
                    for path in directory.iterdir()
                    if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
                )
            )
            if images:
                groups.append(
                    ImageGroup(category_dir.name, is_gaming, directory, images)
                )
    return groups


class Command(BaseCommand):
    help = (
        "Assign bundled product pictures by category and gaming type. "
        "The operation is deterministic and safe to run again."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--asset-root",
            type=Path,
            default=Path(settings.BASE_DIR) / "seed_assets" / "product_images",
            help="Root containing <category>/<regular|gaming>/ image folders.",
        )
        parser.add_argument(
            "--replace",
            action="store_true",
            help="Replace existing main images; without this flag only empty products change.",
        )
        parser.add_argument(
            "--gallery-size",
            type=int,
            default=3,
            help="Total pictures per product including the main image (default: 3).",
        )
        parser.add_argument("--dry-run", action="store_true")

    def handle(self, *args, **options):
        asset_root = options["asset_root"].resolve()
        gallery_size = options["gallery_size"]
        if gallery_size < 1 or gallery_size > 12:
            raise CommandError("--gallery-size must be between 1 and 12.")

        groups = discover_groups(asset_root)
        if not groups:
            raise CommandError(f"No product images found under: {asset_root}")

        total_products = 0
        updated_products = 0
        created_gallery = 0
        missing_groups: list[str] = []

        for group in groups:
            products = list(
                Product.objects.select_related("category")
                .filter(
                    category__slug=group.category_slug,
                    is_gaming=group.is_gaming,
                )
                .order_by("sku", "pk")
            )
            if not products:
                missing_groups.append(group.label)
                continue

            total_products += len(products)
            if options["dry_run"]:
                candidates = products if options["replace"] else [p for p in products if not p.image]
                updated_products += len(candidates)
                created_gallery += len(candidates) * min(
                    max(gallery_size - 1, 0), max(len(group.images) - 1, 0)
                )
                self.stdout.write(
                    f"[dry-run] {group.label}: {len(candidates)}/{len(products)} products, "
                    f"{len(group.images)} source images"
                )
                continue

            group_updated, group_gallery = self._apply_group(
                group=group,
                products=products,
                replace=options["replace"],
                gallery_size=gallery_size,
            )
            updated_products += group_updated
            created_gallery += group_gallery
            self.stdout.write(
                self.style.SUCCESS(
                    f"{group.label}: {group_updated}/{len(products)} products updated"
                )
            )

        self.stdout.write("")
        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {updated_products} of {total_products} products; "
                f"{created_gallery} gallery images created."
            )
        )
        if missing_groups:
            self.stdout.write(
                self.style.WARNING(
                    "No matching products yet (images remain ready for later): "
                    + ", ".join(missing_groups)
                )
            )

    @transaction.atomic
    def _apply_group(self, *, group, products, replace, gallery_size):
        updated = 0
        gallery_created = 0

        for product_index, product in enumerate(products):
            if product.image and not replace:
                continue

            if replace:
                self._delete_seed_gallery(product)
                if product.image:
                    product.image.delete(save=False)

            main_source = group.images[product_index % len(group.images)]
            with main_source.open("rb") as source_file:
                product.image.save(main_source.name, File(source_file), save=False)
            product.save(update_fields=("image", "updated_at"))
            updated += 1

            extra_count = min(
                max(gallery_size - 1, 0), max(len(group.images) - 1, 0)
            )
            for offset in range(1, extra_count + 1):
                gallery_source = group.images[
                    (product_index + offset) % len(group.images)
                ]
                gallery_item = ProductImage(
                    product=product,
                    alt_text=f"{SEED_ALT_PREFIX} {product.name} - تصویر {offset + 1}",
                    sort_order=offset,
                )
                with gallery_source.open("rb") as source_file:
                    gallery_item.image.save(
                        gallery_source.name, File(source_file), save=False
                    )
                gallery_item.save()
                gallery_created += 1

        return updated, gallery_created

    @staticmethod
    def _delete_seed_gallery(product):
        gallery_items = list(
            product.gallery.filter(alt_text__startswith=SEED_ALT_PREFIX)
        )
        for item in gallery_items:
            item.image.delete(save=False)
            item.delete()
