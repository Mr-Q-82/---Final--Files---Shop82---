from django.test import SimpleTestCase

from apps.catalog.models import NewsletterSubscriber, Product


class CatalogConstraintOwnershipTests(SimpleTestCase):
    def test_product_constraints_are_attached_to_product(self):
        names = {constraint.name for constraint in Product._meta.constraints}
        self.assertIn("product_discount_lte_100", names)
        self.assertIn("product_rating_0_5", names)

    def test_newsletter_has_no_product_constraints(self):
        names = {constraint.name for constraint in NewsletterSubscriber._meta.constraints}
        self.assertNotIn("product_discount_lte_100", names)
        self.assertNotIn("product_rating_0_5", names)
