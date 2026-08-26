"""Framework-independent validators shared by backend bounded contexts."""

import re

from django.core.exceptions import ValidationError


SAFE_TEXT_RE = re.compile(r"^(?!.*[<>\x00-\x08\x0b\x0c\x0e-\x1f]).+$", re.DOTALL)


def validate_safe_text(value: str, *, field_label="متن", minimum=2, maximum=2000) -> str:
    value = (value or "").strip()
    if not minimum <= len(value) <= maximum or not SAFE_TEXT_RE.fullmatch(value):
        raise ValidationError(
            f"{field_label} باید بین {minimum} تا {maximum} نویسه و بدون کد HTML باشد."
        )
    return value
