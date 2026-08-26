from io import BytesIO
from pathlib import Path
import arabic_reshaper
from bidi.algorithm import get_display
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from apps.common.jalali import format_jalali


def rtl(value):
    return get_display(arabic_reshaper.reshape(str(value)))


def build_invoice_pdf(order):
    output = BytesIO()
    font_name = "Helvetica"
    candidates = (
        Path("C:/Windows/Fonts/arial.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    )
    font_path = next((item for item in candidates if item.exists()), None)
    if font_path:
        font_name = "InvoicePersian"
        if font_name not in pdfmetrics.getRegisteredFontNames():
            pdfmetrics.registerFont(TTFont(font_name, str(font_path)))
    doc = canvas.Canvas(output, pagesize=A4)
    width, height = A4
    doc.setTitle(f"Invoice {order.number}")
    doc.setFont(font_name, 18)
    doc.drawRightString(width - 45, height - 55, rtl("فاکتور فروش فروشگاه 82"))
    doc.setFont(font_name, 10)
    doc.drawRightString(width - 45, height - 82, rtl(f"شماره سفارش: {order.number}"))
    doc.drawRightString(width - 45, height - 100, rtl(f"تاریخ: {format_jalali(order.created_at, True)}"))
    y = height - 135
    for item in order.items.all():
        text = f"{item.product_name}  × {item.quantity}   {item.line_total:,} تومان"
        doc.drawRightString(width - 45, y, rtl(text))
        y -= 24
        if y < 90:
            doc.showPage()
            doc.setFont(font_name, 10)
            y = height - 55
    doc.line(45, y - 5, width - 45, y - 5)
    doc.setFont(font_name, 12)
    doc.drawRightString(width - 45, y - 30, rtl(f"مبلغ نهایی: {order.total:,} تومان"))
    doc.save()
    output.seek(0)
    return output
