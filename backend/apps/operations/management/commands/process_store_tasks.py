from datetime import timedelta
from django.core.management import call_command
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.accounts.models import Notification
from apps.operations.models import AbandonedCart, InventoryReservation, ServiceHealth
from apps.orders.models import Order, OrderStatusHistory


class Command(BaseCommand):
    help = "آزادسازی رزروهای منقضی، یادآوری سبدهای رهاشده و ثبت سلامت سرویس"

    def handle(self, *args, **options):
        now = timezone.now()
        released = InventoryReservation.objects.filter(
            is_active=True, expires_at__lte=now
        ).update(is_active=False)
        expired_orders = Order.objects.filter(
            status=Order.Status.PENDING, expires_at__isnull=False, expires_at__lte=now
        )
        expired_count = 0
        for order in expired_orders.iterator():
            OrderStatusHistory.objects.create(
                order=order, from_status=order.status, to_status=Order.Status.CANCELED,
                note="لغو خودکار به‌علت پایان مهلت پرداخت",
            )
            order.status = Order.Status.CANCELED
            order.save(update_fields=("status", "updated_at"))
            expired_count += 1
        carts = AbandonedCart.objects.filter(
            updated_at__lte=now - timedelta(hours=6), total__gt=0,
            reminder_sent_at__isnull=True,
        ).select_related("user")
        reminded = 0
        for cart in carts:
            Notification.objects.create(
                user=cart.user, title="سبد خرید شما منتظر است",
                message="محصولات سبد خریدتان هنوز موجودند؛ خرید را تکمیل کنید.",
            )
            cart.reminder_sent_at = now
            cart.save(update_fields=("reminder_sent_at", "updated_at"))
            reminded += 1
        ServiceHealth.objects.create(
            service="scheduled-store-tasks", is_healthy=True,
            message=f"released={released}, reminded={reminded}",
        )
        backup_today = ServiceHealth.objects.filter(
            service="daily-backup", created_at__date=now.date(), is_healthy=True
        ).exists()
        if not backup_today:
            try:
                call_command("backup_store")
                ServiceHealth.objects.create(
                    service="daily-backup", is_healthy=True,
                    message="پشتیبان روزانه پایگاه داده و رسانه ساخته شد.",
                )
            except Exception as exc:
                ServiceHealth.objects.create(
                    service="daily-backup", is_healthy=False,
                    message=str(exc)[:500],
                )
                self.stderr.write(self.style.WARNING(
                    f"ساخت پشتیبان روزانه ناموفق بود: {exc}"
                ))
        self.stdout.write(self.style.SUCCESS(
            f"{released} رزرو آزاد، {expired_count} سفارش منقضی و {reminded} یادآوری ارسال شد."
        ))
