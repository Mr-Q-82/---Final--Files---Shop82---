"""Reusable validation rules for every account-related API entry point."""

import re

from django.core.exceptions import ValidationError
from apps.common.validators import validate_safe_text  # backwards-compatible export


IRAN_PHONE_RE = re.compile(r"^\+989\d{9}$")
PERSON_NAME_RE = re.compile(r"^[^\W\d_]+(?:[\s‌'’-][^\W\d_]+)*$", re.UNICODE)
POSTAL_CODE_RE = re.compile(r"^(?!0)(?!.*(\d)\1{9})\d{10}$")
PASSWORD_RE = re.compile(
    r"^(?=.{8,128}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])\S+$"
)
REFERRAL_CODE_RE = re.compile(r"^[A-Z0-9]{8,16}$")


def validate_iran_phone(value: str) -> str:
    if not IRAN_PHONE_RE.fullmatch(value or ""):
        raise ValidationError("شماره موبایل را به‌شکل 09123456789 وارد کنید.")
    return value


def validate_person_name(value: str, *, field_label="نام", required=False) -> str:
    value = (value or "").strip()
    if not value and not required:
        return value
    if not 2 <= len(value) <= 80 or not PERSON_NAME_RE.fullmatch(value):
        raise ValidationError(f"{field_label} باید ۲ تا ۸۰ حرف و بدون عدد باشد.")
    return value


def validate_national_id(value: str, *, required=False) -> str:
    value = re.sub(r"\D", "", value or "")
    if not value and not required:
        return value
    if len(value) != 10 or len(set(value)) == 1:
        raise ValidationError("کد ملی واردشده معتبر نیست.")
    checksum = sum(int(value[index]) * (10 - index) for index in range(9)) % 11
    expected = checksum if checksum < 2 else 11 - checksum
    if int(value[-1]) != expected:
        raise ValidationError("کد ملی واردشده معتبر نیست.")
    return value


def validate_postal_code(value: str) -> str:
    value = re.sub(r"\D", "", value or "")
    if not POSTAL_CODE_RE.fullmatch(value):
        raise ValidationError("کد پستی باید ۱۰ رقم معتبر باشد و با صفر شروع نشود.")
    return value


def validate_password_strength(value: str) -> str:
    if not PASSWORD_RE.fullmatch(value or ""):
        raise ValidationError(
            "رمز عبور باید ۸ تا ۱۲۸ کاراکتر و شامل حرف بزرگ، حرف کوچک، عدد و نماد باشد."
        )
    return value


def validate_referral_code(value: str) -> str:
    value = (value or "").strip().upper()
    if value and not REFERRAL_CODE_RE.fullmatch(value):
        raise ValidationError(
            "کد دعوت باید ۸ تا ۱۶ حرف یا عدد انگلیسی باشد."
        )
    return value
