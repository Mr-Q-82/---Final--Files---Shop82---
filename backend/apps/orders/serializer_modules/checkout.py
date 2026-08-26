from ._shared import *
from .common import *

class CheckoutSerializer(serializers.Serializer):
    address_id = serializers.UUIDField()
    items = CheckoutItemSerializer(many=True, allow_empty=False)
    note = serializers.CharField(required=False, allow_blank=True)
    discount_code = serializers.CharField(required=False, allow_blank=True)
    idempotency_key = serializers.CharField(max_length=80, required=False, allow_blank=True)
    shipping_rule_id = serializers.UUIDField(required=False, allow_null=True)
    delivery_slot_id = serializers.UUIDField(required=False, allow_null=True)

    def validate_address_id(self, value):
        user = self.context["request"].user
        if not Address.objects.filter(id=value, user=user).exists():
            raise serializers.ValidationError("آدرس انتخاب‌شده معتبر نیست.")
        return value

    @transaction.atomic
    def create(self, data):
        user = self.context["request"].user
        idempotency_key = data.get("idempotency_key", "").strip()
        if idempotency_key:
            previous = Order.objects.filter(
                user=user, idempotency_key=idempotency_key
            ).first()
            if previous:
                return previous
        address = Address.objects.get(id=data["address_id"], user=user)
        product_ids = {str(item["product_id"]) for item in data["items"]}
        products = {
            str(item.id): item for item in Product.objects.select_for_update().filter(
                id__in=product_ids, is_active=True
            )
        }
        if len(products) != len(product_ids):
            raise serializers.ValidationError("یک یا چند محصول معتبر نیست.")
        subtotal = 0
        lines = []
        from apps.operations.models import InventoryReservation
        for item in data["items"]:
            product = products[str(item["product_id"])]
            qty = item["quantity"]
            variant = None
            unit_price = product.final_price
            customization_snapshot = []
            customization_price = 0
            if item.get("variant_id"):
                variant = ProductVariant.objects.select_for_update().filter(
                    id=item["variant_id"], product=product, is_active=True
                ).first()
                if not variant:
                    raise serializers.ValidationError(f"تنوع انتخاب‌شده برای «{product.name}» معتبر نیست.")
                if variant.stock < qty:
                    raise serializers.ValidationError(f"موجودی تنوع «{variant.name}» کافی نیست.")
                unit_price = variant.price
            else:
                reserved_by_others = InventoryReservation.objects.filter(
                    product=product, is_active=True,
                    expires_at__gt=timezone.now(),
                ).exclude(user=user).aggregate(value=models.Sum("quantity"))["value"] or 0
                if product.stock - reserved_by_others < qty:
                    raise serializers.ValidationError(
                        f"موجودی قابل سفارش «{product.name}» کافی نیست."
                    )
            option_ids = list(dict.fromkeys(item.get("customization_option_ids", [])))
            selected_options = list(
                CustomizationOption.objects.select_for_update()
                .select_related("group", "group__category")
                .filter(id__in=option_ids, is_active=True, group__is_active=True)
            )
            if len(selected_options) != len(option_ids):
                raise serializers.ValidationError(
                    f"یک یا چند گزینه شخصی‌سازی «{product.name}» معتبر نیست."
                )
            selected_group_ids = set()
            for option in selected_options:
                group = option.group
                if group.id in selected_group_ids or not group.applies_to(product):
                    raise serializers.ValidationError(
                        f"ترکیب انتخاب‌شده برای «{product.name}» معتبر نیست."
                    )
                if option.stock is not None and option.stock < qty:
                    raise serializers.ValidationError(
                        f"موجودی گزینه «{option.name}» کافی نیست."
                    )
                selected_group_ids.add(group.id)
                customization_price += option.price_delta
                customization_snapshot.append({
                    "group_id": str(group.id), "group": group.name,
                    "option_id": str(option.id), "option": option.name,
                    "value": option.value, "price_delta": option.price_delta,
                    "specifications": option.specifications,
                })
            catalog = "GAMING" if product.is_gaming else "NORMAL"
            required_groups = product.category.customization_groups.filter(
                is_active=True, is_required=True, catalog__in=("BOTH", catalog)
            ).prefetch_related("products")
            missing = [
                group.name for group in required_groups
                if group.applies_to(product) and group.id not in selected_group_ids
            ]
            if missing:
                raise serializers.ValidationError(
                    {"items": f"برای «{product.name}» گزینه‌های {', '.join(missing)} را انتخاب کنید."}
                )
            unit_price += customization_price
            sale = FlashSale.objects.select_for_update().filter(
                product=product, is_active=True, starts_at__lte=timezone.now(),
                ends_at__gte=timezone.now(),
            ).first()
            if sale and variant:
                unit_price = round(variant.price * (100 - sale.discount_percent) / 100) + customization_price
            if sale and sale.stock_limit and sale.sold_count + qty > sale.stock_limit:
                raise serializers.ValidationError(f"ظرفیت فروش ویژه «{product.name}» تمام شده است.")
            line_total = unit_price * qty
            subtotal += line_total
            lines.append((product, variant, sale, qty, unit_price, line_total, customization_snapshot, customization_price))
        shipping = 0 if subtotal >= 50_000_000 else 290_000
        shipping_method = "NORMAL"
        delivery_slot = None
        from apps.operations.models import DeliverySlot, ShippingRule
        if data.get("shipping_rule_id"):
            weight = sum(product.weight_grams * qty for product, _v, _s, qty, _p, _t, _c, _cp in lines)
            rule = ShippingRule.objects.filter(
                id=data["shipping_rule_id"], is_active=True
            ).first()
            if not rule:
                raise serializers.ValidationError({"shipping_rule_id": "روش ارسال معتبر نیست."})
            if rule.provinces and address.province not in rule.provinces:
                raise serializers.ValidationError({"shipping_rule_id": "این روش برای استان انتخابی فعال نیست."})
            shipping = rule.base_cost + ((weight + 999) // 1000) * rule.cost_per_kg
            if rule.free_above and subtotal >= rule.free_above:
                shipping = 0
            shipping_method = rule.method
        if data.get("delivery_slot_id"):
            delivery_slot = DeliverySlot.objects.select_for_update().filter(
                id=data["delivery_slot_id"], is_active=True,
                reserved_count__lt=models.F("capacity"),
            ).first()
            if not delivery_slot:
                raise serializers.ValidationError({"delivery_slot_id": "بازه تحویل ظرفیت ندارد."})
            delivery_slot.reserved_count += 1
            delivery_slot.save(update_fields=("reserved_count", "updated_at"))
        discount = 0
        discount_item = None
        code = data.get("discount_code", "").strip().upper()
        from apps.operations.models import PromotionRule
        now = timezone.now()
        promotions = PromotionRule.objects.filter(is_active=True).filter(
            models.Q(starts_at__isnull=True) | models.Q(starts_at__lte=now),
            models.Q(ends_at__isnull=True) | models.Q(ends_at__gte=now),
        )
        for promotion in promotions:
            eligible = True
            if promotion.kind == PromotionRule.Kind.FIRST_BUY:
                eligible = not Order.objects.filter(user=user, status__in=(
                    Order.Status.PAID, Order.Status.PROCESSING, Order.Status.SENT,
                    Order.Status.DELIVERED,
                )).exists()
            elif promotion.kind == PromotionRule.Kind.CATEGORY:
                eligible = any(
                    str(line[0].category_id) in promotion.conditions.get("category_ids", [])
                    for line in lines
                )
            elif promotion.kind == PromotionRule.Kind.BRAND:
                eligible = any(
                    str(line[0].brand_id) in promotion.conditions.get("brand_ids", [])
                    for line in lines
                )
            elif promotion.kind == PromotionRule.Kind.BUY_X_GET_Y:
                promotion_product_ids = {
                    str(value) for value in promotion.conditions.get("product_ids", [])
                }
                eligible = any(
                    not promotion_product_ids or str(line[0].id) in promotion_product_ids
                    for line in lines
                )
            if not eligible:
                continue
            if promotion.kind == PromotionRule.Kind.FREE_SHIPPING:
                shipping = 0
            elif promotion.kind == PromotionRule.Kind.BUY_X_GET_Y:
                buy_quantity = max(
                    1, int(promotion.conditions.get("buy_quantity", 1))
                )
                free_quantity = max(
                    1, int(promotion.conditions.get("free_quantity", 1))
                )
                group_size = buy_quantity + free_quantity
                promotion_product_ids = {
                    str(value) for value in promotion.conditions.get("product_ids", [])
                }
                candidate = sum(
                    (quantity // group_size) * free_quantity * unit_price
                    for product, _variant, _sale, quantity, unit_price, _line_total, _custom, _custom_price in lines
                    if not promotion_product_ids or str(product.id) in promotion_product_ids
                )
                discount = max(discount, min(subtotal, candidate))
            else:
                candidate = max(
                    round(subtotal * promotion.percent / 100),
                    promotion.fixed_amount,
                )
                discount = max(discount, min(subtotal, candidate))
        if code:
            discount_item = DiscountCode.objects.select_for_update().filter(code__iexact=code, is_active=True).first()
            if not discount_item:
                raise serializers.ValidationError({"discount_code": "کد تخفیف نامعتبر است."})
            if discount_item.starts_at and discount_item.starts_at > now:
                raise serializers.ValidationError({"discount_code": "زمان استفاده از این کد هنوز شروع نشده است."})
            if discount_item.expires_at and discount_item.expires_at < now:
                raise serializers.ValidationError({"discount_code": "کد تخفیف منقضی شده است."})
            if discount_item.usage_limit and discount_item.used_count >= discount_item.usage_limit:
                raise serializers.ValidationError({"discount_code": "ظرفیت استفاده از کد تمام شده است."})
            if subtotal < discount_item.min_purchase:
                raise serializers.ValidationError({"discount_code": "مبلغ سفارش کمتر از حداقل خرید این کد است."})
            discount = max(discount, min(
                subtotal,
                max(round(subtotal * discount_item.percent / 100), discount_item.fixed_amount),
            ))
        order = Order.objects.create(
            user=user,
            address_snapshot={
                "title": address.title, "recipient_name": address.recipient_name,
                "recipient_phone": address.recipient_phone, "province": address.province,
                "city": address.city, "postal_code": address.postal_code, "address": address.address,
            },
            subtotal=subtotal, shipping_cost=shipping, discount_amount=discount,
            discount_code=code, total=subtotal + shipping - discount,
            idempotency_key=idempotency_key,
            expires_at=timezone.now() + timedelta(minutes=15),
            shipping_method=shipping_method, delivery_slot=delivery_slot,
            note=data.get("note", ""),
        )
        OrderStatusHistory.objects.create(
            order=order, to_status=Order.Status.PENDING, note="سفارش ثبت شد",
            changed_by=user,
        )
        for product, variant, sale, qty, unit_price, line_total, custom, custom_price in lines:
            OrderItem.objects.create(
                order=order, product=product, product_name=product.name,
                unit_price=unit_price, quantity=qty, line_total=line_total,
                variant_name=variant.name if variant else "",
                variant_sku=variant.sku if variant else "",
                customization_snapshot=custom,
                customization_price=custom_price,
            )
        if discount_item:
            discount_item.used_count += 1
            discount_item.save(update_fields=["used_count", "updated_at"])
        from apps.operations.models import AbandonedCart
        InventoryReservation.objects.filter(
            user=user, product_id__in=product_ids, is_active=True
        ).update(is_active=False)
        for _product, variant, _sale, qty, _unit_price, _line_total, _custom, _custom_price in lines:
            if not variant:
                InventoryReservation.objects.create(
                    user=user, product=_product, quantity=qty,
                    expires_at=timezone.now() + timedelta(minutes=15),
                    converted_order=order, is_active=True,
                )
        AbandonedCart.objects.filter(user=user).update(
            items=[], total=0, recovered_at=timezone.now()
        )
        return order

