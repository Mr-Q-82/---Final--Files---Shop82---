from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from apps.catalog.models import Brand, Category, Product


class CatalogCsvImportTests(APITestCase):
    def setUp(self):
        admin = get_user_model().objects.create_user(
            phone="+989122222222", role="ADMIN", is_staff=True
        )
        self.client.force_authenticate(admin)
        self.category, _ = Category.objects.get_or_create(
            slug="laptop", defaults={"name": "لپ‌تاپ"}
        )

    @staticmethod
    def csv_file(name, content):
        return SimpleUploadedFile(
            name, content.encode("utf-8-sig"), content_type="text/csv"
        )

    def test_brand_csv_template_export_and_import(self):
        template = self.client.get("/api/v1/catalog/brands/template-csv/")
        self.assertEqual(template.status_code, 200)
        upload = self.csv_file(
            "brands.csv",
            "name,slug,is_active,seo_title,seo_description\n"
            "ایسوس,asus,true,محصولات ایسوس,خرید ایسوس\n",
        )
        response = self.client.post(
            "/api/v1/catalog/brands/import-csv/", {"file": upload}, format="multipart"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(response.data["failed"], 0)
        self.assertTrue(Brand.objects.filter(slug="asus", is_active=True).exists())
        exported = self.client.get("/api/v1/catalog/brands/export-csv/")
        self.assertEqual(exported.status_code, 200)
        self.assertTrue(exported.content.startswith(b"\xef\xbb\xbf"))

    def test_product_csv_creates_updates_and_reports_bad_rows(self):
        Brand.objects.create(name="ایسوس", slug="asus")
        header = (
            "sku,name,slug,category,brand,price,discount_percent,stock,"
            "is_active,is_featured,specifications_json\n"
        )
        upload = self.csv_file(
            "products.csv",
            header
            + 'LAP-1,لپ‌تاپ تست,test-laptop,laptop,asus,45000000,5,8,true,false,"{""رم"":""DDR4""}"\n'
            + "BAD-1,ردیف خراب,bad-product,missing,,1000,0,1,true,false,\n",
        )
        response = self.client.post(
            "/api/v1/catalog/products/import-csv/", {"file": upload}, format="multipart"
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["created"], 1)
        self.assertEqual(response.data["failed"], 1)
        product = Product.objects.get(sku="LAP-1")
        self.assertEqual(product.specifications["رم"], "DDR4")

        update = self.csv_file(
            "products.csv",
            header
            + "LAP-1,لپ‌تاپ ویرایش‌شده,test-laptop,laptop,asus,47000000,0,12,true,true,\n",
        )
        changed = self.client.post(
            "/api/v1/catalog/products/import-csv/", {"file": update}, format="multipart"
        )
        self.assertEqual(changed.data["updated"], 1)
        product.refresh_from_db()
        self.assertEqual(product.stock, 12)
        self.assertEqual(product.name, "لپ‌تاپ ویرایش‌شده")

    def test_product_slug_is_generated_and_unique(self):
        first = Product.objects.create(
            name="لپ‌تاپ حرفه‌ای", sku="AUTO-1", category=self.category, price=1000
        )
        second = Product.objects.create(
            name="لپ‌تاپ حرفه‌ای", sku="AUTO-2", category=self.category, price=2000
        )
        self.assertTrue(first.slug)
        self.assertNotEqual(first.slug, second.slug)

    def test_product_csv_accepts_missing_slug_column(self):
        upload = self.csv_file(
            "products-without-slug.csv",
            "sku,name,category,price,stock\n"
            "AUTO-CSV-1,محصول خودکار,laptop,1500000,3\n",
        )
        response = self.client.post(
            "/api/v1/catalog/products/import-csv/", {"file": upload}, format="multipart"
        )
        self.assertEqual(response.status_code, 200)
        product = Product.objects.get(sku="AUTO-CSV-1")
        self.assertTrue(product.slug)

    def test_brand_filter_uses_all_products_in_selected_category(self):
        laptop_brand = Brand.objects.create(name="برند لپ‌تاپ", slug="laptop-brand")
        other_brand = Brand.objects.create(name="برند دیگر", slug="other-brand")
        Product.objects.create(
            name="لپ‌تاپ فیلتر", sku="FILTER-LAP", category=self.category,
            brand=laptop_brand, price=1000,
        )
        other_category = Category.objects.create(name="مانیتور", slug="monitor-filter")
        Product.objects.create(
            name="مانیتور فیلتر", sku="FILTER-MON", category=other_category,
            brand=other_brand, price=2000,
        )
        self.client.force_authenticate(user=None)
        response = self.client.get(
            "/api/v1/catalog/brands/?page_size=100&categories=laptop"
        )
        names = [item["name"] for item in (response.data.get("results") or response.data)]
        self.assertIn("برند لپ‌تاپ", names)
        self.assertNotIn("برند دیگر", names)

    def test_csv_endpoints_require_admin(self):
        self.client.force_authenticate(user=None)
        self.assertEqual(
            self.client.get("/api/v1/catalog/products/template-csv/").status_code, 401
        )
