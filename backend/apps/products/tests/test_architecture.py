from django.test import SimpleTestCase
from django.urls import resolve

from apps.products.views import ProductViewSet


class ProductBoundaryTests(SimpleTestCase):
    def test_existing_product_api_is_served_by_products_app(self):
        match = resolve("/api/v1/catalog/products/")
        self.assertIs(match.func.cls, ProductViewSet)

    def test_product_tables_keep_legacy_names_for_safe_upgrade(self):
        from apps.products.models import Product

        self.assertEqual(Product._meta.db_table, "catalog_product")
