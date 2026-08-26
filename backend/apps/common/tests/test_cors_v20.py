from django.test import Client, SimpleTestCase


class DevelopmentCorsV20Tests(SimpleTestCase):
    def test_local_development_port_receives_cors_header(self):
        response = Client().get(
            "/health/",
            HTTP_ORIGIN="http://localhost:5501",
        )
        self.assertEqual(
            response.headers.get("Access-Control-Allow-Origin"),
            "http://localhost:5501",
        )
