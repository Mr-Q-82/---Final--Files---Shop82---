from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_user_email_verified_emailverification"),
    ]

    operations = [
        migrations.AlterField(
            model_name="otp",
            name="purpose",
            field=models.CharField(
                choices=[
                    ("REGISTER", "ثبت‌نام"),
                    ("LOGIN", "ورود"),
                    ("RESET_PASSWORD", "بازیابی رمز عبور"),
                ],
                max_length=20,
            ),
        ),
    ]
