import base64
import shutil
import tempfile

from django.test import override_settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from apps.accounts.models import User


PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="
)


class PromoBannerTests(APITestCase):
    def setUp(self):
        self.media_root = tempfile.mkdtemp(prefix="shop82-banners-")
        self.settings_override = override_settings(MEDIA_ROOT=self.media_root)
        self.settings_override.enable()
        self.admin = User.objects.create_user(
            phone="09120000031",
            password="StrongPass123!",
            role=User.Role.ADMIN,
            is_staff=True,
        )

    def tearDown(self):
        self.settings_override.disable()
        shutil.rmtree(self.media_root, ignore_errors=True)

    def test_admin_can_upload_banner_and_public_can_list_it(self):
        self.client.force_authenticate(self.admin)
        response = self.client.post(
            "/api/v1/catalog/promo-banners/",
            {
                "title": "پیشنهاد ویژه شبکه",
                "subtitle": "مودم و تجهیزات شبکه",
                "target": "/shop/network",
                "placement": "GAMING",
                "sort_order": 1,
                "is_active": True,
                "image": SimpleUploadedFile(
                    "network.png", PNG_1X1, content_type="image/png"
                ),
            },
            format="multipart",
        )
        self.assertEqual(response.status_code, 201, response.data)

        self.client.force_authenticate(user=None)
        response = self.client.get(
            "/api/v1/catalog/promo-banners/?placement=GAMING"
        )
        self.assertEqual(response.status_code, 200)
        rows = response.data.get("results", response.data)
        self.assertEqual(rows[0]["title"], "پیشنهاد ویژه شبکه")
        self.assertTrue(rows[0]["image"])
        self.assertEqual(rows[0]["placement"], "GAMING")

        home_response = self.client.get(
            "/api/v1/catalog/promo-banners/?placement=HOME"
        )
        home_rows = home_response.data.get("results", home_response.data)
        self.assertFalse(home_rows)
