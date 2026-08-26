from ._shared import *

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    staff_permissions = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ("id", "phone", "email", "email_verified", "first_name", "last_name", "national_id", "avatar", "full_name", "role", "staff_permissions", "is_verified", "created_at")
        read_only_fields = ("phone", "email", "email_verified", "role", "is_verified", "created_at")

    def get_staff_permissions(self, obj):
        if obj.role == User.Role.ADMIN:
            return ["*"]
        try:
            return list(obj.staff_permissions.permissions or [])
        except StaffPermission.DoesNotExist:
            return []

    def validate_first_name(self, value):
        return validate_person_name(value, field_label="نام")

    def validate_last_name(self, value):
        return validate_person_name(value, field_label="نام خانوادگی")

    def validate_national_id(self, value):
        return validate_national_id(value)

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        exclude = ("user",)

    def validate_recipient_name(self, value):
        return validate_person_name(value, field_label="نام تحویل‌گیرنده", required=True)

    def validate_recipient_phone(self, value):
        return normalize_phone(value)

    def validate_postal_code(self, value):
        return validate_postal_code(value)

    def validate_national_id(self, value):
        return validate_national_id(value)

    def validate_address(self, value):
        return validate_safe_text(value, field_label="آدرس", minimum=10, maximum=500)

    def validate(self, attrs):
        latitude = attrs.get("latitude", getattr(self.instance, "latitude", None))
        longitude = attrs.get("longitude", getattr(self.instance, "longitude", None))
        if (latitude is None) != (longitude is None):
            raise serializers.ValidationError(
                {"location": "عرض و طول جغرافیایی باید با هم ارسال شوند."}
            )
        return attrs

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = "__all__"
        read_only_fields = ("user",)

    def validate_title(self, value):
        return validate_safe_text(value, field_label="عنوان اعلان", minimum=2, maximum=140)

    def validate_message(self, value):
        return validate_safe_text(value, field_label="متن اعلان", minimum=2, maximum=2000)

class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    new_password = serializers.CharField(min_length=8, write_only=True)

    def validate_new_password(self, value):
        return validate_password_strength(value)
    def validate_current_password(self, value):
        user = self.context["request"].user
        if user.has_usable_password() and not user.check_password(value):
            raise serializers.ValidationError("رمز فعلی صحیح نیست.")
        return value
    def save(self):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.credentials_changed_at = timezone.now()
        user.failed_login_attempts = 0
        user.locked_until = None
        user.save(update_fields=["password", "credentials_changed_at", "failed_login_attempts", "locked_until", "updated_at"])
        UserSession.objects.filter(user=user, revoked_at__isnull=True).update(revoked_at=timezone.now())
        return user

class EmailRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()
    def validate_email(self, value):
        user = self.context["request"].user
        if User.objects.exclude(id=user.id).filter(email__iexact=value).exists():
            raise serializers.ValidationError("این ایمیل قبلاً استفاده شده است.")
        return value.lower()

class EmailVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r"^\d{6}$")
    def validate(self, attrs):
        item = EmailVerification.objects.filter(
            user=self.context["request"].user,
            email__iexact=attrs["email"],
            is_used=False,
            expires_at__gt=timezone.now(),
        ).order_by("-created_at").first()
        if not item or not item.verify(attrs["code"]):
            raise serializers.ValidationError("کد ایمیل نامعتبر یا منقضی شده است.")
        attrs["verification"] = item
        return attrs
    def save(self):
        item = self.validated_data["verification"]
        item.is_used = True
        item.save(update_fields=["is_used", "updated_at"])
        user = self.context["request"].user
        user.email = item.email
        user.email_verified = True
        user.save(update_fields=["email", "email_verified", "updated_at"])
        return user

