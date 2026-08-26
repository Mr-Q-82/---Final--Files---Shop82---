import apps.common.uploads
from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("orders", "0012_professional_order_constraints")]
    operations = [
        migrations.AlterField(
            model_name="returnrequest", name="image",
            field=models.ImageField(blank=True, upload_to="returns/%Y/%m/", validators=[apps.common.uploads.validate_image_upload]),
        )
    ]
