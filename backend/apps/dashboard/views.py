from datetime import timedelta
import csv
from django.db import models
from django.http import HttpResponse
from django.db.models import Avg, Count, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.models import User
from apps.products.models import Product
from apps.common.permissions import IsAdminRole
from apps.common.jalali import format_jalali
from apps.orders.models import Order, ReturnRequest
from apps.operations.models import InventoryMovement

class OverviewView(APIView):
    permission_classes = [IsAdminRole]
    def get(self, request):
        paid_statuses = [Order.Status.PAID, Order.Status.PROCESSING, Order.Status.SENT, Order.Status.DELIVERED]
        paid_orders = Order.objects.filter(status__in=paid_statuses)
        revenue = paid_orders.aggregate(total=Sum("total"))["total"] or 0
        last_14_days = timezone.now() - timedelta(days=13)
        chart = (
            Order.objects.filter(created_at__date__gte=last_14_days.date(), status__in=paid_statuses)
            .annotate(day=TruncDate("created_at")).values("day")
            .annotate(revenue=Sum("total"), orders=Count("id")).order_by("day")
        )
        now = timezone.now()
        current_start = now - timedelta(days=30)
        previous_start = current_start - timedelta(days=30)
        current_revenue = paid_orders.filter(created_at__gte=current_start).aggregate(
            value=Sum("total")
        )["value"] or 0
        previous_revenue = paid_orders.filter(
            created_at__gte=previous_start, created_at__lt=current_start
        ).aggregate(value=Sum("total"))["value"] or 0
        current_orders = Order.objects.filter(created_at__gte=current_start).count()
        previous_orders = Order.objects.filter(
            created_at__gte=previous_start, created_at__lt=current_start
        ).count()
        current_customers = User.objects.filter(
            role=User.Role.CUSTOMER, created_at__gte=current_start
        ).count()
        previous_customers = User.objects.filter(
            role=User.Role.CUSTOMER, created_at__gte=previous_start,
            created_at__lt=current_start,
        ).count()

        def growth(current, previous):
            if not previous:
                return 100 if current else 0
            return round((current - previous) * 100 / previous, 1)

        top_customers = (
            User.objects.filter(role=User.Role.CUSTOMER)
            .annotate(
                orders_count=Count("orders", distinct=True),
                total_spent=Sum(
                    "orders__total",
                    filter=models.Q(orders__status__in=paid_statuses),
                ),
            )
            .values("id", "phone", "first_name", "last_name", "orders_count", "total_spent")
            .order_by(F("total_spent").desc(nulls_last=True))[:6]
        )
        today_sales = paid_orders.filter(created_at__date=now.date()).aggregate(
            value=Sum("total")
        )["value"] or 0
        movement_totals = {
            row["movement_type"]: row["quantity"] or 0
            for row in InventoryMovement.objects.filter(
                created_at__date=now.date()
            ).values("movement_type").annotate(quantity=Sum("quantity"))
        }
        returned_order_ids = ReturnRequest.objects.filter(
            status__in=(
                ReturnRequest.Status.APPROVED,
                ReturnRequest.Status.REFUNDED,
            )
        ).values_list("order_id", flat=True)
        returned_orders = Order.objects.filter(id__in=returned_order_ids).count()
        order_status_breakdown = list(
            Order.objects.exclude(
                status=Order.Status.DELIVERED, id__in=returned_order_ids
            ).values("status").annotate(count=Count("id")).order_by("status")
        )
        delivered_index = next(
            (
                index for index, row in enumerate(order_status_breakdown)
                if row["status"] == Order.Status.DELIVERED
            ),
            None,
        )
        delivered_without_returns = Order.objects.filter(
            status=Order.Status.DELIVERED
        ).exclude(id__in=returned_order_ids).count()
        if delivered_index is not None:
            order_status_breakdown[delivered_index]["count"] = delivered_without_returns
        if returned_orders:
            order_status_breakdown.append({
                "status": "RETURNED", "count": returned_orders,
            })
        return Response({
            "metrics": {
                "revenue": revenue,
                "orders": Order.objects.count(),
                "customers": User.objects.filter(role=User.Role.CUSTOMER).count(),
                "products": Product.objects.count(),
                "low_stock": Product.objects.filter(stock__lte=5, is_active=True).count(),
                "pending_orders": Order.objects.filter(status=Order.Status.PENDING).count(),
                "today_sales": today_sales,
                "average_order": round(paid_orders.aggregate(value=Avg("total"))["value"] or 0),
                "delivered_orders": Order.objects.filter(
                    status=Order.Status.DELIVERED
                ).exclude(id__in=returned_order_ids).count(),
                "canceled_orders": Order.objects.filter(status=Order.Status.CANCELED).count(),
                "stock_in_today": movement_totals.get(InventoryMovement.Type.IN, 0),
                "stock_out_today": movement_totals.get(InventoryMovement.Type.OUT, 0),
                "return_stock_today": InventoryMovement.objects.filter(
                    created_at__date=now.date(), reason__startswith="مرجوعی"
                ).aggregate(value=Sum("quantity"))["value"] or 0,
            },
            "growth": {
                "revenue": growth(current_revenue, previous_revenue),
                "orders": growth(current_orders, previous_orders),
                "customers": growth(current_customers, previous_customers),
            },
            "sales_chart": list(chart),
            "recent_orders": list(Order.objects.select_related("user").values(
                "id", "number", "user__phone", "status", "total", "created_at"
            ).order_by("-created_at")[:8]),
            "top_products": list(Product.objects.values(
                "id", "name", "stock", "sold_count", "price"
            ).order_by("-sold_count")[:6]),
            "status_breakdown": order_status_breakdown,
            "return_metrics": {
                "all": ReturnRequest.objects.count(),
                "requested": ReturnRequest.objects.filter(
                    status=ReturnRequest.Status.REQUESTED
                ).count(),
                "reviewing": ReturnRequest.objects.filter(
                    status=ReturnRequest.Status.REVIEWING
                ).count(),
                "approved": ReturnRequest.objects.filter(
                    status=ReturnRequest.Status.APPROVED
                ).count(),
                "refunded": ReturnRequest.objects.filter(
                    status=ReturnRequest.Status.REFUNDED
                ).count(),
                "amount": ReturnRequest.objects.filter(
                    refund_paid=True
                ).aggregate(value=Sum("refund_amount"))["value"] or 0,
            },
            "low_stock_products": list(
                Product.objects.filter(stock__lte=5, is_active=True)
                .values("id", "name", "sku", "stock").order_by("stock")[:20]
            ),
            "top_customers": list(top_customers),
            "recent_inventory": list(
                InventoryMovement.objects.select_related("product").values(
                    "id", "product__name", "movement_type", "quantity",
                    "stock_after", "reason", "reference", "created_at",
                )[:10]
            ),
            "generated_at": now,
        })

class CustomersExportView(APIView):
    permission_classes = [IsAdminRole]
    def get(self, request):
        response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
        response["Content-Disposition"] = 'attachment; filename="customers.csv"'
        writer = csv.writer(response)
        writer.writerow(("موبایل", "نام", "ایمیل", "وضعیت", "تاریخ عضویت"))
        for user in User.objects.filter(role=User.Role.CUSTOMER).order_by("-created_at"):
            writer.writerow(
                (user.phone, user.full_name, user.email or "", user.is_active, format_jalali(user.created_at))
            )
        return response
