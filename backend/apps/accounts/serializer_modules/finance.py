from ._shared import *
from .users import *
from .authentication import *

class AdminUserSerializer(UserSerializer):
    password = serializers.CharField(write_only=True, required=False, min_length=8)
    phone = serializers.CharField()
    email = serializers.EmailField(required=False, allow_null=True, allow_blank=True)
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ("is_active", "is_staff", "password")
        read_only_fields = ("created_at",)
    def validate_phone(self, value):
        value = normalize_phone(value)
        qs = User.objects.filter(phone=value)
        if self.instance:
            qs = qs.exclude(id=self.instance.id)
        if qs.exists():
            raise serializers.ValidationError("این شماره موبایل قبلاً ثبت شده است.")
        return value

    def validate_password(self, value):
        return validate_password_strength(value)
    def create(self, validated_data):
        password = validated_data.pop("password", None)
        return User.objects.create_user(password=password, **validated_data)
    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save(update_fields=["password", "updated_at"])
        return instance

class WalletTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = WalletTransaction
        fields = "__all__"
        read_only_fields = ("wallet", "balance_after")

class WalletSerializer(serializers.ModelSerializer):
    transactions = WalletTransactionSerializer(many=True, read_only=True)
    class Meta:
        model = Wallet
        fields = ("id", "balance", "transactions", "created_at")
        read_only_fields = fields

class ReferralEventSerializer(serializers.ModelSerializer):
    inviter_name = serializers.CharField(source="inviter.full_name", read_only=True)
    inviter_phone = serializers.CharField(source="inviter.phone", read_only=True)
    invited_name = serializers.CharField(source="invited_user.full_name", read_only=True)
    invited_phone = serializers.CharField(source="invited_user.phone", read_only=True)

    class Meta:
        model = ReferralEvent
        fields = (
            "id", "inviter", "inviter_name", "inviter_phone", "invited_user",
            "invited_name", "invited_phone", "referral_code",
            "inviter_points_awarded", "invited_points_awarded", "admin_note",
            "created_at",
        )
        read_only_fields = fields


class LoyaltySerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source="get_level_display", read_only=True)
    min_redeem_points = serializers.SerializerMethodField()
    toman_per_point = serializers.SerializerMethodField()
    purchase_step_amount = serializers.SerializerMethodField()
    points_per_step = serializers.SerializerMethodField()
    referral_history = serializers.SerializerMethodField()
    class Meta:
        model = LoyaltyProfile
        fields = "__all__"
        read_only_fields = ("user", "points", "level", "referral_code")

    def get_setting(self):
        if not hasattr(self, "_loyalty_setting"):
            self._loyalty_setting = LoyaltySetting.get_solo()
        return self._loyalty_setting

    def get_min_redeem_points(self, obj):
        return self.get_setting().min_redeem_points

    def get_toman_per_point(self, obj):
        return self.get_setting().toman_per_point

    def get_purchase_step_amount(self, obj):
        return self.get_setting().purchase_step_amount

    def get_points_per_step(self, obj):
        return self.get_setting().points_per_step

    def get_referral_history(self, obj):
        queryset = ReferralEvent.objects.filter(inviter=obj.user).select_related(
            "inviter", "invited_user"
        )
        return ReferralEventSerializer(queryset, many=True).data


class LoyaltySettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltySetting
        fields = "__all__"
        read_only_fields = ("id", "created_at", "updated_at")

class LoyaltyMissionSerializer(serializers.ModelSerializer):
    class Meta: model = LoyaltyMission; fields = "__all__"

class LoyaltyPointEntrySerializer(serializers.ModelSerializer):
    class Meta: model = LoyaltyPointEntry; fields = "__all__"

class UserSessionSerializer(serializers.ModelSerializer):
    is_active = serializers.SerializerMethodField()
    class Meta:
        model = UserSession
        fields = "__all__"
        read_only_fields = ("user", "refresh_jti", "ip_address", "user_agent", "last_seen_at")
    def get_is_active(self, obj):
        return obj.revoked_at is None

