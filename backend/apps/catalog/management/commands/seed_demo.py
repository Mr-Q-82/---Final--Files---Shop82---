from django.core.management.base import BaseCommand
from django.utils.text import slugify
from apps.catalog.models import Brand, Category
from apps.products.models import Product

class Command(BaseCommand):
    help = "Create demo catalog data matching the storefront."

    def handle(self, *args, **options):
        catalog = {
            "لپ‌تاپ": [("لپ‌تاپ گیمینگ ROG Strix G16", "ASUS", 86_900_000, 8)],
            "کارت گرافیک": [("کارت گرافیک RTX 4070 Ti", "NVIDIA", 57_800_000, 4)],
            "مانیتور": [("مانیتور گیمینگ ۲۷ اینچ 165Hz", "Samsung", 18_900_000, 12)],
            "پردازنده": [("پردازنده Ryzen 7 7800X3D", "AMD", 29_300_000, 6)],
            "لوازم جانبی": [
                ("کیبورد مکانیکال RGB", "Razer", 6_490_000, 18),
                ("هدفون گیمینگ HyperX Cloud", "HyperX", 9_150_000, 15),
            ],
            "حافظه": [("SSD سامسونگ 980 Pro یک ترابایت", "Samsung", 7_950_000, 22)],
        }
        index = 1
        for order, (category_name, rows) in enumerate(catalog.items()):
            category, _ = Category.objects.get_or_create(
                slug=slugify(category_name, allow_unicode=True),
                defaults={"name": category_name, "sort_order": order},
            )
            for name, brand_name, price, stock in rows:
                brand, _ = Brand.objects.get_or_create(
                    slug=slugify(brand_name),
                    defaults={"name": brand_name},
                )
                Product.objects.get_or_create(
                    sku=f"TS-{index:04}",
                    defaults={
                        "name": name,
                        "slug": f"product-{index}",
                        "category": category,
                        "brand": brand,
                        "price": price,
                        "stock": stock,
                        "is_active": True,
                        "is_featured": index <= 4,
                    },
                )
                index += 1
        self.stdout.write(self.style.SUCCESS("Demo catalog created."))
