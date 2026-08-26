from django.test import TestCase
from django.core.files.base import ContentFile
from django.core.management import call_command
from django.core.files.storage import default_storage
from tempfile import TemporaryDirectory
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from apps.accounts.models import User
from apps.catalog.models import Brand, Category, Product, ProductImage

class PublicProductTests(TestCase):
    def setUp(self):
        self.media_directory = TemporaryDirectory()
        self.media_override = self.settings(MEDIA_ROOT=self.media_directory.name)
        self.media_override.enable()
        self.addCleanup(self.media_override.disable)
        self.addCleanup(self.media_directory.cleanup)
        self.client = APIClient()
        category, _ = Category.objects.get_or_create(
            slug="laptop", defaults={"name": "لپ‌تاپ"}
        )
        brand = Brand.objects.create(name="ASUS", slug="asus")
        self.product = Product.objects.create(
            name="ROG Strix", slug="rog-strix", sku="ROG-1",
            category=category, brand=brand, price=100_000_000,
            discount_percent=10, stock=5,
        )

    def test_product_list_and_final_price(self):
        response = self.client.get("/api/v1/catalog/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["final_price"], 90_000_000)

    def test_search_suggestions_work_from_first_character(self):
        second = Product.objects.create(
            name="کیبورد مکانیکال", slug="mechanical-keyboard", sku="KEY-2",
            category=self.product.category, brand=self.product.brand,
            price=5_000_000, stock=3,
        )
        response = self.client.get("/api/v1/catalog/products/suggest/?q=ک&limit=100")
        self.assertEqual(response.status_code, 200)
        self.assertIn(second.id, [row["id"] for row in response.data["results"]])

    def test_search_suggestions_accept_persian_digits(self):
        self.product.sku = "ROG-۱۲۳"
        self.product.save(update_fields=["sku"])
        response = self.client.get("/api/v1/catalog/products/suggest/?q=۱۲۳")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["results"][0]["id"], self.product.id)

    def test_admin_search_includes_inactive_products(self):
        hidden = Product.objects.create(
            name="محصول مدیریتی غیرفعال", slug="hidden-admin-product",
            sku="HIDDEN-ADMIN-1", category=self.product.category,
            brand=self.product.brand, price=1_000_000, stock=0, is_active=False,
        )
        admin = User.objects.create_user(
            phone="+989122222222", role=User.Role.ADMIN,
            is_staff=True, is_verified=True,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(admin).access_token}"
        )
        response = self.client.get("/api/v1/catalog/products/suggest/?q=غیرفعال")
        self.assertEqual(response.status_code, 200)
        self.assertIn(hidden.id, [row["id"] for row in response.data["results"]])

    def test_admin_search_is_limited_to_selected_category(self):
        keyboard_category = Category.objects.create(name="کیبورد", slug="keyboard")
        keyboard = Product.objects.create(
            name="محصول تست مشترک کیبورد", slug="shared-keyboard",
            sku="SHARED-KEY", category=keyboard_category,
            brand=self.product.brand, price=2_000_000, stock=2,
        )
        laptop = Product.objects.create(
            name="محصول تست مشترک لپ تاپ", slug="shared-laptop",
            sku="SHARED-LAP", category=self.product.category,
            brand=self.product.brand, price=20_000_000, stock=2,
        )
        admin = User.objects.create_user(
            phone="+989133333333", role=User.Role.ADMIN,
            is_staff=True, is_verified=True,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(admin).access_token}"
        )
        response = self.client.get(
            f"/api/v1/catalog/products/suggest/?q=مشترک&category_id={keyboard_category.id}"
        )
        result_ids = [row["id"] for row in response.data["results"]]
        self.assertIn(keyboard.id, result_ids)
        self.assertNotIn(laptop.id, result_ids)

    def test_global_admin_laptop_intent_excludes_laptop_cooling_products(self):
        cooling_category, _ = Category.objects.get_or_create(
            name="فن و کول پد", slug="cooling-pad"
        )
        cooling = Product.objects.create(
            name="فن و کول پد لپ تاپ", slug="laptop-cooling-pad-test",
            sku="COOL-LAP-1", category=cooling_category,
            brand=self.product.brand, price=1_500_000, stock=5,
        )
        laptop = Product.objects.create(
            name="لب تاب ایسوس تست", slug="admin-laptop-intent-test",
            sku="LAP-INTENT-1", category=self.product.category,
            brand=self.product.brand, price=25_000_000, stock=3,
        )
        admin = User.objects.create_user(
            phone="+989144444444", role=User.Role.ADMIN,
            is_staff=True, is_verified=True,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(admin).access_token}"
        )
        response = self.client.get("/api/v1/catalog/products/suggest/?q=لب تاب")
        result_ids = [row["id"] for row in response.data["results"]]
        self.assertIn(laptop.id, result_ids)
        self.assertNotIn(cooling.id, result_ids)

    def test_missing_media_files_are_not_exposed_as_broken_urls(self):
        self.product.image.name = "products/2099/12/missing-main.jpg"
        self.product.save(update_fields=["image"])
        ProductImage.objects.create(
            product=self.product,
            image="products/gallery/2099/12/missing-gallery.jpg",
        )

        response = self.client.get("/api/v1/catalog/products/rog-strix/")

        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data["image"])
        self.assertIsNone(response.data["gallery"][0]["image"])

    def test_admin_can_upload_and_delete_gallery_images(self):
        admin = User.objects.create_user(
            phone="+989111111111",
            role=User.Role.ADMIN,
            is_staff=True,
            is_verified=True,
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {RefreshToken.for_user(admin).access_token}"
        )
        gif = (
            b"GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
            b"\xff\xff\xff!\xf9\x04\x01\x00\x00\x00\x00,"
            b"\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;"
        )
        upload = self.client.post(
            "/api/v1/catalog/products/rog-strix/images/",
            {
                "images": [
                    SimpleUploadedFile("front.gif", gif, content_type="image/gif"),
                    SimpleUploadedFile("side.gif", gif, content_type="image/gif"),
                ]
            },
            format="multipart",
        )
        self.assertEqual(upload.status_code, 201)
        self.assertEqual(len(upload.data), 2)
        self.assertTrue(
            upload.data[0]["image"].endswith(
                "/media/products/laptop/rog-strix/gallery/front.gif"
            )
        )

        product = Product.objects.get(slug="rog-strix")
        self.assertEqual(product.gallery.count(), 2)
        public_detail = self.client.get("/api/v1/catalog/products/rog-strix/")
        self.assertEqual(public_detail.status_code, 200)
        self.assertEqual(len(public_detail.data["gallery"]), 2)
        image_id = upload.data[0]["id"]
        deleted = self.client.delete(
            f"/api/v1/catalog/products/rog-strix/images/{image_id}/"
        )
        self.assertEqual(deleted.status_code, 204)
        self.assertEqual(product.gallery.count(), 1)

    def test_main_image_uses_category_and_product_folders(self):
        self.product.image.save("front.gif", ContentFile(b"main-image"), save=True)
        self.assertEqual(
            self.product.image.name,
            "products/laptop/rog-strix/main/front.gif",
        )
        self.assertTrue(default_storage.exists(self.product.image.name))

    def test_reorganize_product_media_moves_legacy_file_and_updates_database(self):
        old_path = default_storage.save(
            "products/2026/08/legacy.gif",
            ContentFile(b"legacy-image"),
        )
        Product.objects.filter(pk=self.product.pk).update(image=old_path)

        call_command("reorganize_product_media")

        self.product.refresh_from_db()
        self.assertEqual(
            self.product.image.name,
            "products/laptop/rog-strix/main/legacy.gif",
        )
        self.assertTrue(default_storage.exists(self.product.image.name))
        self.assertFalse(default_storage.exists(old_path))
