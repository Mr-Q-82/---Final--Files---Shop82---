from ._shared import *
from .authentication import *
from .users import *

class WalletView(generics.RetrieveAPIView):
    serializer_class = WalletSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return Wallet.objects.get_or_create(user=self.request.user)[0]

    @transaction.atomic
    def post(self, request):
        if not settings.WALLET_DIRECT_TOPUP_ENABLED:
            return Response(
                {"detail": "شارژ مستقیم غیرفعال است؛ پرداخت باید از درگاه تأیید شود."},
                status=403,
            )
        amount = int(request.data.get("amount", 0) or 0)
        if amount < 10_000 or amount > 100_000_000:
            return Response(
                {"detail": "مبلغ شارژ باید بین ۱۰ هزار تا ۱۰۰ میلیون تومان باشد."},
                status=400,
            )
        wallet = Wallet.objects.select_for_update().get_or_create(
            user=request.user
        )[0]
        wallet.balance += amount
        wallet.save(update_fields=("balance", "updated_at"))
        WalletTransaction.objects.create(
            wallet=wallet,
            transaction_type=WalletTransaction.Type.CREDIT,
            amount=amount,
            description="شارژ کیف پول توسط کاربر",
            reference=f"TOPUP-{uuid.uuid4().hex[:12].upper()}",
            balance_after=wallet.balance,
        )
        return Response(WalletSerializer(wallet).data)

class LoyaltyView(generics.RetrieveAPIView):
    serializer_class = LoyaltySerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_object(self):
        return LoyaltyProfile.objects.get_or_create(user=self.request.user)[0]

    @transaction.atomic
    def post(self, request):
        profile = LoyaltyProfile.objects.select_for_update().get_or_create(user=request.user)[0]
        loyalty_setting = LoyaltySetting.get_solo()
        referral_code = str(request.data.get("referral_code", "")).strip().upper()
        if referral_code:
            return Response(
                {"detail": "کد دعوت فقط هنگام ثبت‌نام حساب جدید قابل استفاده است."},
                status=400,
            )

        points = int(request.data.get("redeem_points", 0) or 0)
        if points < loyalty_setting.min_redeem_points:
            return Response(
                {"detail": f"حداقل {loyalty_setting.min_redeem_points} امتیاز قابل تبدیل است."},
                status=400,
            )
        if profile.points < points:
            return Response({"detail": "امتیاز کافی نیست."}, status=400)
        wallet = Wallet.objects.select_for_update().get_or_create(user=request.user)[0]
        amount = points * loyalty_setting.toman_per_point
        profile.points -= points
        profile.save()
        wallet.balance += amount
        wallet.save(update_fields=("balance", "updated_at"))
        WalletTransaction.objects.create(
            wallet=wallet, transaction_type=WalletTransaction.Type.REWARD, amount=amount,
            description=f"تبدیل {points} امتیاز باشگاه مشتریان",
            balance_after=wallet.balance,
        )
        return Response({"wallet": WalletSerializer(wallet).data, "loyalty": self.get_serializer(profile).data})


class LoyaltySettingView(generics.RetrieveUpdateAPIView):
    serializer_class = LoyaltySettingSerializer
    permission_classes = [IsAdminRole]

    def get_object(self):
        return LoyaltySetting.get_solo()

class LoyaltyMissionViewSet(viewsets.ModelViewSet):
    serializer_class = LoyaltyMissionSerializer
    queryset = LoyaltyMission.objects.all()
    def get_permissions(self):
        return [permissions.IsAuthenticated()] if self.action == "list" else [IsAdminRole()]
    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.role in {"ADMIN", "STAFF"}:
            now = timezone.now()
            qs = qs.filter(is_active=True).filter(
                models.Q(starts_at__isnull=True) | models.Q(starts_at__lte=now),
                models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=now),
            )
        return qs

class LoyaltyPointEntryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LoyaltyPointEntrySerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        qs = LoyaltyPointEntry.objects.select_related("profile", "profile__user")
        if self.request.user.role in {"ADMIN", "STAFF"}:
            return qs
        return qs.filter(profile__user=self.request.user)


class ReferralEventViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReferralEventSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        queryset = ReferralEvent.objects.select_related("inviter", "invited_user")
        phone = str(self.request.query_params.get("phone", "")).strip()
        if phone:
            queryset = queryset.filter(
                models.Q(inviter__phone__icontains=phone)
                | models.Q(invited_user__phone__icontains=phone)
            )
        return queryset

class UserSessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return UserSession.objects.filter(user=self.request.user).order_by("-last_seen_at")
    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        item = self.get_object()
        item.revoked_at = timezone.now()
        item.save(update_fields=("revoked_at", "updated_at"))
        return Response(self.get_serializer(item).data)
    @action(detail=False, methods=["post"], url_path="revoke-all")
    def revoke_all(self, request):
        count = self.get_queryset().filter(revoked_at__isnull=True).update(revoked_at=timezone.now())
        return Response({"revoked": count})


class AdminRecoveryCodeView(generics.GenericAPIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        codes = AdminRecoveryCode.issue_batch(request.user)
        return Response({
            "codes": codes,
            "warning": "این کدها فقط یک‌بار نمایش داده می‌شوند؛ آن‌ها را در محل امن نگهداری کنید.",
        }, status=201)

    def delete(self, request):
        deleted, _ = AdminRecoveryCode.objects.filter(user=request.user).delete()
        return Response({"revoked": deleted})

