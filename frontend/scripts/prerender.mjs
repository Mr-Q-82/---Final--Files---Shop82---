import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const frontendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const templatePath = path.join(frontendRoot, "html", "index.html");
const outputRoot = path.join(frontendRoot, "dist", "prerender");
const siteUrl = (process.env.SEO_SITE_URL || "http://127.0.0.1:5500").replace(/\/$/, "");
const apiBase = (process.env.SEO_API_BASE || "http://127.0.0.1:8000/api/v1").replace(/\/$/, "");
if (process.env.NODE_ENV === "production" && (!process.env.SEO_SITE_URL || /localhost|127\.0\.0\.1/.test(siteUrl))) {
  throw new Error("SEO_SITE_URL must be the public HTTPS domain for a production build.");
}

const escapeHtml = (value = "") =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const safeJson = (value) => JSON.stringify(value).replaceAll("</", "<\\/");

function replaceAttribute(document, selector, html) {
  const patterns = {
    title: /<title>[\s\S]*?<\/title>/i,
    description: /<meta\s+name="description"[^>]*>/i,
    robots: /<meta\s+name="robots"[^>]*>/i,
    canonical: /<link\s+rel="canonical"[^>]*>/i,
    hreflangFa: /<link\s+rel="alternate"\s+hreflang="fa-IR"[^>]*>/i,
    hreflangDefault: /<link\s+rel="alternate"\s+hreflang="x-default"[^>]*>/i,
    ogTitle: /<meta\s+property="og:title"[^>]*>/i,
    ogDescription: /<meta\s+property="og:description"[^>]*>/i,
    ogUrl: /<meta\s+property="og:url"[^>]*>/i,
    ogType: /<meta\s+property="og:type"[^>]*>/i,
    twitterTitle: /<meta\s+name="twitter:title"[^>]*>/i,
    twitterDescription: /<meta\s+name="twitter:description"[^>]*>/i,
  };
  return patterns[selector].test(document)
    ? document.replace(patterns[selector], html)
    : document.replace("</head>", `    ${html}\n  </head>`);
}

function render(template, page) {
  const canonical = page.canonical || `${siteUrl}${page.path === "/" ? "" : page.path}`;
  const title = escapeHtml(page.title).slice(0, 180);
  const description = escapeHtml(page.description).slice(0, 320);
  const url = escapeHtml(canonical);
  const robots = page.indexable === false ? "noindex,nofollow" : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
  let document = template;
  document = replaceAttribute(document, "title", `<title>${title}</title>`);
  document = replaceAttribute(document, "description", `<meta name="description" content="${description}" />`);
  document = replaceAttribute(document, "robots", `<meta name="robots" content="${robots}" />`);
  document = replaceAttribute(document, "canonical", `<link rel="canonical" href="${url}" />`);
  document = replaceAttribute(document, "hreflangFa", `<link rel="alternate" hreflang="fa-IR" href="${url}" />`);
  document = replaceAttribute(document, "hreflangDefault", `<link rel="alternate" hreflang="x-default" href="${url}" />`);
  document = replaceAttribute(document, "ogTitle", `<meta property="og:title" content="${title}" />`);
  document = replaceAttribute(document, "ogDescription", `<meta property="og:description" content="${description}" />`);
  document = replaceAttribute(document, "ogUrl", `<meta property="og:url" content="${url}" />`);
  document = replaceAttribute(document, "ogType", `<meta property="og:type" content="${page.type === "Product" ? "product" : "website"}" />`);
  document = replaceAttribute(document, "twitterTitle", `<meta name="twitter:title" content="${title}" />`);
  document = replaceAttribute(document, "twitterDescription", `<meta name="twitter:description" content="${description}" />`);
  if (page.image) {
    const image = escapeHtml(new URL(page.image, siteUrl).href);
    document = document.replace(
      "</head>",
      `    <meta property="og:image" content="${image}" />\n    <meta name="twitter:image" content="${image}" />\n  </head>`,
    );
  }
  if (page.schema) {
    document = document.replace(
      "</head>",
      `    <script id="seo-structured-data" type="application/ld+json">${safeJson(page.schema)}</script>\n  </head>`,
    );
  }
  if (page.staticHtml) {
    document = document.replace('<div id="root"></div>', `${page.staticHtml}<div id="root"></div>`);
  }
  if (site.bing_site_verification) {
    document = document.replace("</head>", `    <meta name="msvalidate.01" content="${escapeHtml(site.bing_site_verification)}" />\n  </head>`);
  }
  return document;
}

async function api(pathnameOrUrl) {
  const url = /^https?:\/\//.test(pathnameOrUrl)
    ? pathnameOrUrl
    : `${apiBase}${pathnameOrUrl}`;
  const response = await fetch(url, { signal: AbortSignal.timeout(1500) });
  if (!response.ok) throw new Error(`${response.status} ${pathnameOrUrl}`);
  return response.json();
}

async function apiAll(pathname) {
  const items = [];
  let next = pathname;
  let pageCount = 0;
  while (next && pageCount < 100) {
    const data = await api(next);
    if (Array.isArray(data)) return data;
    items.push(...(data.results || []));
    next = data.next || null;
    pageCount += 1;
  }
  return items;
}

async function writePage(template, page) {
  const relative = page.path === "/" ? "index.html" : `${page.path.replace(/^\//, "")}/index.html`;
  const destination = path.join(outputRoot, relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, render(template, page), "utf8");
}

const template = await fs.readFile(templatePath, "utf8");
let site = {
  site_name: "فروشگاه 82",
  seo_home_title: "فروشگاه 82 | فروشگاه تخصصی کالای دیجیتال",
  seo_home_description: "خرید اینترنتی کالای دیجیتال، لپ‌تاپ و قطعات کامپیوتر با ضمانت و ارسال سریع.",
};
let backendAvailable = false;
try {
  const settings = await api("/catalog/site-settings/");
  site = { ...site, ...(settings.results || settings || [{}])[0] };
  backendAvailable = true;
} catch {
  // A build must remain usable while Django is offline.
}

const staticPages = [
  {
    path: "/",
    title: site.seo_home_title,
    description: site.seo_home_description,
    image: site.seo_social_image || site.logo,
    schema: [
      { "@context": "https://schema.org", "@type": "OnlineStore", name: site.site_name, url: siteUrl, ...(site.logo ? { logo: new URL(site.logo, siteUrl).href } : {}), ...(site.organization_phone ? { telephone: site.organization_phone } : {}), ...(site.organization_email ? { email: site.organization_email } : {}), ...(site.organization_address ? { address: site.organization_address } : {}), ...(site.organization_social_links?.length ? { sameAs: site.organization_social_links } : {}) },
      { "@context": "https://schema.org", "@type": "WebSite", name: site.site_name, url: siteUrl, inLanguage: "fa-IR", potentialAction: { "@type": "SearchAction", target: `${siteUrl}/shop?q={search_term_string}`, "query-input": "required name=search_term_string" } },
    ],
  },
  { path: "/shop", title: `فروشگاه محصولات دیجیتال | ${site.site_name}`, description: site.seo_home_description },
  { path: "/gaming", title: `محصولات گیمینگ | ${site.site_name}`, description: `خرید محصولات، قطعات و تجهیزات منتخب گیمینگ از ${site.site_name}.` },
  { path: "/about", title: `درباره ما | ${site.site_name}`, description: `با ${site.site_name}، خدمات فروشگاه و ارزش‌های ما بیشتر آشنا شوید.` },
  { path: "/contact", title: `تماس با ما | ${site.site_name}`, description: `راه‌های ارتباط با پشتیبانی ${site.site_name} و ثبت درخواست مشتریان.` },
  { path: "/faq", title: `سؤالات متداول | ${site.site_name}`, description: "پاسخ پرسش‌های رایج درباره خرید، ارسال، گارانتی و مرجوعی کالا." },
  { path: "/returns", title: `شرایط بازگشت کالا | ${site.site_name}`, description: `شرایط و مراحل ثبت و پیگیری درخواست بازگشت کالا در ${site.site_name}.` },
  { path: "/guides", title: `راهنماهای خرید | ${site.site_name}`, description: "راهنماهای تخصصی برای مقایسه و انتخاب آگاهانه محصولات دیجیتال و گیمینگ." },
];

const pages = [...staticPages];
if (backendAvailable) {
  try {
    const categories = await apiAll("/catalog/categories/?page_size=500&is_active=true");
    const products = await apiAll("/catalog/products/?page_size=500&is_active=true");
    for (const category of categories) {
      const categoryProducts = products.filter((product) => product.category === category.id).slice(0, 100);
      const productLinks = categoryProducts.map((product) => `<li><a href="/product/${encodeURIComponent(product.slug)}">${escapeHtml(product.name)}</a></li>`).join("");
      const categorySchema = [
        { "@context": "https://schema.org", "@type": "CollectionPage", name: category.name, description: category.seo_description || category.intro_text || "", mainEntity: { "@type": "ItemList", itemListElement: categoryProducts.map((product, index) => ({ "@type": "ListItem", position: index + 1, url: `${siteUrl}/product/${encodeURIComponent(product.slug)}`, name: product.name })) } },
        ...(category.faq_items?.length ? [{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: category.faq_items.filter((item) => item.question && item.answer).map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) }] : []),
      ];
      const staticHtml = `<main class="seo-static-content"><h1>${escapeHtml(category.name)}</h1><p>${escapeHtml(category.intro_text || category.seo_description || "")}</p><ul>${productLinks}</ul></main>`;
      pages.push({
        path: `/shop/${encodeURIComponent(category.slug)}`,
        title: category.seo_title || `خرید ${category.name} | ${site.site_name}`,
        description: category.seo_description || `مشاهده و خرید جدیدترین محصولات ${category.name} با ضمانت و ارسال سریع.`,
        schema: categorySchema,
        staticHtml,
      });
      pages.push({
        path: `/gaming/${encodeURIComponent(category.slug)}`,
        title: `${category.name} گیمینگ | ${site.site_name}`,
        description: `مشاهده و خرید محصولات گیمینگ دسته ${category.name} از ${site.site_name}.`,
        schema: categorySchema,
        staticHtml,
      });
    }
    for (const product of products) {
      const canonical = product.canonical_url || `${siteUrl}/product/${encodeURIComponent(product.slug)}`;
      const description = product.seo_description || product.description || product.short_description || product.name;
      const price = Math.round(Number(product.final_price || product.price || 0) * 10);
      pages.push({
        path: `/product/${encodeURIComponent(product.slug)}`,
        canonical,
        type: "Product",
        title: product.seo_title || `${product.name} | خرید از ${site.site_name}`,
        description,
        image: product.image,
        schema: {
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description,
          sku: product.sku || product.slug,
          ...(product.gtin ? { gtin: product.gtin } : {}),
          ...(product.mpn ? { mpn: product.mpn } : {}),
          ...(product.material ? { material: product.material } : {}),
          ...(product.product_group_id ? { inProductGroupWithID: product.product_group_id } : {}),
          ...(product.image ? { image: [new URL(product.image, siteUrl).href] } : {}),
          ...(product.brand_name ? { brand: { "@type": "Brand", name: product.brand_name } } : {}),
          offers: { "@type": "Offer", url: canonical, priceCurrency: "IRR", price: String(price), availability: Number(product.stock || 0) > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", itemCondition: "https://schema.org/NewCondition", seller: { "@type": "Organization", name: site.merchant_name || site.site_name }, shippingDetails: { "@type": "OfferShippingDetails", shippingRate: { "@type": "MonetaryAmount", value: String(Number(site.shipping_cost || 0) * 10), currency: "IRR" }, deliveryTime: { "@type": "ShippingDeliveryTime", transitTime: { "@type": "QuantitativeValue", minValue: Number(site.shipping_min_days || 1), maxValue: Number(site.shipping_max_days || 5), unitCode: "DAY" } } }, hasMerchantReturnPolicy: { "@type": "MerchantReturnPolicy", applicableCountry: "IR", returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow", merchantReturnDays: Number(site.return_window_days || 7), returnMethod: "https://schema.org/ReturnByMail" } },
          ...(Number(product.rating || 0) > 0 && Number(product.approved_reviews_count || 0) > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: String(product.rating), reviewCount: String(product.approved_reviews_count) } } : {}),
        },
        staticHtml: `<main class="seo-static-content"><h1>${escapeHtml(product.name)}</h1><p>${escapeHtml(description)}</p><a href="/shop/${encodeURIComponent(product.category_slug || "")}">${escapeHtml(product.category_name || "فروشگاه")}</a></main>`,
      });
    }
    const guides = await apiAll("/catalog/buying-guides/?page_size=500&is_published=true");
    for (const guide of guides) pages.push({ path: `/guides/${encodeURIComponent(guide.slug)}`, title: guide.seo_title || `${guide.title} | ${site.site_name}`, description: guide.seo_description || String(guide.content || "").slice(0, 300), schema: { "@context": "https://schema.org", "@type": "Article", headline: guide.title, dateModified: guide.updated_at, mainEntityOfPage: `${siteUrl}/guides/${encodeURIComponent(guide.slug)}` }, staticHtml: `<article class="seo-static-content"><h1>${escapeHtml(guide.title)}</h1><p>${escapeHtml(guide.content || "")}</p></article>` });
  } catch (error) {
    console.warn(`SEO dynamic pages skipped: ${error.message}`);
  }
}

await fs.rm(outputRoot, { recursive: true, force: true });
await Promise.all(pages.map((page) => writePage(template, page)));
console.log(`Prerendered ${pages.length} SEO shells${backendAvailable ? " with Django data" : " (static pages; Django offline)"}.`);
