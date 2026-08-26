from ._shared import *
from .backup import *

class SupplierViewSet(AdminModelViewSet):
    queryset = Supplier.objects.all().order_by("-created_at")
    serializer_class = SupplierSerializer
    search_fields = ("name", "phone", "contact_name")

class WarehouseViewSet(AdminModelViewSet):
    queryset = Warehouse.objects.all()
    serializer_class = WarehouseSerializer
    search_fields = ("name", "code")

class WarehouseStockViewSet(AdminModelViewSet):
    queryset = WarehouseStock.objects.select_related("warehouse", "product")
    serializer_class = WarehouseStockSerializer
    filterset_fields = ("warehouse", "product")

class StockTransferViewSet(AdminModelViewSet):
    queryset = StockTransfer.objects.select_related("source", "destination", "product")
    serializer_class = StockTransferSerializer
    filterset_fields = ("status", "source", "destination", "product")
    @action(detail=True, methods=["post"])
    @transaction.atomic
    def receive(self, request, pk=None):
        transfer = StockTransfer.objects.select_for_update().get(pk=self.get_object().pk)
        if transfer.status == StockTransfer.Status.RECEIVED:
            return Response({"detail": "این انتقال قبلاً دریافت شده است."}, status=409)
        source = WarehouseStock.objects.select_for_update().get(
            warehouse=transfer.source, product=transfer.product
        )
        if source.sellable_quantity < transfer.quantity:
            return Response({"detail": "موجودی قابل فروش انبار مبدأ کافی نیست."}, status=400)
        destination, _ = WarehouseStock.objects.select_for_update().get_or_create(
            warehouse=transfer.destination, product=transfer.product
        )
        source.quantity -= transfer.quantity
        destination.quantity += transfer.quantity
        source.save(update_fields=("quantity", "updated_at"))
        destination.save(update_fields=("quantity", "updated_at"))
        transfer.status = StockTransfer.Status.RECEIVED
        transfer.save(update_fields=("status", "updated_at"))
        return Response(self.get_serializer(transfer).data)

class ProductSupplierViewSet(AdminModelViewSet):
    queryset = ProductSupplier.objects.select_related("product", "supplier")
    serializer_class = ProductSupplierSerializer
    filterset_fields = ("product", "supplier", "is_preferred")

class SupplierLedgerViewSet(AdminModelViewSet):
    queryset = SupplierLedger.objects.select_related("supplier")
    serializer_class = SupplierLedgerSerializer
    filterset_fields = ("supplier", "entry_type")
    @transaction.atomic
    def perform_create(self, serializer):
        entry = serializer.save()
        delta = entry.amount if entry.entry_type == SupplierLedger.Type.PURCHASE else -entry.amount
        Supplier.objects.filter(pk=entry.supplier_id).update(current_balance=F("current_balance") + delta)

