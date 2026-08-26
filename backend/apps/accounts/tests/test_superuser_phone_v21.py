from django.test import TestCase

from apps.accounts.models import User


class SuperuserPhoneV21Tests(TestCase):
    def test_createsuperuser_style_phone_is_normalized(self):
        user = User.objects.create_superuser(
            phone="09024711777",
            password="StrongPass123!",
        )
        self.assertEqual(user.phone, "+989024711777")
        self.assertTrue(user.is_superuser)
        self.assertEqual(
            User.objects.get(phone="+989024711777").pk,
            user.pk,
        )
