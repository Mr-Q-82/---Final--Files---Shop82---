from ._shared import *

class User(TimeStampedModel, AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        CUSTOMER = "CUSTOMER", "مشتری"
        STAFF = "STAFF", "کارمند"
        ADMIN = "ADMIN", "مدیر"

    phone = models.CharField(max_length=15, unique=True, db_index=True)
    email = models.EmailField(blank=True, null=True, unique=True)
    email_verified = models.BooleanField(default=False)
    first_name = models.CharField(max_length=80, blank=True)
    last_name = models.CharField(max_length=100, blank=True)
    national_id = models.CharField(max_length=10, blank=True)
    avatar = models.CharField(max_length=40, blank=True, default="avatar-1")
    role = models.CharField(max_length=12, choices=Role.choices, default=Role.CUSTOMER)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until = models.DateTimeField(null=True, blank=True)
    credentials_changed_at = models.DateTimeField(null=True, blank=True)
    objects = UserManager()

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = []

    class Meta:
        indexes = [
            models.Index(fields=["role", "-created_at"], name="user_role_created_idx"),
            models.Index(
                fields=["role", "is_active", "is_deleted"],
                name="user_role_active_idx",
            ),
        ]

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    @property
    def is_temporarily_locked(self):
        return bool(self.locked_until and self.locked_until > timezone.now())

class Address(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="addresses")
    title = models.CharField(max_length=60, default="خانه")
    recipient_name = models.CharField(max_length=120)
    recipient_phone = models.CharField(max_length=15)
    province = models.CharField(max_length=80)
    city = models.CharField(max_length=80)
    postal_code = models.CharField(max_length=10)
    national_id = models.CharField(max_length=10, blank=True, default="")
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_default = models.BooleanField(default=False)

class Notification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=140)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    target_section = models.CharField(max_length=40, blank=True)
    target_id = models.CharField(max_length=80, blank=True)
    broadcast_id = models.UUIDField(null=True, blank=True, db_index=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="sent_notifications",
    )
    class Meta:
        ordering = ("-created_at",)
        indexes = [
            models.Index(fields=["user", "is_read", "-created_at"], name="notif_user_read_idx")
        ]

class EmailVerification(TimeStampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_verifications")
    email = models.EmailField()
    code = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    @classmethod
    def issue(cls, user, email):
        cls.objects.filter(user=user, is_used=False).update(is_used=True)
        plain_code = f"{secrets.randbelow(900000) + 100000}"
        item = cls.objects.create(
            user=user,
            email=email,
            code=make_password(plain_code),
            expires_at=timezone.now() + timedelta(minutes=10),
        )
        item.plain_code = plain_code
        return item

    @transaction.atomic
    def verify(self, candidate):
        item = type(self).objects.select_for_update().get(pk=self.pk)
        if item.is_used or item.expires_at <= timezone.now():
            return False
        valid = check_password(candidate, item.code)
        if not valid and len(item.code) == 6:  # legacy rows
            valid = secrets.compare_digest(item.code, candidate)
        if valid:
            item.is_used = True
            item.save(update_fields=["is_used", "updated_at"])
            self.is_used = True
        return valid

class OTP(TimeStampedModel):
    class Purpose(models.TextChoices):
        REGISTER = "REGISTER", "ثبت‌نام"
        LOGIN = "LOGIN", "ورود"
        RESET_PASSWORD = "RESET_PASSWORD", "بازیابی رمز عبور"
    phone = models.CharField(max_length=15, db_index=True)
    code = models.CharField(max_length=128)
    purpose = models.CharField(max_length=20, choices=Purpose.choices)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    is_used = models.BooleanField(default=False)
    class Meta:
        indexes = [
            models.Index(fields=["phone", "purpose", "is_used", "-created_at"], name="otp_lookup_idx")
        ]

    @classmethod
    def issue(cls, phone, purpose):
        cls.objects.filter(phone=phone, purpose=purpose, is_used=False).update(is_used=True)
        plain_code = f"{secrets.randbelow(900000) + 100000}"
        item = cls.objects.create(
            phone=phone,
            purpose=purpose,
            code=make_password(plain_code),
            expires_at=timezone.now() + timedelta(seconds=settings.OTP_LIFETIME_SECONDS),
        )
        item.plain_code = plain_code
        return item

    @transaction.atomic
    def verify(self, code):
        item = type(self).objects.select_for_update().get(pk=self.pk)
        if item.is_used or item.expires_at < timezone.now() or item.attempts >= settings.OTP_MAX_ATTEMPTS:
            return False
        item.attempts += 1
        valid = check_password(code, item.code)
        if not valid and len(item.code) == 6:  # compatibility with existing OTP rows
            valid = secrets.compare_digest(item.code, code)
        if valid:
            item.is_used = True
            item.save(update_fields=["attempts", "is_used", "updated_at"])
            self.is_used = True
            self.attempts = item.attempts
            return True
        item.save(update_fields=["attempts", "updated_at"])
        self.attempts = item.attempts
        return False

class SecurityEvent(TimeStampedModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="security_events",
    )
    phone = models.CharField(max_length=15, blank=True)
    event_type = models.CharField(max_length=40)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.CharField(max_length=300, blank=True)
    success = models.BooleanField(default=False)
    details = models.JSONField(default=dict, blank=True)
    class Meta:
        ordering = ("-created_at",)

