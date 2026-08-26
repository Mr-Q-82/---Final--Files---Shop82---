from ._shared import *
from .users import *
from .tokens import issue_user_tokens

class OTPRequestSerializer(serializers.Serializer):
    phone = serializers.CharField()
    purpose = serializers.ChoiceField(choices=OTP.Purpose.choices)
    def validate_phone(self, value):
        return normalize_phone(value)

class OTPVerifySerializer(serializers.Serializer):
    phone = serializers.CharField()
    purpose = serializers.ChoiceField(choices=OTP.Purpose.choices)
    code = serializers.RegexField(r"^\d{6}$")
    first_name = serializers.CharField(max_length=80, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=100, required=False, allow_blank=True)
    password = serializers.CharField(
        min_length=8, max_length=128, required=False, write_only=True
    )
    password_confirm = serializers.CharField(
        min_length=8, max_length=128, required=False, write_only=True
    )
    referral_code = serializers.CharField(
        max_length=16, required=False, allow_blank=True, write_only=True
    )
    def validate_phone(self, value):
        return normalize_phone(value)
    def validate_first_name(self, value):
        return validate_person_name(value, field_label="نام")
    def validate_last_name(self, value):
        return validate_person_name(value, field_label="نام خانوادگی")
    def validate_referral_code(self, value):
        return validate_referral_code(value)
    def validate_password(self, value):
        return validate_password_strength(value)
    def validate(self, attrs):
        if attrs["purpose"] == OTP.Purpose.REGISTER:
            password = attrs.get("password", "")
            password_confirm = attrs.get("password_confirm", "")
            if not password or not password_confirm:
                raise serializers.ValidationError(
                    {"password": "رمز عبور و تکرار آن برای ثبت‌نام الزامی است."}
                )
            if password != password_confirm:
                raise serializers.ValidationError(
                    {"password_confirm": "تکرار رمز عبور با رمز عبور یکسان نیست."}
                )
            if find_user_by_phone(attrs["phone"]):
                raise serializers.ValidationError(
                    {"phone": "این شماره قبلاً ثبت‌نام کرده است؛ وارد حساب شوید."}
                )
        referral_code = attrs.get("referral_code", "").strip().upper()
        if attrs["purpose"] == OTP.Purpose.REGISTER and referral_code:
            inviter = LoyaltyProfile.objects.filter(
                referral_code=referral_code,
                user__is_active=True,
                user__is_deleted=False,
            ).first()
            if not inviter or inviter.user.phone == attrs["phone"]:
                raise serializers.ValidationError("کد دعوت معتبر نیست.")
            attrs["referral_code"] = referral_code
        otp = OTP.objects.filter(phone=attrs["phone"], purpose=attrs["purpose"], is_used=False).order_by("-created_at").first()
        if not otp or not otp.verify(attrs["code"]):
            raise serializers.ValidationError("کد نامعتبر یا منقضی شده است.")
        attrs["otp"] = otp
        return attrs
    @transaction.atomic
    def create(self, validated_data):
        if validated_data["purpose"] == OTP.Purpose.LOGIN:
            user = find_user_by_phone(validated_data["phone"])
            if not user:
                raise serializers.ValidationError("حسابی با این شماره پیدا نشد.")
        else:
            user = User(phone=validated_data["phone"])
            user.set_password(validated_data["password"])
        if not user.is_active:
            raise serializers.ValidationError("این حساب غیرفعال است.")
        user.is_verified = True
        if validated_data.get("first_name"):
            user.first_name = validated_data["first_name"]
        if validated_data.get("last_name"):
            user.last_name = validated_data["last_name"]
        user.save()
        referral_code = validated_data.get("referral_code", "").strip().upper()
        if validated_data["purpose"] == OTP.Purpose.REGISTER:
            # Every newly registered customer receives a real, unique invitation
            # code immediately, even when they did not use another user's code.
            profile = LoyaltyProfile.objects.select_for_update().get_or_create(user=user)[0]
        if validated_data["purpose"] == OTP.Purpose.REGISTER and referral_code:
            if profile.referred_by_id:
                raise serializers.ValidationError("کد دعوت قبلاً برای این حساب ثبت شده است.")
            inviter = LoyaltyProfile.objects.select_for_update().filter(
                referral_code=referral_code,
                user__is_active=True,
                user__is_deleted=False,
            ).exclude(user=user).first()
            if not inviter:
                raise serializers.ValidationError("کد دعوت معتبر نیست.")
            loyalty_setting = LoyaltySetting.get_solo()
            profile.referred_by = inviter.user
            if loyalty_setting.is_active:
                profile.points += loyalty_setting.invited_user_bonus
                inviter.points += loyalty_setting.inviter_bonus
            profile.save()
            inviter.save()
            event = ReferralEvent.objects.create(
                inviter=inviter.user,
                invited_user=user,
                referral_code=referral_code,
                inviter_points_awarded=(
                    loyalty_setting.inviter_bonus if loyalty_setting.is_active else 0
                ),
                invited_points_awarded=(
                    loyalty_setting.invited_user_bonus if loyalty_setting.is_active else 0
                ),
            )
            reference = f"REFERRAL-{event.pk}"
            if event.inviter_points_awarded:
                LoyaltyPointEntry.objects.create(
                    profile=inviter,
                    amount=event.inviter_points_awarded,
                    reason=f"دعوت موفق {user.full_name or user.phone}",
                    reference=reference,
                )
            if event.invited_points_awarded:
                LoyaltyPointEntry.objects.create(
                    profile=profile,
                    amount=event.invited_points_awarded,
                    reason="پاداش ثبت‌نام با کد دعوت",
                    reference=reference,
                )
            Notification.objects.create(
                user=inviter.user,
                title="دعوت موفق دوست",
                message=(
                    f"{user.full_name or user.phone} با شماره {user.phone} با کد دعوت شما "
                    f"ثبت‌نام کرد و {event.inviter_points_awarded} امتیاز دریافت کردید."
                ),
                target_section="loyalty",
                target_id=str(event.pk),
            )
        return issue_user_tokens(user, self.context.get("request"))

class PasswordLoginSerializer(serializers.Serializer):
    phone = serializers.CharField()
    password = serializers.CharField(write_only=True)
    def validate_phone(self, value):
        return normalize_phone(value)
    def validate(self, attrs):
        user = find_user_by_phone(attrs["phone"])
        if not user:
            raise serializers.ValidationError("شماره موبایل یا رمز عبور صحیح نیست.")
        if user.is_temporarily_locked:
            raise serializers.ValidationError("حساب موقتاً قفل است؛ کمی بعد دوباره تلاش کنید.")
        if not user.has_usable_password():
            raise serializers.ValidationError("برای این حساب هنوز رمز تعیین نشده؛ با کد تأیید وارد شوید.")
        if not user.check_password(attrs["password"]):
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= settings.LOGIN_MAX_ATTEMPTS:
                user.locked_until = timezone.now() + timezone.timedelta(seconds=settings.LOGIN_LOCK_SECONDS)
                user.failed_login_attempts = 0
            user.save(update_fields=["failed_login_attempts", "locked_until", "updated_at"])
            raise serializers.ValidationError("شماره موبایل یا رمز عبور صحیح نیست.")
        if not user.is_active:
            raise serializers.ValidationError("این حساب غیرفعال است.")
        attrs["user"] = user
        if user.failed_login_attempts or user.locked_until:
            user.failed_login_attempts = 0
            user.locked_until = None
            user.save(update_fields=["failed_login_attempts", "locked_until", "updated_at"])
        return attrs
    def create(self, validated_data):
        user = validated_data["user"]
        return issue_user_tokens(user, self.context.get("request"))

class PasswordResetSerializer(serializers.Serializer):
    phone = serializers.CharField()
    code = serializers.RegexField(r"^\d{6}$")
    new_password = serializers.CharField(min_length=8, write_only=True)
    new_password_confirm = serializers.CharField(
        min_length=8, write_only=True, required=False
    )

    def validate_new_password(self, value):
        return validate_password_strength(value)
    def validate_phone(self, value):
        return normalize_phone(value)
    def validate(self, attrs):
        password_confirm = attrs.get("new_password_confirm")
        if password_confirm is not None and attrs["new_password"] != password_confirm:
            raise serializers.ValidationError(
                {"new_password_confirm": "تکرار رمز عبور جدید یکسان نیست."}
            )
        user = find_user_by_phone(attrs["phone"], active_only=True)
        if not user:
            raise serializers.ValidationError("حساب فعالی با این شماره پیدا نشد.")
        otp = OTP.objects.filter(
            phone=attrs["phone"],
            purpose=OTP.Purpose.RESET_PASSWORD,
            is_used=False,
        ).order_by("-created_at").first()
        if not otp or not otp.verify(attrs["code"]):
            raise serializers.ValidationError("کد بازیابی نامعتبر یا منقضی شده است.")
        attrs["user"] = user
        return attrs
    def save(self):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.credentials_changed_at = timezone.now()
        user.failed_login_attempts = 0
        user.locked_until = None
        user.save(update_fields=["password", "credentials_changed_at", "failed_login_attempts", "locked_until", "updated_at"])
        UserSession.objects.filter(user=user, revoked_at__isnull=True).update(revoked_at=timezone.now())
        return user
