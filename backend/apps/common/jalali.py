import jdatetime
from django.utils import timezone


def format_jalali(value, include_time=False):
    """تبدیل امن datetime دیتابیس به تاریخ نمایشی شمسی."""
    if not value:
        return ""
    if timezone.is_aware(value):
        value = timezone.localtime(value)
    converted = jdatetime.datetime.fromgregorian(datetime=value)
    pattern = "%Y/%m/%d - %H:%M" if include_time else "%Y/%m/%d"
    return converted.strftime(pattern)
