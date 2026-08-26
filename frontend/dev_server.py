import html
import json
import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urljoin
from urllib.request import urlopen


ROOT = Path(__file__).resolve().parent
SEO_API_BASE = os.getenv("SEO_API_BASE", "http://127.0.0.1:8000/api/v1").rstrip("/")
SEO_SITE_URL = os.getenv("SEO_SITE_URL", "").rstrip("/")


class SpaHandler(SimpleHTTPRequestHandler):
    """Static development server with index.html fallback for clean SPA URLs."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        request_path = self.path.split("?", 1)[0]
        # Bundle URLs carry a version query string. They are safe to keep in the
        # browser cache; a new build changes the version and invalidates them.
        if request_path.startswith(("/dist/", "/public/")):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        elif request_path.endswith(".html") or request_path == "/service-worker.js":
            self.send_header("Cache-Control", "no-cache, max-age=0")
            self.send_header("Pragma", "no-cache")
        super().end_headers()

    def _api_json(self, path):
        # Metadata enrichment must never delay delivery of the SPA shell.
        with urlopen(f"{SEO_API_BASE}{path}", timeout=0.8) as response:
            return json.loads(response.read().decode("utf-8"))

    def _serve_spa(self, path):
        document = (ROOT / "html" / "index.html").read_text(encoding="utf-8")
        origin = SEO_SITE_URL or f"http://{self.headers.get('Host', '127.0.0.1:5500')}"
        canonical = f"{origin}{path}"
        title = "فروشگاه 82 | فروشگاه تخصصی کالای دیجیتال"
        description = (
            "خرید اینترنتی کالای دیجیتال، لپ‌تاپ و قطعات کامپیوتر "
            "با ضمانت و ارسال سریع."
        )
        image = ""
        schema = None
        response_status = 200
        static_pages = {
            "/shop": (
                "فروشگاه محصولات دیجیتال | فروشگاه 82",
                "خرید محصولات دیجیتال، لپ‌تاپ و قطعات کامپیوتر با ضمانت و ارسال سریع.",
            ),
            "/about": (
                "درباره ما | فروشگاه 82",
                "با فروشگاه 82، خدمات فروشگاه و ارزش‌های ما بیشتر آشنا شوید.",
            ),
            "/contact": (
                "تماس با ما | فروشگاه 82",
                "راه ارتباط با پشتیبانی فروشگاه 82 و ثبت درخواست مشتریان.",
            ),
            "/faq": (
                "سؤالات متداول | فروشگاه 82",
                "پاسخ پرسش‌های رایج درباره خرید، ارسال، گارانتی و مرجوعی کالا.",
            ),
            "/returns": (
                "شرایط بازگشت کالا | فروشگاه 82",
                "شرایط و مراحل ثبت و پیگیری درخواست بازگشت کالا در فروشگاه 82.",
            ),
            "/gaming": (
                "محصولات گیمینگ | فروشگاه 82",
                "خرید محصولات، قطعات و تجهیزات منتخب گیمینگ از فروشگاه 82.",
            ),
        }
        if path in static_pages:
            title, description = static_pages[path]
        indexable = path in {"/", "/shop", *static_pages}
        # Public shells are served immediately. Backend metadata is fetched
        # only for detail URLs where server-rendered SEO data is valuable.
        try:
            if not (
                path.startswith("/product/")
                or path.startswith("/shop/")
                or path.startswith("/gaming/")
            ):
                raise LookupError
            settings_data = self._api_json("/catalog/site-settings/")
            site = (settings_data.get("results") or settings_data or [{}])[0]
            if path not in static_pages:
                title = site.get("seo_home_title") or title
                description = site.get("seo_home_description") or description
            else:
                site_name = site.get("site_name", "فروشگاه 82")
                title = title.replace("فروشگاه 82", site_name)
                description = description.replace("فروشگاه 82", site_name)
            image = site.get("seo_social_image") or site.get("logo") or ""
            if path.startswith("/product/"):
                slug = path.split("/product/", 1)[1].strip("/")
                product = self._api_json(
                    f"/catalog/products/{quote(slug, safe='')}/"
                )
                indexable = True
                title = product.get("seo_title") or (
                    f"{product['name']} | خرید از {site.get('site_name', 'فروشگاه 82')}"
                )
                description = (
                    product.get("seo_description")
                    or product.get("description")
                    or product.get("short_description")
                    or product["name"]
                )
                canonical = product.get("canonical_url") or canonical
                image = product.get("image") or image
                reviews = int(product.get("approved_reviews_count") or 0)
                rating = float(product.get("rating") or 0)
                schema = {
                    "@context": "https://schema.org",
                    "@type": "Product",
                    "name": product["name"],
                    "description": description,
                    "sku": product.get("sku") or product["slug"],
                    "image": [image] if image else [],
                    "offers": {
                        "@type": "Offer",
                        "url": canonical,
                        "priceCurrency": "IRR",
                        "price": str(
                            round(
                                int(product.get("final_price") or product["price"])
                                * 10
                            )
                        ),
                        "availability": (
                            "https://schema.org/InStock"
                            if int(product.get("stock") or 0) > 0
                            else "https://schema.org/OutOfStock"
                        ),
                        "itemCondition": "https://schema.org/NewCondition",
                    },
                }
                if product.get("brand_name"):
                    schema["brand"] = {
                        "@type": "Brand",
                        "name": product["brand_name"],
                    }
                if reviews and rating:
                    schema["aggregateRating"] = {
                        "@type": "AggregateRating",
                        "ratingValue": str(rating),
                        "reviewCount": str(reviews),
                        "bestRating": "5",
                        "worstRating": "1",
                    }
            elif path.startswith("/shop/") or path.startswith("/gaming/"):
                gaming_category = path.startswith("/gaming/")
                prefix = "/gaming/" if gaming_category else "/shop/"
                slug = path.split(prefix, 1)[1].strip("/")
                category = self._api_json(
                    f"/catalog/categories/{quote(slug, safe='')}/"
                )
                indexable = True
                if gaming_category:
                    title = (
                        f"{category['name']} گیمینگ | "
                        f"{site.get('site_name', 'فروشگاه 82')}"
                    )
                else:
                    title = (
                        category.get("seo_title")
                        or f"خرید {category['name']} | "
                        f"{site.get('site_name', 'فروشگاه 82')}"
                    )
                description = (
                    f"مشاهده و خرید محصولات گیمینگ دسته {category['name']} با ضمانت و ارسال سریع."
                    if gaming_category
                    else category.get("seo_description")
                    or f"مشاهده و خرید جدیدترین محصولات {category['name']} با ضمانت و ارسال سریع."
                )
        except HTTPError as error:
            if error.code == 404:
                response_status = 404
                indexable = False
        except (URLError, ValueError, KeyError, IndexError, LookupError):
            pass

        escaped_title = html.escape(title[:180])
        escaped_description = html.escape(description[:320], quote=True)
        escaped_canonical = html.escape(canonical, quote=True)
        document = re.sub(
            r"<title>.*?</title>",
            f"<title>{escaped_title}</title>",
            document,
            count=1,
            flags=re.DOTALL,
        )
        document = re.sub(
            r'<meta name="description"[^>]*>',
            f'<meta name="description" content="{escaped_description}" />',
            document,
            count=1,
        )
        document = re.sub(
            r'<meta name="robots"[^>]*>',
            (
                '<meta name="robots" '
                'content="index,follow,max-image-preview:large" />'
                if indexable
                else '<meta name="robots" content="noindex,nofollow" />'
            ),
            document,
            count=1,
        )
        document = re.sub(
            r'<link rel="canonical"[^>]*>',
            f'<link rel="canonical" href="{escaped_canonical}" />',
            document,
            count=1,
        )
        document = re.sub(
            r'<link rel="alternate" hreflang="fa-IR"[^>]*>',
            f'<link rel="alternate" hreflang="fa-IR" href="{escaped_canonical}" />',
            document,
            count=1,
        )
        document = re.sub(
            r'<link rel="alternate" hreflang="x-default"[^>]*>',
            f'<link rel="alternate" hreflang="x-default" href="{escaped_canonical}" />',
            document,
            count=1,
        )
        document = re.sub(
            r'<meta property="og:type"[^>]*>',
            f'<meta property="og:type" content="{"product" if schema else "website"}" />',
            document,
            count=1,
        )
        replacements = {
            r'<meta property="og:title"[^>]*>': f'<meta property="og:title" content="{escaped_title}" />',
            r'<meta property="og:description"[^>]*>': f'<meta property="og:description" content="{escaped_description}" />',
            r'<meta property="og:url"[^>]*>': f'<meta property="og:url" content="{escaped_canonical}" />',
            r'<meta name="twitter:title"[^>]*>': f'<meta name="twitter:title" content="{escaped_title}" />',
            r'<meta name="twitter:description"[^>]*>': f'<meta name="twitter:description" content="{escaped_description}" />',
        }
        for pattern, replacement in replacements.items():
            document = re.sub(pattern, replacement, document, count=1)
        extra = ""
        if image:
            absolute_image = html.escape(urljoin(origin + "/", image), quote=True)
            extra += (
                f'<meta property="og:image" content="{absolute_image}" />'
                f'<meta name="twitter:image" content="{absolute_image}" />'
                '<meta name="twitter:card" content="summary_large_image" />'
            )
        if schema:
            extra += (
                '<script id="seo-structured-data" type="application/ld+json">'
                + json.dumps(schema, ensure_ascii=False).replace("</", "<\\/")
                + "</script>"
            )
        document = document.replace("</head>", f"{extra}</head>", 1)
        body = document.encode("utf-8")
        self.send_response(response_status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-cache")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in {"/robots.txt", "/sitemap.xml", "/sitemap-index.xml", "/sitemap-pages.xml", "/sitemap-categories.xml", "/sitemap-products.xml", "/sitemap-guides.xml", "/merchant-feed.xml"}:
            try:
                with urlopen(f"http://127.0.0.1:8000{path}", timeout=5) as response:
                    body = response.read()
                    self.send_response(response.status)
                    self.send_header(
                        "Content-Type",
                        response.headers.get("Content-Type", "text/plain"),
                    )
                    self.send_header("Cache-Control", "public, max-age=300")
                    self.end_headers()
                    self.wfile.write(body)
                return
            except URLError:
                self.send_error(503, "Backend is not available")
                return
        if path in {"/admin", "/admin/", "/admin.html"}:
            self.path = "/html/admin.html"
            return super().do_GET()
        if path == "/manifest.webmanifest":
            self.path = "/public/manifest.webmanifest"
            return super().do_GET()
        if path == "/service-worker.js":
            self.path = "/js/service-worker.js"
            return super().do_GET()
        target = ROOT / path.lstrip("/")
        if (
            path not in {"/", "/index.html"}
            and not target.exists()
            and not Path(path).suffix
        ):
            return self._serve_spa(path)
        if path in {"/", "/index.html"}:
            return self._serve_spa("/")
        return super().do_GET()


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 5500), SpaHandler)
    print("فروشگاه 82: http://127.0.0.1:5500")
    server.serve_forever()
