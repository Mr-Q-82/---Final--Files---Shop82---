from django.conf import settings
from django.test import SimpleTestCase


class DevelopmentThrottleSettingsV22Tests(SimpleTestCase):
    def test_development_rates_allow_normal_frontend_usage(self):
        if settings.DEBUG:
            rates = settings.REST_FRAMEWORK["DEFAULT_THROTTLE_RATES"]
            self.assertEqual(rates["anon"], "10000/hour")
            self.assertEqual(rates["user"], "50000/hour")
