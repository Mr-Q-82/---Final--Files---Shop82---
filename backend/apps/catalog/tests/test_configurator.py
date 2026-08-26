from django.test import TestCase

from apps.catalog.models import (
    Category, CategoryUsageProfile, CustomizationGroup,
    CustomizationOption, Product,
)


class ProductConfiguratorModelTests(TestCase):
    def setUp(self):
        self.category = Category.objects.create(name="لپ‌تاپ", slug="laptop")
        self.product = Product.objects.create(
            name="لپ‌تاپ تست", slug="test-laptop", sku="TEST-LAPTOP",
            category=self.category, price=10_000_000, stock=5,
        )

    def test_usage_profiles_are_separated_by_catalog(self):
        normal = CategoryUsageProfile.objects.create(
            category=self.category, name="برنامه‌نویسی", slug="programming", catalog="NORMAL"
        )
        gaming = CategoryUsageProfile.objects.create(
            category=self.category, name="گیمینگ", slug="gaming", catalog="GAMING"
        )
        normal.products.add(self.product)
        self.assertNotEqual(normal.catalog, gaming.catalog)
        self.assertTrue(normal.products.filter(pk=self.product.pk).exists())

    def test_group_applies_and_option_keeps_price_and_stock(self):
        group = CustomizationGroup.objects.create(
            category=self.category, name="حافظه RAM", code="ram", catalog="BOTH"
        )
        option = CustomizationOption.objects.create(
            group=group, name="۳۲ گیگابایت", price_delta=5_000_000, stock=3
        )
        self.assertTrue(group.applies_to(self.product))
        self.assertEqual(option.price_delta, 5_000_000)
        self.assertEqual(option.stock, 3)
