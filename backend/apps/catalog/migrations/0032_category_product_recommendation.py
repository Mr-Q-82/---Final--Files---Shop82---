from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [("catalog", "0031_repair_seeded_gaming_flags")]

    operations = [
        migrations.CreateModel(
            name="CategoryProductRecommendation",
            fields=[
                ("id", models.BigAutoField(primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(default=True)),
                (
                    "category",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="product_recommendations",
                        to="catalog.category",
                    ),
                ),
                (
                    "product",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="category_recommendations",
                        to="catalog.product",
                    ),
                ),
            ],
            options={"ordering": ("category_id", "sort_order", "id")},
        ),
        migrations.AddConstraint(
            model_name="categoryproductrecommendation",
            constraint=models.UniqueConstraint(
                fields=("category", "product"),
                name="unique_category_product_recommendation",
            ),
        ),
        migrations.AddIndex(
            model_name="categoryproductrecommendation",
            index=models.Index(
                fields=["category", "is_active", "sort_order"],
                name="category_recommendation_idx",
            ),
        ),
    ]
