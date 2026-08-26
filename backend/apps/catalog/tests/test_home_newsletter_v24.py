from django.core import mail
from django.test import override_settings
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.catalog.models import (
    Brand, Category, HeroSlide, NewsletterCampaign, NewsletterSubscriber, Product,
)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class HomeNewsletterV24Tests(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(
            phone="09020000031", password="StrongPass123!"
        )

    def test_database_product_metric_is_public(self):
        category = Category.objects.create(name="لپ‌تاپ", slug="laptop-v24")
        brand = Brand.objects.create(name="برند نسخه ۲۴", slug="brand-v24")
        Product.objects.create(
            name="محصول موجود",
            slug="available-v24",
            sku="AVAILABLE-V24",
            category=category,
            brand=brand,
            price=1000,
            stock=3,
        )
        slide = HeroSlide.objects.create(
            title="محصول موجود",
            metric_type=HeroSlide.MetricType.PRODUCTS,
            placement=HeroSlide.Placement.GAMING,
        )
        response = self.client.get(
            "/api/v1/catalog/hero-slides/?placement=GAMING"
        )
        self.assertEqual(response.status_code, 200)
        row = next(
            item for item in (response.data.get("results") or response.data)
            if item["id"] == str(slide.id)
        )
        self.assertGreaterEqual(row["display_value"], 1)

        stats = self.client.get("/api/v1/catalog/store-stats/")
        self.assertEqual(stats.status_code, 200)
        self.assertGreaterEqual(stats.data["products"], 1)
        self.assertEqual(stats.data["support"], "۲۴/۷")

    def test_admin_can_create_send_and_delete_news(self):
        NewsletterSubscriber.objects.create(email="member@example.com")
        self.client.force_authenticate(self.admin)
        created = self.client.post(
            "/api/v1/catalog/newsletter-campaigns/",
            {"title": "خبر جدید", "message": "متن خبر فروشگاه"},
            format="json",
        )
        self.assertEqual(created.status_code, 201, created.data)
        campaign_id = created.data["id"]
        sent = self.client.post(
            f"/api/v1/catalog/newsletter-campaigns/{campaign_id}/send/"
        )
        self.assertEqual(sent.status_code, 200, sent.data)
        self.assertEqual(sent.data["sent_count"], 1)
        self.assertEqual(len(mail.outbox), 1)
        deleted = self.client.delete(
            f"/api/v1/catalog/newsletter-campaigns/{campaign_id}/"
        )
        self.assertEqual(deleted.status_code, 204)
        self.assertFalse(NewsletterCampaign.objects.filter(id=campaign_id).exists())

    def test_admin_can_send_news_to_selected_subscribers(self):
        selected = NewsletterSubscriber.objects.create(email="selected@example.com")
        NewsletterSubscriber.objects.create(email="other@example.com")
        campaign = NewsletterCampaign.objects.create(title="خبر انتخابی", message="متن")
        self.client.force_authenticate(self.admin)
        sent = self.client.post(
            f"/api/v1/catalog/newsletter-campaigns/{campaign.id}/send/",
            {"subscriber_ids": [str(selected.id)]},
            format="json",
        )
        self.assertEqual(sent.status_code, 200, sent.data)
        self.assertEqual(sent.data["sent_count"], 1)
        self.assertEqual(mail.outbox[0].bcc, ["selected@example.com"])
