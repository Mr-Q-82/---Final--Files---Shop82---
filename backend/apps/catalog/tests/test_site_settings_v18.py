from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.catalog.models import (
    Brand, Category, NewsletterSubscriber, Product, SiteSetting,
)


class SiteSettingsV18Tests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            phone="+989120000081", role=User.Role.ADMIN, is_staff=True
        )
        self.setting = SiteSetting.objects.first() or SiteSetting.objects.create()

    def test_public_can_read_but_only_admin_can_change_settings(self):
        response = self.client.get("/api/v1/catalog/site-settings/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual((response.data.get("results") or response.data)[0]["site_name"], "فروشگاه 82")
        denied = self.client.patch(
            f"/api/v1/catalog/site-settings/{self.setting.id}/",
            {"site_name": "فروشگاه جدید"}, format="json",
        )
        self.assertIn(denied.status_code, (401, 403))
        self.client.force_authenticate(self.admin)
        updated = self.client.patch(
            f"/api/v1/catalog/site-settings/{self.setting.id}/",
            {
                "site_name": "فروشگاه جدید",
                "category_title": "دسته‌های منتخب",
                "footer_text": "© ۱۴۰۵ فروشگاه جدید",
                "seo_home_title": "عنوان سئوی فروشگاه جدید",
                "seo_home_description": "توضیحات سئوی صفحه اصلی فروشگاه جدید",
            },
            format="json",
        )
        self.assertEqual(updated.status_code, 200, updated.data)
        self.assertEqual(updated.data["category_title"], "دسته‌های منتخب")
        self.assertEqual(updated.data["seo_home_title"], "عنوان سئوی فروشگاه جدید")

    def test_robots_and_sitemap_publish_clean_store_urls(self):
        category = Category.objects.create(name="لپ‌تاپ", slug="laptop-seo")
        brand = Brand.objects.create(name="برند سئو", slug="seo-brand")
        Product.objects.create(
            name="محصول سئو",
            slug="seo-product",
            sku="SEO-1",
            category=category,
            brand=brand,
            price=1_000_000,
            stock=2,
        )
        robots = self.client.get("/robots.txt")
        self.assertEqual(robots.status_code, 200)
        self.assertContains(robots, "Disallow: /account")
        self.assertContains(robots, "Sitemap:")
        sitemap = self.client.get("/sitemap.xml")
        self.assertEqual(sitemap.status_code, 200)
        self.assertContains(sitemap, "/product/seo-product")
        self.assertContains(sitemap, "/shop/laptop-seo")
        self.assertContains(sitemap, "/gaming/laptop-seo")

    def test_newsletter_signup_is_idempotent_and_admin_can_list(self):
        first = self.client.post(
            "/api/v1/catalog/newsletter/", {"email": "USER@example.com"},
            format="json",
        )
        second = self.client.post(
            "/api/v1/catalog/newsletter/", {"email": "user@example.com"},
            format="json",
        )
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(NewsletterSubscriber.objects.count(), 1)
        self.client.force_authenticate(self.admin)
        response = self.client.get("/api/v1/catalog/newsletter/")
        self.assertEqual(response.status_code, 200)
