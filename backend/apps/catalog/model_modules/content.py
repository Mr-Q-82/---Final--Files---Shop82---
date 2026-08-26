from ._shared import *

class Category(TimeStampedModel):
    name = models.CharField(max_length=120)
    slug = models.SlugField(max_length=140, unique=True, allow_unicode=True)
    icon = models.CharField(max_length=40, blank=True)
    image = models.ImageField(upload_to="categories/", blank=True)
    gaming_image = models.ImageField(upload_to="categories/gaming/", blank=True)
    subcategories = models.JSONField(default=list, blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)
    seo_title = models.CharField(max_length=180, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    intro_text = models.TextField(blank=True)
    buying_guide = models.TextField(blank=True)
    faq_items = models.JSONField(default=list, blank=True)
    class Meta:
        ordering = ("sort_order", "name")
        verbose_name_plural = "Categories"
    def __str__(self):
        return self.name

class Brand(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    logo = models.ImageField(upload_to="brands/", blank=True)
    is_active = models.BooleanField(default=True)
    seo_title = models.CharField(max_length=180, blank=True)
    seo_description = models.CharField(max_length=320, blank=True)
    def __str__(self):
        return self.name


class SiteSetting(TimeStampedModel):
    site_name = models.CharField(max_length=120, default="فروشگاه 82")
    logo = models.ImageField(upload_to="site/", blank=True)
    seo_home_title = models.CharField(
        max_length=180,
        default="فروشگاه 82 | فروشگاه تخصصی کالای دیجیتال",
    )
    seo_home_description = models.CharField(
        max_length=320,
        default="خرید اینترنتی کالای دیجیتال، لپ‌تاپ و قطعات کامپیوتر با ضمانت و ارسال سریع.",
    )
    seo_social_image = models.ImageField(upload_to="site/seo/", blank=True)
    google_site_verification = models.CharField(max_length=180, blank=True)
    bing_site_verification = models.CharField(max_length=180, blank=True)
    organization_phone = models.CharField(max_length=30, blank=True)
    organization_email = models.EmailField(blank=True)
    organization_address = models.CharField(max_length=300, blank=True)
    organization_social_links = models.JSONField(default=list, blank=True)
    merchant_name = models.CharField(max_length=160, blank=True)
    shipping_cost = models.PositiveBigIntegerField(default=0)
    shipping_min_days = models.PositiveSmallIntegerField(default=1)
    shipping_max_days = models.PositiveSmallIntegerField(default=5)
    return_window_days = models.PositiveSmallIntegerField(default=7)
    footer_text = models.CharField(
        max_length=300,
        default="© ۱۴۰۵ فروشگاه 82 · تمامی حقوق محفوظ است · طراحی و توسعه اختصاصی",
    )
    mega_promo_title = models.CharField(
        max_length=180, default="پیشنهاد ویژه هفته"
    )
    mega_promo_subtitle = models.CharField(
        max_length=320, default="تا ۳۵٪ تخفیف روی کارت‌های گرافیک گیمینگ"
    )
    mega_promo_image = models.ImageField(upload_to="site/mega-menu/", blank=True)
    category_title = models.CharField(
        max_length=180, default="دسته‌بندی محصولات"
    )
    category_subtitle = models.CharField(
        max_length=320, default="دسته مورد نظر خود را انتخاب کنید"
    )
    hero_slogan = models.CharField(
        max_length=240,
        default="هوشمند انتخاب کن؛ قدرتمندتر زندگی کن",
    )
    hero_laptop_image = models.ImageField(
        upload_to="site/hero-paths/", blank=True
    )
    hero_components_image = models.ImageField(
        upload_to="site/hero-paths/", blank=True
    )
    hero_gaming_image = models.ImageField(
        upload_to="site/hero-paths/", blank=True
    )
    hero_monitor_image = models.ImageField(
        upload_to="site/hero-paths/", blank=True
    )
    hero_audio_image = models.ImageField(
        upload_to="site/hero-paths/", blank=True
    )
    home_hero_enabled = models.BooleanField(default=True)
    home_hero_autoplay = models.BooleanField(default=True)
    home_hero_interval_seconds = models.PositiveSmallIntegerField(default=6)
    home_hero_controls = models.BooleanField(default=True)
    home_quick_links_enabled = models.BooleanField(default=True)
    home_banners_enabled = models.BooleanField(default=True)
    home_categories_enabled = models.BooleanField(default=True)
    home_brands_enabled = models.BooleanField(default=True)
    home_recommendations_enabled = models.BooleanField(default=True)
    home_recommendations_title = models.CharField(max_length=160, default="👀 بازدیدهای اخیر و محصولات مشابه")
    home_services_enabled = models.BooleanField(default=True)
    home_laptop_title = models.CharField(max_length=80, default="لپ‌تاپ‌ها")
    home_laptop_subtitle = models.CharField(max_length=140, default="کار، دانشگاه و بازی")
    home_components_title = models.CharField(max_length=80, default="قطعات حرفه‌ای")
    home_components_subtitle = models.CharField(max_length=140, default="ارتقای سیستم هوشمند")
    home_gaming_title = models.CharField(max_length=80, default="دنیای گیمینگ")
    home_gaming_subtitle = models.CharField(max_length=140, default="تجهیزات منتخب گیمرها")
    home_monitor_title = models.CharField(max_length=80, default="مانیتورها")
    home_monitor_subtitle = models.CharField(max_length=140, default="تصویر دقیق و حرفه‌ای")
    home_audio_title = models.CharField(max_length=80, default="هدفون و صدا")
    home_audio_subtitle = models.CharField(max_length=140, default="تجربه صوتی فراگیر")
    gaming_hero_enabled = models.BooleanField(default=True)
    gaming_hero_autoplay = models.BooleanField(default=True)
    gaming_hero_interval_seconds = models.PositiveSmallIntegerField(default=5)
    gaming_hero_controls = models.BooleanField(default=True)
    gaming_heading_enabled = models.BooleanField(default=True)
    gaming_heading_kicker = models.CharField(max_length=80, default="🎮 GAMING ZONE")
    gaming_heading_title = models.CharField(max_length=160, default="دنیای محصولات گیمینگ")
    gaming_heading_subtitle = models.CharField(
        max_length=320,
        default="تجهیزات منتخب برای گیمرهایی که سرعت، دقت و قدرت واقعی می‌خواهند.",
    )
    gaming_banners_enabled = models.BooleanField(default=True)
    gaming_categories_enabled = models.BooleanField(default=True)
    gaming_brands_enabled = models.BooleanField(default=True)
    gaming_deals_enabled = models.BooleanField(default=True)
    gaming_deals_title = models.CharField(max_length=160, default="پیشنهادهای ویژه گیمینگ")
    gaming_top_rated_enabled = models.BooleanField(default=True)
    gaming_top_rated_title = models.CharField(max_length=160, default="💎 پیشنهادهای منتخب گیمینگ")
    gaming_value_enabled = models.BooleanField(default=True)
    gaming_value_title = models.CharField(max_length=160, default="⚡ پیشنهادهای ویژه تجهیزات گیمینگ")
    gaming_best_sellers_enabled = models.BooleanField(default=True)
    gaming_best_sellers_title = models.CharField(max_length=160, default="🔥 محبوب‌ترین محصولات گیمینگ")
    gaming_newest_enabled = models.BooleanField(default=True)
    gaming_newest_title = models.CharField(max_length=160, default="⚡ جدیدترین تجهیزات گیمینگ")
    gaming_catalog_enabled = models.BooleanField(default=True)
    gaming_catalog_title = models.CharField(max_length=160, default="فروشگاه محصولات گیمینگ")
    guides_enabled = models.BooleanField(default=True)
    guides_eyebrow = models.CharField(max_length=120, default="مرکز دانش فروشگاه ۸۲")
    guides_title = models.CharField(max_length=180, default="راهنمای جامع و تخصصی خرید")
    guides_description = models.CharField(max_length=500, default="از انتخاب دسته‌بندی تا مقایسه مدل‌ها، بررسی سازگاری و تصمیم نهایی؛ همه اطلاعات در یک مسیر ساده قرار گرفته است.")
    guides_search_placeholder = models.CharField(max_length=180, default="جست‌وجوی دسته یا موضوع...")
    guides_header_button_title = models.CharField(max_length=80, default="راهنمای خرید")
    guides_header_button_subtitle = models.CharField(max_length=100, default="انتخاب حرفه‌ای")
    guides_show_product_tabs = models.BooleanField(default=True)
    guides_show_mistakes = models.BooleanField(default=True)
    guides_show_faq = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)


class NewsletterSubscriber(TimeStampedModel):
    email = models.EmailField(unique=True)
    is_active = models.BooleanField(default=True)
    class Meta:
        ordering = ("-created_at",)


class NewsletterCampaign(TimeStampedModel):
    title = models.CharField(max_length=180)
    message = models.TextField()
    sent_at = models.DateTimeField(null=True, blank=True)
    sent_count = models.PositiveIntegerField(default=0)
    class Meta:
        ordering = ("-created_at",)


class HeroSlide(TimeStampedModel):
    class Placement(models.TextChoices):
        HOME = "HOME", "صفحه اصلی"
        GAMING = "GAMING", "صفحه گیمینگ"

    class MetricType(models.TextChoices):
        PRODUCTS = "PRODUCTS", "تعداد محصولات موجود"
        CUSTOMERS = "CUSTOMERS", "تعداد مشتریان"
        CUSTOM = "CUSTOM", "مقدار دلخواه"

    title = models.CharField(max_length=160)
    subtitle = models.CharField(max_length=260, blank=True)
    metric_type = models.CharField(
        max_length=20, choices=MetricType.choices, default=MetricType.CUSTOM
    )
    custom_value = models.CharField(max_length=80, blank=True)
    image = models.ImageField(upload_to="hero/slides/", blank=True)
    product = models.ForeignKey(
        "Product",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="hero_slides",
    )
    icon_name = models.CharField(max_length=40, default="gpu", blank=True)
    target = models.CharField(max_length=250, blank=True)
    placement = models.CharField(
        max_length=16, choices=Placement.choices, default=Placement.HOME
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    class Meta:
        ordering = ("sort_order", "created_at")


class PromoBanner(TimeStampedModel):
    """Uploadable promotional banners shown in pairs on the home page."""

    class Placement(models.TextChoices):
        HOME = "HOME", "صفحه اصلی"
        GAMING = "GAMING", "صفحه گیمینگ"

    title = models.CharField(max_length=160, blank=True)
    subtitle = models.CharField(max_length=260, blank=True)
    image = models.ImageField(upload_to="home/banners/")
    target = models.CharField(max_length=250, blank=True)
    placement = models.CharField(
        max_length=16, choices=Placement.choices, default=Placement.HOME
    )
    sort_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ("sort_order", "created_at")
