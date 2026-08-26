from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from apps.accounts.validators import (
    validate_national_id,
    validate_password_strength,
    validate_postal_code,
)


class StrictAccountValidationTests(SimpleTestCase):
    def test_valid_national_id_checksum(self):
        self.assertEqual(validate_national_id("0013546120"), "0013546120")

    def test_repeated_or_invalid_national_id_is_rejected(self):
        for value in ("1111111111", "0013546129"):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                validate_national_id(value, required=True)

    def test_postal_code_rules(self):
        self.assertEqual(validate_postal_code("1234567890"), "1234567890")
        for value in ("0123456789", "1111111111", "123"):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                validate_postal_code(value)

    def test_password_requires_four_character_groups(self):
        self.assertEqual(validate_password_strength("SecurePass1!"), "SecurePass1!")
        for value in ("short", "NoNumber!", "nonuppercase1!", "NoSymbol123"):
            with self.subTest(value=value), self.assertRaises(ValidationError):
                validate_password_strength(value)
