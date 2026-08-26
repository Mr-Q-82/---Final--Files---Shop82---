from rest_framework.test import APITestCase


class PrivateEndpointsV19Tests(APITestCase):
    def test_account_endpoints_return_unauthorized_for_guests(self):
        for path in (
            "/api/v1/auth/me/",
            "/api/v1/auth/addresses/",
            "/api/v1/auth/notifications/",
            "/api/v1/auth/wallet/",
            "/api/v1/auth/loyalty/",
            "/api/v1/orders/",
        ):
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 401)
