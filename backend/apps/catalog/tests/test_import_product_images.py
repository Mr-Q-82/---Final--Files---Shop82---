from pathlib import Path
from tempfile import TemporaryDirectory

from django.test import SimpleTestCase

from apps.catalog.management.commands.import_product_images import discover_groups


class ProductImageDiscoveryTests(SimpleTestCase):
    def test_separates_regular_and_gaming_assets_by_category(self):
        with TemporaryDirectory() as temporary_directory:
            root = Path(temporary_directory)
            regular = root / "laptop" / "regular"
            gaming = root / "laptop" / "gaming"
            regular.mkdir(parents=True)
            gaming.mkdir(parents=True)
            (regular / "001.webp").write_bytes(b"regular")
            (gaming / "001.webp").write_bytes(b"gaming")
            (gaming / "ignored.txt").write_text("not an image")

            groups = discover_groups(root)

        self.assertEqual(len(groups), 2)
        self.assertEqual(
            {(group.category_slug, group.is_gaming) for group in groups},
            {("laptop", False), ("laptop", True)},
        )
        self.assertTrue(all(len(group.images) == 1 for group in groups))
