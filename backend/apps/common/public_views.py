from django.conf import settings
import json
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.cache import cache_page
from django.db import connection
from django.core.cache import cache
from xml.sax.saxutils import escape
from apps.catalog.models import BuyingGuide, Category, SiteSetting
from apps.products.models import Product
from .models import WebVitalEvent


def robots(request):
    base = getattr(
        settings, "PUBLIC_SITE_URL", request.build_absolute_uri("/")
    ).rstrip("/")
    return HttpResponse(
        "User-agent: *\n"
        "Allow: /\n"
        "Disallow: /admin\n"
        "Disallow: /account\n"
        "Disallow: /auth\n"
        "Disallow: /api/\n"
        f"Sitemap: {base}/sitemap-index.xml\n",
        content_type="text/plain",
        headers={"Cache-Control": "public, max-age=3600"},
    )


def _urlset(rows, image_namespace=False):
    image = ' xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"' if image_namespace else ""
    return '<?xml version="1.0" encoding="UTF-8"?>' + f'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"{image}>' + "".join(rows) + "</urlset>"


@cache_page(900)
def sitemap_index(request):
    base = getattr(settings, "PUBLIC_SITE_URL", request.build_absolute_uri("/")).rstrip("/")
    names = ("pages", "categories", "products", "guides")
    xml = '<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "".join(
        f"<sitemap><loc>{escape(base)}/sitemap-{name}.xml</loc></sitemap>" for name in names
    ) + "</sitemapindex>"
    return HttpResponse(xml, content_type="application/xml", headers={"Cache-Control": "public, max-age=900"})


@cache_page(900)
def sitemap_pages(request):
    base = getattr(settings, "PUBLIC_SITE_URL", request.build_absolute_uri("/")).rstrip("/")
    paths = (("", "daily", "1.0"), ("/shop", "daily", "0.9"), ("/gaming", "daily", "0.8"), ("/guides", "weekly", "0.7"), ("/about", "monthly", "0.6"), ("/contact", "monthly", "0.6"), ("/faq", "monthly", "0.6"), ("/returns", "monthly", "0.6"))
    return HttpResponse(_urlset([f"<url><loc>{escape(base + path)}</loc><changefreq>{freq}</changefreq><priority>{priority}</priority></url>" for path, freq, priority in paths]), content_type="application/xml")


@cache_page(900)
def sitemap_categories(request):
    base = getattr(settings, "PUBLIC_SITE_URL", request.build_absolute_uri("/")).rstrip("/")
    rows = []
    for item in Category.objects.filter(is_active=True).only("slug", "updated_at").iterator(chunk_size=500):
        for prefix in ("shop", "gaming"):
            rows.append(f"<url><loc>{escape(f'{base}/{prefix}/{item.slug}')}</loc><lastmod>{item.updated_at.date()}</lastmod><changefreq>weekly</changefreq><priority>0.7</priority></url>")
    return HttpResponse(_urlset(rows), content_type="application/xml")


@cache_page(900)
def sitemap_products(request):
    base = getattr(
        settings, "PUBLIC_SITE_URL", request.build_absolute_uri("/")
    ).rstrip("/")
    product_urls = []
    for item in Product.objects.filter(is_active=True).only(
        "slug", "updated_at", "image", "canonical_url"
    ).iterator(chunk_size=500):
        image = ""
        if item.image:
            image_url = item.image.url
            if image_url.startswith("/"):
                image_url = f"{base}{image_url}"
            image = f"<image:image><image:loc>{escape(image_url)}</image:loc></image:image>"
        product_urls.append(
            f"<url><loc>{escape(item.canonical_url or f'{base}/product/{item.slug}')}</loc>"
            f"<lastmod>{item.updated_at.date()}</lastmod>"
            f"<changefreq>daily</changefreq><priority>0.8</priority>{image}</url>"
        )
    xml = _urlset(product_urls, image_namespace=True)
    return HttpResponse(
        xml,
        content_type="application/xml",
        headers={"Cache-Control": "public, max-age=900"},
    )


@cache_page(900)
def sitemap_guides(request):
    base = getattr(settings, "PUBLIC_SITE_URL", request.build_absolute_uri("/")).rstrip("/")
    rows = [f"<url><loc>{escape(f'{base}/guides/{item.slug}')}</loc><lastmod>{item.updated_at.date()}</lastmod><changefreq>monthly</changefreq><priority>0.6</priority></url>" for item in BuyingGuide.objects.filter(is_published=True).only("slug", "updated_at")]
    return HttpResponse(_urlset(rows), content_type="application/xml")


def sitemap(request):
    """Backward-compatible combined sitemap for older crawler registrations."""
    base = getattr(settings, "PUBLIC_SITE_URL", request.build_absolute_uri("/")).rstrip("/")
    rows = [
        f"<url><loc>{escape(base + path)}</loc><changefreq>{freq}</changefreq><priority>{priority}</priority></url>"
        for path, freq, priority in (
            ("", "daily", "1.0"), ("/shop", "daily", "0.9"),
            ("/gaming", "daily", "0.8"), ("/about", "monthly", "0.6"),
            ("/contact", "monthly", "0.6"), ("/faq", "monthly", "0.6"),
            ("/returns", "monthly", "0.6"), ("/guides", "weekly", "0.7"),
        )
    ]
    for item in Category.objects.filter(is_active=True).only("slug", "updated_at"):
        rows.append(f"<url><loc>{escape(f'{base}/shop/{item.slug}')}</loc><lastmod>{item.updated_at.date()}</lastmod><priority>0.7</priority></url>")
    for item in Product.objects.filter(is_active=True).only("slug", "updated_at", "canonical_url"):
        rows.append(f"<url><loc>{escape(item.canonical_url or f'{base}/product/{item.slug}')}</loc><lastmod>{item.updated_at.date()}</lastmod><priority>0.8</priority></url>")
    return HttpResponse(_urlset(rows), content_type="application/xml", headers={"Cache-Control": "public, max-age=900"})


@cache_page(900)
def merchant_feed(request):
    base = getattr(settings, "PUBLIC_SITE_URL", request.build_absolute_uri("/")).rstrip("/")
    items = []
    for product in Product.objects.filter(is_active=True).select_related("brand", "category").iterator(chunk_size=300):
        image = product.image.url if product.image else ""
        if image.startswith("/"):
            image = base + image
        availability = "in_stock" if product.stock > 0 else "out_of_stock"
        items.append(
            "<item>" + f"<g:id>{escape(product.sku)}</g:id><title>{escape(product.name)}</title>"
            f"<description>{escape(product.seo_description or product.short_description or product.name)}</description>"
            f"<link>{escape(base + '/product/' + product.slug)}</link><g:image_link>{escape(image)}</g:image_link>"
            f"<g:availability>{availability}</g:availability><g:condition>new</g:condition>"
            f"<g:price>{product.final_price * 10} IRR</g:price><g:brand>{escape(product.brand.name if product.brand else '')}</g:brand>"
            f"<g:mpn>{escape(product.mpn or product.sku)}</g:mpn>"
            + (f"<g:gtin>{escape(product.gtin)}</g:gtin>" if product.gtin else "") + "</item>"
        )
    xml = '<?xml version="1.0" encoding="UTF-8"?><rss xmlns:g="http://base.google.com/ns/1.0" version="2.0"><channel><title>Shop82 Products</title><link>' + escape(base) + "</link>" + "".join(items) + "</channel></rss>"
    return HttpResponse(xml, content_type="application/xml", headers={"Cache-Control": "public, max-age=900"})


@csrf_exempt
def collect_web_vital(request):
    if request.method != "POST":
        return JsonResponse({"detail": "Method not allowed"}, status=405)
    try:
        data = json.loads(request.body or "{}")
        metric = str(data.get("metric", ""))[:20]
        value = float(data.get("value", 0))
        if metric not in {"LCP", "INP", "CLS", "FCP", "TTFB"} or value < 0:
            raise ValueError
        WebVitalEvent.objects.create(metric=metric, value=value, rating=str(data.get("rating", ""))[:20], path=str(data.get("path", "/"))[:500], navigation_type=str(data.get("navigationType", ""))[:30], user_agent=request.META.get("HTTP_USER_AGENT", "")[:300])
        return JsonResponse({"accepted": True}, status=202)
    except (ValueError, TypeError, json.JSONDecodeError):
        return JsonResponse({"detail": "Invalid metric"}, status=400)


def public_health(request):
    checks = {"database": False, "cache": False}
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            checks["database"] = cursor.fetchone()[0] == 1
    except Exception:
        pass
    try:
        cache.set("health-check", "ok", 10)
        checks["cache"] = cache.get("health-check") == "ok"
    except Exception:
        pass
    healthy = all(checks.values())
    return JsonResponse(
        {"status": "ok" if healthy else "degraded", "service": "shop82-api", "checks": checks},
        status=200 if healthy else 503,
    )
