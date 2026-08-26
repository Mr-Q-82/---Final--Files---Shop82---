from ._shared import *
from ..serializer_modules.tokens import session_table_available

class OTPRequestView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_scope = "otp"
    throttle_classes = [PhoneScopedRateThrottle]
    serializer_class = OTPRequestSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if (
            serializer.validated_data["purpose"] in (OTP.Purpose.LOGIN, OTP.Purpose.RESET_PASSWORD)
            and not find_user_by_phone(serializer.validated_data["phone"])
        ):
            if settings.ACCOUNT_ENUMERATION_PROTECTION:
                return Response({"message": "اگر حساب معتبر باشد، کد ارسال می‌شود."}, status=201)
            return Response({"detail": "حسابی با این شماره پیدا نشد."}, status=404)
        if (
            serializer.validated_data["purpose"] == OTP.Purpose.REGISTER
            and find_user_by_phone(serializer.validated_data["phone"])
        ):
            if settings.ACCOUNT_ENUMERATION_PROTECTION:
                return Response({"message": "اگر شماره قابل ثبت باشد، کد ارسال می‌شود."}, status=201)
            return Response({"detail": "این شماره قبلاً ثبت‌نام کرده است؛ وارد حساب شوید."}, status=409)
        otp = OTP.issue(**serializer.validated_data)
        plain_code = otp.plain_code
        send_sms(
            otp.phone,
            f"کد تأیید فروشگاه 82: {plain_code}",
            token=plain_code,
            template=getattr(settings, "KAVENEGAR_OTP_TEMPLATE", ""),
        )
        payload = {"message": "کد تأیید ارسال شد.", "expires_in": settings.OTP_LIFETIME_SECONDS}
        if settings.OTP_DEBUG_RETURN_CODE:
            payload["debug_code"] = plain_code
        return Response(payload, status=status.HTTP_201_CREATED)

def auth_response(payload, status_code=200):
    payload = dict(payload)
    refresh = payload.pop("refresh", None)
    response = Response(payload, status=status_code)
    if refresh:
        response.set_cookie(
            settings.AUTH_REFRESH_COOKIE, refresh,
            max_age=int(settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()),
            httponly=True, secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE, path="/api/v1/auth/",
        )
    return response

class CookieTokenRefreshView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    serializer_class = TokenRefreshSerializer
    def post(self, request):
        refresh = request.data.get("refresh") or request.COOKIES.get(settings.AUTH_REFRESH_COOKIE)
        session = None
        try:
            token = RefreshToken(refresh)
            if not session_table_available():
                raise OperationalError("UserSession table is not migrated")
            session = UserSession.objects.get(refresh_jti=str(token["jti"]))
            if session.revoked_at:
                return Response({"detail": "این نشست لغو شده است."}, status=401)
        except UserSession.DoesNotExist:
            return Response({"detail": "نشست معتبر نیست."}, status=401)
        except (OperationalError, ProgrammingError):
            # Old databases may not have the session table yet. The JWT is
            # still validated below; migrate restores revocation tracking.
            logger.warning("UserSession table is unavailable during token refresh")
        except Exception:
            return Response({"detail": "نشست معتبر نیست."}, status=401)
        serializer = self.get_serializer(data={"refresh": refresh})
        serializer.is_valid(raise_exception=True)
        new_refresh = serializer.validated_data.get("refresh")
        if new_refresh and session is not None:
            new_token = RefreshToken(new_refresh)
            try:
                UserSession.objects.create(
                    user=session.user, refresh_jti=str(new_token["jti"]),
                    device_name=session.device_name, ip_address=request.META.get("REMOTE_ADDR"),
                    user_agent=request.META.get("HTTP_USER_AGENT", "")[:300],
                )
                session.revoked_at = timezone.now()
                session.save(update_fields=("revoked_at", "updated_at"))
            except (OperationalError, ProgrammingError):
                logger.warning("Could not rotate UserSession metadata; database migration is pending")
        return auth_response(serializer.validated_data)

class LogoutView(generics.GenericAPIView):
    def post(self, request):
        raw_refresh = request.data.get("refresh") or request.COOKIES.get(settings.AUTH_REFRESH_COOKIE)
        if raw_refresh:
            try:
                token = RefreshToken(raw_refresh)
                token.blacklist()
                UserSession.objects.filter(refresh_jti=str(token["jti"])).update(revoked_at=timezone.now())
            except Exception:
                pass
        response = Response({"message": "با موفقیت خارج شدید."})
        response.delete_cookie(settings.AUTH_REFRESH_COOKIE, path="/api/v1/auth/")
        return response

class OTPVerifyView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"
    throttle_classes = [PhoneScopedRateThrottle]
    serializer_class = OTPVerifySerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return auth_response(serializer.save())

class PasswordLoginView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"
    throttle_classes = [PhoneScopedRateThrottle]
    serializer_class = PasswordLoginSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        valid = serializer.is_valid()
        phone = request.data.get("phone", "")
        user = serializer.validated_data.get("user") if valid else None
        SecurityEvent.objects.create(
            user=user,
            phone=phone,
            event_type="PASSWORD_LOGIN",
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:300],
            success=valid,
        )
        if not valid:
            from rest_framework.exceptions import ValidationError
            raise ValidationError(serializer.errors)
        if request.data.get("admin_panel") and user.role in {"ADMIN", "STAFF"}:
            from apps.operations.models import AdminTwoFactor
            if settings.ADMIN_2FA_REQUIRED or AdminTwoFactor.objects.filter(user=user, is_enabled=True).exists():
                otp = OTP.issue(user.phone, OTP.Purpose.LOGIN)
                plain_code = otp.plain_code
                send_sms(
                    user.phone, f"کد ورود دومرحله‌ای فروشگاه 82: {plain_code}",
                    token=plain_code,
                    template=getattr(settings, "KAVENEGAR_OTP_TEMPLATE", ""),
                )
                payload = {"requires_2fa": True, "message": "کد دومرحله‌ای ارسال شد."}
                if settings.OTP_DEBUG_RETURN_CODE:
                    payload["debug_code"] = plain_code
                return Response(payload)
        return auth_response(serializer.save())

class PasswordResetView(generics.GenericAPIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]
    throttle_scope = "login"
    throttle_classes = [PhoneScopedRateThrottle]
    serializer_class = PasswordResetSerializer
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "رمز عبور با موفقیت تغییر کرد."})

class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return self.request.user

class PasswordChangeView(generics.GenericAPIView):
    serializer_class = PasswordChangeSerializer
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "رمز عبور تغییر کرد."})

class EmailRequestView(generics.GenericAPIView):
    serializer_class = EmailRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        item = EmailVerification.issue(request.user, serializer.validated_data["email"])
        plain_code = item.plain_code
        send_mail(
            "کد تأیید ایمیل فروشگاه 82",
            f"کد تأیید شما: {plain_code}",
            settings.DEFAULT_FROM_EMAIL,
            [item.email],
            fail_silently=True,
        )
        payload = {"message": "کد تأیید به ایمیل ارسال شد."}
        if settings.DEBUG:
            payload["debug_code"] = plain_code
        return Response(payload, status=status.HTTP_201_CREATED)

class EmailVerifyView(generics.GenericAPIView):
    serializer_class = EmailVerifySerializer
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(UserSerializer(serializer.save()).data)
