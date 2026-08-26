from django.contrib.auth.base_user import BaseUserManager
import re


def normalize_user_phone(value):
    digits = re.sub(r"\D", "", str(value or ""))
    if digits.startswith("09") and len(digits) == 11:
        return "+98" + digits[1:]
    if digits.startswith("989") and len(digits) == 12:
        return "+" + digits
    raise ValueError("شماره موبایل معتبر نیست.")

class UserManager(BaseUserManager):
    def create_user(self, phone, password=None, **extra_fields):
        if not phone:
            raise ValueError("شماره موبایل الزامی است.")
        user = self.model(phone=normalize_user_phone(phone), **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("role", "ADMIN")
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        extra_fields.setdefault("is_verified", True)
        return self.create_user(phone, password, **extra_fields)
