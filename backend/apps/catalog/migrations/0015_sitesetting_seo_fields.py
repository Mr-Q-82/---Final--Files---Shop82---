from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("catalog", "0014_performance_indexes")]

    operations = [
        migrations.AddField(
            model_name="sitesetting",
            name="google_site_verification",
            field=models.CharField(blank=True, max_length=180),
        ),
        migrations.AddField(
            model_name="sitesetting",
            name="seo_home_description",
            field=models.CharField(
                default=(
                    "خرید اینترنتی کالای دیجیتال، لپ‌تاپ و قطعات کامپیوتر "
                    "با ضمانت و ارسال سریع."
                ),
                max_length=320,
            ),
        ),
        migrations.AddField(
            model_name="sitesetting",
            name="seo_home_title",
            field=models.CharField(
                default="تک‌استور | فروشگاه تخصصی کالای دیجیتال",
                max_length=180,
            ),
        ),
        migrations.AddField(
            model_name="sitesetting",
            name="seo_social_image",
            field=models.ImageField(blank=True, upload_to="site/seo/"),
        ),
    ]
