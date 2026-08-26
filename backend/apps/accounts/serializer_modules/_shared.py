import re
import logging
from django.conf import settings
from django.db import OperationalError, ProgrammingError, transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from ..models import (
    Address, AdminAuditLog, EmailVerification, LoyaltyProfile, LoyaltySetting, Notification, OTP,
    StaffPermission, SupportTicket, TicketMessage, User, Wallet, WalletTransaction,
    LoyaltyMission, LoyaltyPointEntry, ReferralEvent, UserSession,
)
from ..validators import (
    validate_national_id,
    validate_password_strength,
    validate_person_name,
    validate_postal_code,
    validate_referral_code,
    validate_safe_text,
)

logger = logging.getLogger(__name__)

def normalize_phone(phone):
    phone = re.sub(r"\D", "", phone or "")
    if phone.startswith("09") and len(phone) == 11:
        return "+98" + phone[1:]
    if phone.startswith("989") and len(phone) == 12:
        return "+" + phone
    if phone.startswith("+989") and len(phone) == 13:
        return phone
    raise serializers.ValidationError("شماره موبایل معتبر نیست.")


def phone_storage_variants(phone):
    """Canonical and legacy representations used by older project versions."""
    canonical = normalize_phone(phone)
    return canonical, "0" + canonical[3:], canonical[1:]


def find_user_by_phone(phone, *, active_only=False):
    variants = phone_storage_variants(phone)
    queryset = User.objects.filter(phone__in=variants)
    if active_only:
        queryset = queryset.filter(is_active=True)
    user = queryset.order_by("-is_staff", "-is_superuser").first()
    if user and user.phone != variants[0]:
        if not User.objects.exclude(pk=user.pk).filter(phone=variants[0]).exists():
            user.phone = variants[0]
            user.save(update_fields=["phone", "updated_at"])
    return user


__all__ = [name for name in globals() if not name.startswith('__')]
