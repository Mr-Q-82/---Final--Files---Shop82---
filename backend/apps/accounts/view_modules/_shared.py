import uuid
import logging
from django.conf import settings
from django.core.mail import send_mail
from django.db import OperationalError, ProgrammingError, models, transaction
from django.utils import timezone
from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.common.permissions import IsAdminRole
from apps.common.throttling import PhoneScopedRateThrottle
from ..models import (
    Address, AdminAuditLog, EmailVerification, LoyaltyProfile, LoyaltySetting, Notification, OTP,
    SecurityEvent, StaffPermission, SupportTicket, TicketMessage, User, Wallet,
    WalletTransaction,
    LoyaltyMission, LoyaltyPointEntry, ReferralEvent, UserSession, AdminRecoveryCode,
)
from ..services import send_sms
from ..serializers import (
    AddressSerializer, AdminAuditLogSerializer, AdminUserSerializer,
    EmailRequestSerializer, EmailVerifySerializer, LoyaltySerializer, LoyaltySettingSerializer,
    NotificationSerializer, OTPRequestSerializer, OTPVerifySerializer,
    PasswordChangeSerializer, PasswordLoginSerializer, PasswordResetSerializer,
    StaffPermissionSerializer, SupportTicketSerializer, TicketMessageSerializer,
    UserSerializer, WalletSerializer,
    LoyaltyMissionSerializer, LoyaltyPointEntrySerializer, ReferralEventSerializer,
    UserSessionSerializer,
)
from ..serializers import find_user_by_phone

logger = logging.getLogger(__name__)


__all__ = [name for name in globals() if not name.startswith('__')]
