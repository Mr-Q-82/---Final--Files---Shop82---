import apps.catalog.models
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0029_product_questions_conversation")]

    operations = [
        migrations.AlterField(
            model_name="product",
            name="image",
            field=models.ImageField(
                blank=True,
                upload_to=apps.catalog.models.product_main_image_upload_to,
            ),
        ),
        migrations.AlterField(
            model_name="productimage",
            name="image",
            field=models.ImageField(
                upload_to=apps.catalog.models.product_gallery_image_upload_to,
            ),
        ),
    ]
