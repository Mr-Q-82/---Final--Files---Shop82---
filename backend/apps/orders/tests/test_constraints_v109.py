from django.test import TestCase
from django.db import IntegrityError, transaction
from apps.accounts.models import User
from apps.orders.models import DiscountCode, Order


class FinancialConstraintTests(TestCase):
    def test_discount_cannot_exceed_one_hundred_percent(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            DiscountCode.objects.create(code="INVALID", percent=101)

    def test_order_idempotency_is_unique_per_user(self):
        user = User.objects.create_user(phone="+989121234570", password="StrongPass!123")
        payload = {"user": user, "address_snapshot": {}, "idempotency_key": "same-key"}
        Order.objects.create(**payload)
        with self.assertRaises(IntegrityError), transaction.atomic():
            Order.objects.create(**payload)
