from ._shared import *
from .authentication import *

class AddressViewSet(viewsets.ModelViewSet):
    serializer_class = AddressSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Address.objects.filter(user=self.request.user)
    def perform_create(self, serializer):
        if serializer.validated_data.get("is_default"):
            self.get_queryset().update(is_default=False)
        serializer.save(user=self.request.user)

class AdminUserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.filter(is_deleted=False).order_by("-created_at")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdminRole]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]
    search_fields = ["phone", "first_name", "last_name", "email"]
    ordering_fields = ["created_at", "role"]
    @action(detail=True, methods=["post"])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        user.is_active = not user.is_active
        user.save(update_fields=["is_active", "updated_at"])
        return Response(self.get_serializer(user).data)

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user.pk == request.user.pk:
            return Response({"detail": "مدیر نمی‌تواند حساب فعال خودش را حذف کند."}, status=400)
        if user.role == User.Role.ADMIN and User.objects.filter(
            role=User.Role.ADMIN, is_active=True, is_deleted=False
        ).count() <= 1:
            return Response({"detail": "آخرین مدیر فعال قابل حذف نیست."}, status=400)
        user.phone = "DEL" + user.id.hex[:12]
        user.email = None
        user.first_name = ""
        user.last_name = ""
        user.national_id = ""
        user.is_active = False
        user.is_staff = False
        user.is_superuser = False
        user.is_deleted = True
        user.deleted_at = timezone.now()
        user.set_unusable_password()
        user.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class NotificationViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)
    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        item = self.get_object()
        item.is_read = True
        item.save(update_fields=["is_read", "updated_at"])
        return Response(self.get_serializer(item).data)

class AdminNotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminRole]
    queryset = Notification.objects.select_related("user")
    http_method_names = ["get", "post", "delete", "head", "options"]
    def create(self, request, *args, **kwargs):
        title = request.data.get("title", "").strip()
        message = request.data.get("message", "").strip()
        user_id = request.data.get("user")
        if not title or not message:
            return Response({"detail": "عنوان و متن پیام الزامی است."}, status=status.HTTP_400_BAD_REQUEST)
        users = User.objects.filter(is_active=True)
        if user_id:
            users = users.filter(id=user_id)
        broadcast_id = uuid.uuid4()
        created = [
            Notification(
                user=user, title=title, message=message,
                broadcast_id=broadcast_id, created_by=request.user,
            )
            for user in users
        ]
        Notification.objects.bulk_create(created)
        return Response(
            {
                "message": f"پیام برای {len(created)} کاربر ثبت شد.",
                "broadcast_id": broadcast_id,
            },
            status=status.HTTP_201_CREATED,
        )

    def perform_destroy(self, instance):
        if instance.broadcast_id:
            Notification.objects.filter(
                broadcast_id=instance.broadcast_id
            ).delete()
        else:
            instance.delete()

