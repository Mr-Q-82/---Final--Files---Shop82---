const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const read = (file) => {
  const source = fs.readFileSync(path.join(__dirname, "..", file), "utf8");
  if (source.includes("Modular stylesheet manifest")) {
    const directory = path.dirname(path.join(__dirname, "..", file));
    return [...source.matchAll(/@import\s+url\(["']([^"']+)["']\);/g)]
      .map((match) => fs.readFileSync(path.join(directory, match[1]), "utf8"))
      .join("\n");
  }
  if (!source.startsWith("// Compatibility manifest.")) return source;
  return [...source.matchAll(/^\/\/ (\/js\/[^\n]+)/gm)]
    .map((match) => fs.readFileSync(path.join(__dirname, "..", match[1]), "utf8"))
    .join("\n");
};

test("product configurator persists selected options into checkout", () => {
  const detail = read("js/storefront/pages/product-detail.jsx");
  const cart = read("js/storefront/services/browser.jsx");
  const checkout = read("js/storefront/pages/account.jsx");
  assert.match(detail, /customizationOptionIds/);
  assert.match(detail, /پیکربندی اختصاصی/);
  assert.match(cart, /customizationSummary/);
  assert.match(checkout, /customization_option_ids/);
});

test("normal and gaming catalogs expose separate usage profiles", () => {
  const shop = read("js/storefront/pages/shop.jsx");
  const gaming = read("js/storefront/pages/gaming.jsx");
  assert.match(shop, /catalog=NORMAL/);
  assert.match(gaming, /catalog=GAMING/);
  assert.match(shop, /بر اساس نوع استفاده/);
  assert.match(shop, /productMatchesUsage/);
  assert.match(gaming, /productMatchesUsage/);
  assert.match(shop, /setUsageInLocation/);
});

test("every category has immediate linked usage defaults", () => {
  const catalog = read("js/storefront/core/catalog.jsx");
  assert.match(catalog, /USAGE_PROFILE_TEMPLATES/);
  assert.match(catalog, /defaultUsageProfiles/);
  assert.match(catalog, /usageFromLocation/);
  assert.match(catalog, /url\.searchParams\.set\("usage"/);
  assert.match(catalog, /availableProducts/);
  assert.match(catalog, /guaranteed/);
});

test("product detail keeps a real compact gallery at desktop zoom", () => {
  const detail = read("js/storefront/pages/product-detail.jsx");
  const styles = read("css/product-detail-store.css");
  assert.match(detail, /pd-gallery-strip/);
  assert.match(detail, /گالری محصول/);
  assert.match(styles, /height:\s*max-content/);
  assert.match(styles, /"info gallery"[\s\S]*?"info tech"/);
});

test("product detail image stays centered inside the main gallery frame", () => {
  const styles = fs.readFileSync(
    path.join(__dirname, "../css/product-detail-pro-store.css"),
    "utf8",
  );
  assert.match(styles, /\.pd-v2 \.pd-gallery \.main-img\s*\{[\s\S]*?align-items:\s*center[\s\S]*?justify-content:\s*center/);
  assert.match(styles, /\.pd-v2 \.pd-gallery \.main-img\s*>\s*img\s*\{[\s\S]*?object-position:\s*50% 50%/);
});

test("product studio exposes conditional live customization", () => {
  const detail = read("js/storefront/pages/product-detail.jsx");
  const styles = read("css/product-detail-pro-store.css");
  assert.match(detail, /pd-product-head/);
  assert.match(detail, /pd-config-summary/);
  assert.match(detail, /const hasCustomization = customizationGroups\.length > 0/);
  assert.match(detail, /\{hasCustomization && <div className="pd-selection-intro"/);
  assert.match(detail, /\{hasCustomization && \(/);
  assert.match(detail, /customizationPrice/);
  assert.match(styles, /Product Studio/);
  assert.match(styles, /grid-template-areas:[\s\S]*?"info visual"/);
});

test("automatic customization is limited to genuinely configurable products", () => {
  const defaults = read("../backend/apps/catalog/default_customization.py");
  const serializer = read("../backend/apps/catalog/serializer_modules/products.py");
  const migration = read("../backend/apps/catalog/migrations/0044_limit_automatic_customization.py");

  assert.match(defaults, /CONFIGURABLE_TEMPLATE_KEYS = frozenset\(\{"laptop", "case"\}\)/);
  assert.match(serializer, /if not category_supports_customization\(obj\.category\)/);
  assert.match(serializer, /if not group\.applies_to_all_products/);
  assert.match(migration, /applies_to_all_products=True/);
});

test("product studio neutralizes legacy grid areas and stacks before tablet overflow", () => {
  const styles = read("css/product-detail-pro-store.css");

  assert.match(styles, /\.pd-v2 \.pd-gallery\s*\{[\s\S]*?grid-area:\s*auto/);
  assert.match(styles, /\.pd-v2 \.pd-tech-rail\s*\{[\s\S]*?grid-area:\s*auto/);
  assert.match(styles, /\.pd-v2 \.pd-info > \*\s*\{\s*grid-area:\s*auto/);
  assert.match(
    styles,
    /@media \(max-width:\s*1250px\)[\s\S]*?grid-template-areas:\s*"head"\s*"visual"\s*"info"/,
  );
});

test("product purchase controls stay inside the configuration column", () => {
  const detail = read("js/storefront/pages/product-detail.jsx");
  const styles = read("css/product-detail-pro-store.css");
  assert.match(detail, /className="pd-info"[\s\S]*?className="pd-purchase-dock"/);
  assert.match(styles, /\.pd-v2 \.pd-purchase-dock[\s\S]*?grid-template-areas:[\s\S]*?"price qty"[\s\S]*?"benefits benefits"/);
  assert.match(styles, /\.pd-v2 \.pd-dock-benefits[\s\S]*?repeat\(3, minmax\(0, 1fr\)\)/);
});

test("key specifications follow purchase controls and gallery stays compact", () => {
  const detail = read("js/storefront/pages/product-detail.jsx");
  const styles = read("css/product-detail-pro-store.css");

  assert.match(detail, /className="pd-purchase-dock"[\s\S]*?className="pd-tech-rail"/);
  assert.doesNotMatch(detail, /className="pd-visual-column"[\s\S]*?className="pd-tech-rail"[\s\S]*?className="pd-info"/);
  assert.match(styles, /\.pd-head-copy h1[^}]*font-size:\s*clamp\(21px,\s*1\.65vw,\s*30px\)/);
  assert.match(styles, /\.pd-v2 \.pd-gallery \.main-img[^}]*height:\s*clamp\(310px,\s*29vw,\s*430px\)/);
});

test("product intro and active detail tabs keep accessible contrast", () => {
  const styles = read("css/product-detail-pro-store.css");
  assert.match(styles, /\.pd-selection-intro[\s\S]*?background-color:\s*#312e81\s*!important/);
  assert.match(styles, /\.pd-selection-intro b[\s\S]*?color:\s*#fff\s*!important/);
  assert.match(styles, /\.pd-detail-content \.tab\.on[\s\S]*?color:\s*#fff\s*!important[\s\S]*?background-color:\s*#5b21b6\s*!important/);
});

test("category offer slider has discounted and popular fallbacks", () => {
  const shop = read("js/storefront/pages/shop.jsx");
  assert.match(shop, /discountedOffers/);
  assert.match(shop, /categoryFallbackOffers/);
  assert.match(shop, /products=\{offerProducts\}/);
});

test("admin can manage usage profiles and customization options", () => {
  const admin = read("js/admin/pages/configurator.jsx");
  assert.match(admin, /usage-profiles/);
  assert.match(admin, /customization-groups/);
  assert.match(admin, /customization-options/);
  assert.match(admin, /price_delta/);
  assert.match(admin, /stock/);
});
