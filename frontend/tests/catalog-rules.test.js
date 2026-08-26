const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const nativeReadFileSync = fs.readFileSync.bind(fs);
fs.readFileSync = (file, options) => {
  const source = nativeReadFileSync(file, options);
  if (typeof source === "string" && source.includes("Modular stylesheet manifest")) {
    const directory = path.dirname(file.toString());
    return [...source.matchAll(/@import\s+url\(["']([^"']+)["']\);/g)]
      .map((match) => nativeReadFileSync(path.join(directory, match[1]), options))
      .join("\n");
  }
  if (typeof source !== "string" || !source.startsWith("// Compatibility manifest."))
    return source;
  const frontendRoot = path.join(__dirname, "..");
  const modules = [...source.matchAll(/^\/\/ (\/js\/[^\n]+)/gm)];
  return modules
    .map((match) => nativeReadFileSync(path.join(frontendRoot, match[1]), options))
    .join("\n");
};

function load(sourcePath, exportExpression) {
  const source = fs.readFileSync(path.join(__dirname, sourcePath), "utf8");
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${source}\nthis.exported = ${exportExpression};`, context);
  return context.exported;
}

test("Iran location data contains every province and related city lists", () => {
  const locations = load(
    "../js/shared/data/iran-locations.js",
    "IRAN_LOCATIONS",
  );
  assert.equal(Object.keys(locations).length, 31);
  assert.ok(locations["تهران"].includes("تهران"));
  assert.ok(locations["خراسان رضوی"].includes("مشهد"));
  assert.ok(locations["آذربایجان شرقی"].includes("تبریز"));
  assert.ok(Object.values(locations).every((cities) => cities.length > 0));
});

test("regular and gaming catalogs stay separated", () => {
  const selectors = load(
    "../js/storefront/services/product-selectors.jsx",
    "ProductSelectors",
  );
  const products = [
    { id: 1, isGaming: false, isFeatured: true, stock: 2 },
    { id: 2, isGaming: true, isFeatured: true, stock: 4 },
    { id: 3, isGaming: false, isFeatured: false, stock: 3 },
    { id: 4, isGaming: false, isFeatured: true, stock: 0 },
    { id: 5, sku: "GAM-BULK-MOUSE-001", isGaming: false, stock: 4 },
  ];
  assert.deepEqual(
    Array.from(selectors.regular(products), (product) => product.id),
    [1, 3, 4],
  );
  assert.deepEqual(
    Array.from(selectors.gaming(products), (product) => product.id),
    [2, 5],
  );
  assert.deepEqual(
    Array.from(selectors.featured(products), (product) => product.id),
    [1, 2],
  );
});

test("catalog loader requests only the product type required by the route", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../js/storefront/store/store.jsx"),
    "utf8",
  );
  assert.match(source, /wantsGamingCatalog/);
  assert.match(source, /is_gaming=\$\{/);
  assert.match(source, /ProductSelectors\.regular\(mappedProducts\)/);
  assert.match(source, /ProductSelectors\.gaming\(mappedProducts\)/);
});

test("production bundle includes both React root and portal APIs", () => {
  const buildSource = fs.readFileSync(
    path.join(__dirname, "../scripts/build.mjs"),
    "utf8",
  );
  assert.match(buildSource, /react-dom\/client/);
  assert.match(buildSource, /createPortal/);
  assert.match(buildSource, /const ReactDOM = \{ \.\.\.ReactDOMClient, createPortal \}/);
});

test("gaming catalog filters and cards are fed only from gaming products", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/gaming.jsx"),
    "utf8",
  );
  assert.match(source, /ProductSelectors\.gaming\(PRODUCTS\)/);
  assert.match(source, /filteredGamingProducts\.slice\(0, limit\)/);
  assert.doesNotMatch(source, /ProductSelectors\.regular\(PRODUCTS\)/);
  assert.match(source, /setSelectedCategories\(\[category\.id\]\)/);
});

test("shop navigation clears stale category filters without breaking refresh persistence", () => {
  const shop = fs.readFileSync(path.join(__dirname, "../js/storefront/pages/shop.jsx"), "utf8");
  const gaming = fs.readFileSync(path.join(__dirname, "../js/storefront/pages/gaming.jsx"), "utf8");
  const header = fs.readFileSync(path.join(__dirname, "../js/storefront/components/header.jsx"), "utf8");

  assert.match(shop, /else if \(navigationKey\)[\s\S]*setCats\(\[\]\)/);
  assert.match(gaming, /else if \(navigationKey\)[\s\S]*setSelectedCategories\(\[\]\)/);
  assert.match(header, /sessionStorage\.setItem\("gaming_focus_catalog", "1"\)[\s\S]*nav\("gaming"\)/);
  assert.match(gaming, /gaming_focus_catalog[\s\S]*scrollIntoView/);
});

test("regular category selection cannot be hidden by a temporary price ceiling or stale brand", () => {
  const shop = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/shop.jsx"),
    "utf8",
  );
  assert.match(shop, /const effectiveMaxPrice =[\s\S]*Number\.MAX_SAFE_INTEGER[\s\S]*priceCeiling/);
  assert.match(shop, /const toggleCategory =[\s\S]*setBrands\(\[\]\)[\s\S]*setAvailableBrands\(\[\]\)/);
  assert.match(shop, /setMaxPrice\(Number\.MAX_SAFE_INTEGER\)/);
  assert.match(shop, /p\.finalPrice <= effectiveMaxPrice/);
  assert.doesNotMatch(shop, /setMaxPrice\(\(current\) => Math\.min\(Math\.max\(current, 0\), priceCeiling\)\)/);
});

test("smart Persian search normalizes text and filters both catalog routes", () => {
  const selectors = fs.readFileSync(
    path.join(__dirname, "../js/storefront/services/product-selectors.jsx"),
    "utf8",
  );
  const header = fs.readFileSync(
    path.join(__dirname, "../js/storefront/components/header.jsx"),
    "utf8",
  );
  const shop = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/shop.jsx"),
    "utf8",
  );
  const gaming = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/gaming.jsx"),
    "utf8",
  );
  assert.match(selectors, /normalizeSearchText/);
  assert.match(selectors, /matchesSearch\(product, query\)/);
  assert.match(selectors, /searchScore\(product, query\)/);
  assert.match(header, /ProductSelectors\.search\(pool, term, 24\)/);
  assert.match(header, /suggestion\.type === "category"/);
  assert.match(shop, /ProductSelectors\.matchesSearch\(p, searchQuery\)/);
  assert.match(gaming, /ProductSelectors\.matchesSearch\(product, searchQuery\)/);
});

test("search keeps monitor, gaming and mouse-pad intents separate", () => {
  const selectors = load(
    "../js/storefront/services/product-selectors.jsx",
    "ProductSelectors",
  );
  const products = [
    { id: 1, name: "مانیتور اداری", cat: "monitor", catName: "مانیتور", isGaming: false, stock: 2 },
    { id: 2, name: "مانیتور حرفه‌ای", cat: "monitor", catName: "مانیتور", isGaming: true, stock: 2 },
    { id: 3, name: "موس گیمینگ", cat: "mouse", catName: "ماوس", isGaming: true, stock: 2 },
    { id: 4, name: "موس پد گیمینگ", cat: "mouse-pad", catName: "موس‌پد", isGaming: true, stock: 2 },
  ];
  assert.deepEqual(
    Array.from(selectors.search(products, "مانیتور"), (item) => item.id),
    [1, 2],
  );
  assert.deepEqual(
    Array.from(selectors.search(products, "مانیتور گیمینگ"), (item) => item.id),
    [2],
  );
  assert.deepEqual(
    Array.from(selectors.search(products, "موس"), (item) => item.id),
    [3],
  );
  assert.deepEqual(
    Array.from(selectors.search(products, "موس پد"), (item) => item.id),
    [4],
  );
  assert.equal(selectors.queryRequestsGaming("مانیتور گیمینگ"), true);
  assert.equal(selectors.searchCategory("مانیتور گیمینگ"), "مانیتور");
});

test("live storefront search returns products from the first character", () => {
  const selectors = load(
    "../js/storefront/services/product-selectors.jsx",
    "ProductSelectors",
  );
  const products = [
    { id: 1, name: "مانیتور ایسوس", cat: "monitor", catName: "مانیتور" },
    { id: 2, name: "کیبورد مکانیکال", cat: "keyboard", catName: "کیبورد" },
    { id: 3, name: "حافظه SSD سامسونگ", cat: "ssd", catName: "حافظه SSD" },
  ];
  assert.deepEqual(
    Array.from(selectors.search(products, "م"), (item) => item.id),
    [1, 2, 3],
  );
  assert.deepEqual(
    Array.from(selectors.search(products, "کی"), (item) => item.id),
    [2],
  );
});

test("header requests backend suggestions for a single character", () => {
  const header = fs.readFileSync(
    path.join(__dirname, "../js/storefront/components/header/header/part-01.jsx"),
    "utf8",
  );
  assert.doesNotMatch(header, /length\s*<\s*2/);
  assert.match(header, /suggest\/\?q=.*limit=100/);
  assert.match(header, /const pool = PRODUCTS/);
  assert.match(header, /}, 160\);/);
});

test("admin product search prioritizes exact product names and SKUs", () => {
  const manager = fs.readFileSync(
    path.join(__dirname, "../js/admin/pages/products/products-manager.jsx"),
    "utf8",
  );
  assert.match(manager, /const adminProductSearchScore/);
  assert.match(manager, /if \(sku === query\) score \+= 1000/);
  assert.match(manager, /if \(name === query\) score \+= 900/);
  assert.match(manager, /second\.score - first\.score/);
  assert.match(manager, /catalog\/products\/suggest\/\?q=/);
  assert.match(manager, /setRemoteSearchItems\(exactRows\)/);
  assert.match(manager, /product-category-tabs/);
  assert.match(manager, /category_id=\$\{encodeURIComponent\(selectedCategory\)\}/);
  assert.match(manager, /category__slug=\$\{encodeURIComponent\(selectedCategoryRecord\.slug\)\}/);
  assert.match(manager, /categoryItems \?\? items/);
  assert.match(manager, /جستجوی محصول در دسته/);
  assert.match(manager, /setRemoteSearchItems\(\[\]\)/);
  assert.match(manager, /hasRemoteResults \? 0 : adminProductSearchScore/);
  assert.match(manager, /}, 160\);/);
  const adminRuntime = fs.readFileSync(
    path.join(__dirname, "../js/admin/core/runtime.jsx"),
    "utf8",
  );
  assert.match(adminRuntime, /\{ useEffect, useMemo, useRef, useState \} = React/);
});

test("search suggestions are opaque and browser autocomplete is disabled globally", () => {
  const headerStyles = fs.readFileSync(
    path.join(__dirname, "../css/header&&menu-store.css"),
    "utf8",
  );
  const normalizers = fs.readFileSync(
    path.join(__dirname, "../js/shared/core/normalizers.js"),
    "utf8",
  );
  const adminHtml = fs.readFileSync(
    path.join(__dirname, "../html/admin.html"),
    "utf8",
  );
  assert.match(headerStyles, /\.suggest\s*\{[\s\S]*?background:\s*var\(--surface-solid\)\s*!important/);
  assert.match(headerStyles, /\.suggest\s*\{[\s\S]*?backdrop-filter:\s*none\s*!important/);
  assert.match(normalizers, /const disableBrowserAutocomplete/);
  assert.match(normalizers, /form\.setAttribute\("autocomplete", "off"\)/);
  assert.match(normalizers, /type === "search" \? "off" : "new-password"/);
  assert.match(normalizers, /new MutationObserver/);
  assert.match(adminHtml, /admin\.bundle\.js\?v=18/);
  assert.match(adminHtml, /Admin-Toolbars\.css\?v=18/);
});

test("local Django media is allowed by storefront and admin CSP", () => {
  for (const file of ["index.html", "admin.html"]) {
    const html = fs.readFileSync(path.join(__dirname, `../html/${file}`), "utf8");
    assert.match(
      html,
      /img-src[^;]*http:\/\/127\.0\.0\.1:8000[^;]*http:\/\/localhost:8000/,
    );
  }
});

test("catalog data is loaded only for the active route and selected category", () => {
  const provider = fs.readFileSync(
    path.join(__dirname, "../js/storefront/store/store/provider/part-03.jsx"),
    "utf8",
  );
  const backend = fs.readFileSync(
    path.join(__dirname, "../../backend/apps/catalog/view_modules/products.py"),
    "utf8",
  );
  assert.match(provider, /catalogScope === "shell"/);
  assert.match(provider, /Promise\.resolve\(PRODUCTS\)/);
  assert.match(provider, /category__slug=/);
  assert.match(provider, /page_size=\$\{catalogScope === "home" \? 120 : 500\}/);
  assert.match(backend, /return ProductListSerializer/);
});

test("storefront and gaming category filters allow unlimited persisted selection", () => {
  const shopSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/shop.jsx"),
    "utf8",
  );
  const gamingSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/gaming.jsx"),
    "utf8",
  );
  assert.match(shopSource, /\.\.\.current, categoryId/);
  assert.match(gamingSource, /\.\.\.current, categoryId/);
  assert.match(shopSource, /shop82:filters:regular/);
  assert.match(gamingSource, /shop82:filters:gaming/);
  assert.match(shopSource, /localStorage\.setItem/);
  assert.match(gamingSource, /localStorage\.setItem/);
  assert.doesNotMatch(shopSource, /current\.length >= 2/);
  assert.doesNotMatch(gamingSource, /current\.length >= 2/);
});

test("top menu category navigation clears filters from the previous category", () => {
  const shopSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/shop.jsx"),
    "utf8",
  );
  const gamingSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/gaming.jsx"),
    "utf8",
  );
  for (const source of [shopSource, gamingSource]) {
    assert.match(source, /setMinPrice\(0\)/);
    assert.match(source, /setMaxPrice\(Number\.MAX_SAFE_INTEGER\)/);
    assert.match(source, /setMinRating\(0\)/);
    assert.match(source, /setOnlyOff\(false\)/);
    assert.match(source, /setInStock\(false\)/);
    assert.match(source, /setSelectedUsage\(""\)/);
  }
  assert.match(shopSource, /setBrands\(\[\]\)/);
  assert.match(gamingSource, /setSelectedBrands\(\[\]\)/);
});

test("filter accordion is controlled and exposes accessible expanded state", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../js/storefront/core/catalog.jsx"),
    "utf8",
  );
  assert.match(source, /aria-expanded=\{isOpen\}/);
  assert.match(source, /setIsOpen\(\(current\) => !current\)/);
  assert.match(source, /className="filter-accordion-panel"/);
});

test("production stylesheet bundles storefront component styles", () => {
  const buildSource = fs.readFileSync(
    path.join(__dirname, "../scripts/build.mjs"),
    "utf8",
  );
  const htmlSource = fs.readFileSync(
    path.join(__dirname, "../html/index.html"),
    "utf8",
  );
  assert.match(buildSource, /categories&&products-grid-store\.css/);
  assert.match(buildSource, /gaming-store\.css/);
  assert.match(buildSource, /product-detail-pro-store\.css/);
  assert.match(htmlSource, /storefront\.bundle\.css\?v=\d+/);
  assert.match(htmlSource, /storefront\.bundle\.js\?v=\d+/);
  assert.doesNotMatch(htmlSource, /\.\.\/css\/categories&&products-grid-store\.css/);
});

test("internal navigation reuses bundles and catalog data without hard reloads", () => {
  const cardSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/components/product-card.jsx"),
    "utf8",
  );
  const appSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/app.jsx"),
    "utf8",
  );
  const catalogSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/core/catalog.jsx"),
    "utf8",
  );
  const storeSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/store/store.jsx"),
    "utf8",
  );
  assert.doesNotMatch(cardSource, /window\.location\.assign/);
  assert.doesNotMatch(appSource, /registration\.update\(/);
  assert.match(catalogSource, /catalogRequestInflight/);
  assert.match(catalogSource, /Number\.POSITIVE_INFINITY/);
  assert.doesNotMatch(storeSource, /addEventListener\("focus",\s*refreshCatalog/);
});

test("uploaded media remains inside its component frame", () => {
  const mediaStyles = fs.readFileSync(
    path.join(__dirname, "../css/media-frames-store.css"),
    "utf8",
  );
  assert.match(mediaStyles, /\.hero-showcase-media\s*\{[\s\S]*?inset:\s*8px/);
  assert.match(mediaStyles, /\.hero-showcase-card\s*\{[\s\S]*?box-shadow:\s*none\s*!important/);
  assert.match(mediaStyles, /\.gaming-hero-stage,[\s\S]*?overflow:\s*hidden/);
  assert.match(mediaStyles, /\.home-promo-banner\s*>\s*img[\s\S]*?object-fit:\s*cover/);
  assert.match(mediaStyles, /\.pcard \.thumb\s*>\s*img[\s\S]*?object-fit:\s*cover/);
  assert.match(mediaStyles, /\.pcard \.thumb\s*>\s*img[\s\S]*?object-position:\s*50% 50%/);
});

test("valid form fields receive a green state and a direction-safe checkmark", () => {
  const validator = fs.readFileSync(
    path.join(__dirname, "../js/shared/validation/form-validator.js"),
    "utf8",
  );
  const styles = fs.readFileSync(
    path.join(__dirname, "../css/utilities.css"),
    "utf8",
  );
  assert.match(validator, /input\.dataset\.validationState/);
  assert.match(validator, /field\.classList\.toggle\("field-valid", isValid\)/);
  assert.match(styles, /input\[data-validation-state="valid"\][\s\S]*?border-color:\s*#16a34a/);
  assert.match(styles, /background-image:\s*url\("data:image\/svg\+xml/);
  assert.match(styles, /\[dir="ltr"\][\s\S]*?background-position:\s*right 14px center/);
  assert.match(styles, /\.password-input-shell\s*>\s*input\[data-validation-state="valid"\][\s\S]*?background-position:\s*left 14px center/);
});

test("popular brands prefer uploaded logos and show English labels", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/home.jsx"),
    "utf8",
  );
  assert.match(source, /const BRAND_ENGLISH_NAMES/);
  assert.match(source, /const BRAND_BUILTIN_LOGOS/);
  for (const brand of [
    "ASUS", "MSI", "AMD", "INTEL", "CORSAIR", "GIGABYTE", "KINGSTON",
    "ACER", "SAMSUNG", "LOGITECH G", "SEAGATE", "WESTERN DIGITAL",
    "TOSHIBA", "LENOVO", "HYPERX", "RAZER", "DELL", "HP",
    "COOLER MASTER", "DEEPCOOL",
  ]) assert.match(source, new RegExp(`${brand.replace(" ", "\\s+")}.*?public/brands`, "s"));
  assert.match(source, /const logoSource = brand\.logo \|\| BRAND_BUILTIN_LOGOS\[englishName\]/);
  assert.match(source, /if \(logoSource && !failed\)/);
  assert.match(source, /const BRAND_WORDMARK_COLORS/);
  assert.match(source, /className="brand-wordmark-logo"/);
  assert.match(source, /className="brand-fallback-logo"/);
  assert.match(source, /<b dir="ltr" lang="en">\{brandEnglishName\(brand\)\}<\/b>/);
});

test("brand logos remain visible and registration uses the final title", () => {
  const brandCss = fs.readFileSync(
    path.join(__dirname, "../css/home-product-sliders-store.css"),
    "utf8",
  );
  const authPage = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/auth.jsx"),
    "utf8",
  );
  assert.match(brandCss, /\[data-theme=["']dark["']\] \.brand-visual img/);
  assert.match(brandCss, /brightness\(0\) invert\(1\)/);
  assert.match(authPage, />ثبت‌نام<\/h3>/);
  assert.doesNotMatch(authPage, /ثبت‌نام سریع/);
});

test("promotional banners use a compact three-column desktop grid", () => {
  const homeSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/home.jsx"),
    "utf8",
  );
  const gamingSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/gaming.jsx"),
    "utf8",
  );
  const styleSource = fs.readFileSync(
    path.join(__dirname, "../css/home-promo-banners-store.css"),
    "utf8",
  );
  assert.match(homeSource, /setPromoBanners\([\s\S]*?slice\(0, 3\)/);
  assert.match(gamingSource, /placeholderCount=\{3\}/);
  assert.match(styleSource, /grid-template-columns:\s*repeat\(3,/);
});

test("extended storage and laptop-part categories are available in the storefront", () => {
  const catalogSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/core/catalog.jsx"),
    "utf8",
  );
  for (const category of [
    "hdd",
    "laptop-hdd",
    "laptop-battery",
    "laptop-board",
    "cooling-pad",
  ]) {
    assert.match(catalogSource, new RegExp(`id:\\s*["']${category}["']`));
  }
});

test("mega menu gaming links route to the selected gaming category", () => {
  const storeSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/store/store.jsx"),
    "utf8",
  );
  const headerSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/components/header.jsx"),
    "utf8",
  );
  const gamingSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/gaming.jsx"),
    "utf8",
  );
  assert.match(storeSource, /`\/gaming\/\$\{safe\}`/);
  assert.match(storeSource, /name: "gaming", param: parts\[1\] \|\| null/);
  assert.match(headerSource, /nav\("gaming", selectedMegaCategory\.id\)/);
  assert.match(headerSource, /routePath\("gaming", selectedMegaCategory\.id\)/);
  assert.match(headerSource, /gaming_focus_category/);
  assert.match(gamingSource, /getElementById\("gaming-catalog"\)/);
  assert.match(gamingSource, /id="gaming-catalog"/);
  assert.match(gamingSource, /param \? \[param\] : savedFilters\.categories \|\| \[\]/);
});

test("primary navigation exposes home and a gaming-aware shop action", () => {
  const headerSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/components/header.jsx"),
    "utf8",
  );
  assert.match(headerSource, /title: "خانه", target: "home"/);
  assert.match(headerSource, /title: "فروشگاه", target: "shop"/);
  assert.match(headerSource, /const primaryMenuItems = \[/);
  assert.match(headerSource, /item\.target === "home"\s*\? "\/"/);
  assert.match(headerSource, /nav\("home"\)/);
  assert.match(
    headerSource,
    /route\?\.name === "gaming" && item\.target === "shop"/,
  );
  assert.match(headerSource, /isGamingStoreLink \? " gaming-store-nav-link"/);
  assert.match(
    headerSource,
    /isGamingStoreLink\) \{[\s\S]*?sessionStorage\.setItem\("gaming_focus_catalog", "1"\)[\s\S]*?nav\("gaming"\)/,
  );
  const gamingSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/gaming.jsx"),
    "utf8",
  );
  assert.match(gamingSource, /gaming_focus_catalog[\s\S]*?behavior: "smooth"/);
});

test("desktop navigation uses the full-width premium two-row header", () => {
  const headerSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/components/header.jsx"),
    "utf8",
  );
  const headerStyles = fs.readFileSync(
    path.join(__dirname, "../css/header&&menu-store.css"),
    "utf8",
  );
  assert.match(headerSource, /premium-header-row/);
  assert.match(headerSource, /premium-navbar/);
  assert.match(headerStyles, /\.premium-header-row\s*\{[\s\S]*?max-width:\s*none/);
  assert.match(headerStyles, /\.premium-navbar\s*\{[\s\S]*?width:\s*100%/);
  assert.match(headerStyles, /\.premium-navbar \.nav-list\s*\{[\s\S]*?justify-content:\s*center/);
  assert.match(headerStyles, /\.premium-navbar \.nav-item-icon/);
});

test("top navigation categories stay inside the gaming catalog", () => {
  const headerSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/components/header.jsx"),
    "utf8",
  );
  assert.match(
    headerSource,
    /route\?\.name === "gaming" && isProductCategoryLink/,
  );
  assert.match(
    headerSource,
    /`\/gaming\/\$\{encodeURIComponent\(item\.target\)\}`/,
  );
  assert.match(headerSource, /nav\("gaming", item\.target\)/);
  assert.match(
    headerSource,
    /sessionStorage\.setItem\([\s\S]*?"gaming_focus_category"/,
  );
});

test("gaming hero uses a compact modern slider without artificial cutouts", () => {
  const cssSource = fs.readFileSync(
    path.join(__dirname, "../css/gaming-store.css"),
    "utf8",
  );
  const gamingSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/gaming.jsx"),
    "utf8",
  );
  assert.match(gamingSource, /className="gaming-hero-stage gaming-hero-modern"/);
  assert.doesNotMatch(gamingSource, /clipPath/);
  assert.match(cssSource, /height: clamp\(205px, 22vw, 285px\)/);
  assert.match(cssSource, /border-radius: 28px/);
  assert.doesNotMatch(gamingSource, /className="gaming-hero-content"/);
  assert.doesNotMatch(gamingSource, /className="gaming-hero-aura"/);
  assert.match(cssSource, /\.gaming-hero-slider::before\s*\{\s*content: none;/);
});

test("home hero slides contain only imagery and controls", () => {
  const homeSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/home.jsx"),
    "utf8",
  );
  assert.doesNotMatch(homeSource, /className="hero-showcase-copy"/);
  assert.doesNotMatch(homeSource, /className="hero-showcase-overlay"/);
  assert.doesNotMatch(homeSource, /className="hero-showcase-glow"/);
  assert.match(homeSource, /className="hero-slide-controls"/);
});

test("admin presentation controls are wired to home and gaming pages", () => {
  const source = (relativePath) =>
    fs.readFileSync(path.join(__dirname, relativePath), "utf8");
  const settings = source("../js/admin/pages/content-settings.jsx");
  const home = source("../js/storefront/pages/home.jsx");
  const gaming = source("../js/storefront/pages/gaming.jsx");
  const models = source("../../backend/apps/catalog/model_modules/content.py");

  for (const field of [
    "home_hero_enabled",
    "home_hero_interval_seconds",
    "home_quick_links_enabled",
    "gaming_hero_enabled",
    "gaming_heading_title",
    "gaming_categories_enabled",
  ]) {
    assert.match(settings, new RegExp(field));
    assert.match(models, new RegExp(field));
  }
  assert.match(home, /siteSettings\.home_hero_enabled/);
  assert.match(home, /siteSettings\.home_hero_interval_seconds/);
  assert.match(gaming, /siteSettings\.gaming_hero_enabled/);
  assert.match(gaming, /siteSettings\.gaming_heading_title/);
});

test("full backup restore uses a dedicated long-running request timeout", () => {
  const operations = fs.readFileSync(
    path.join(__dirname, "../js/admin/pages/operations.jsx"),
    "utf8",
  );
  assert.match(operations, /timeout:\s*30\s*\*\s*60\s*\*\s*1000/);
  assert.match(operations, /setMessage\(result\.detail\)/);
});

test("full backup restore is atomic and accepts removed legacy fields", () => {
  const backendSource = (relative) => fs.readFileSync(
    path.join(__dirname, "../../backend", relative),
    "utf8",
  );
  const shared = backendSource("apps/common/backup_modules/_shared.py");
  const databaseRestore = backendSource("apps/common/backup_modules/database_restore.py");
  const mediaRestore = backendSource("apps/common/backup_modules/media_restore.py");
  const backupView = backendSource("apps/operations/view_modules/backup.py");

  assert.match(shared, /def ensure_schema_is_current\(\):/);
  assert.match(databaseRestore, /def _objects_for_current_schema\(objects\):/);
  assert.match(databaseRestore, /if key in allowed_fields/);
  assert.match(databaseRestore, /with transaction\.atomic\(using=DEFAULT_DB_ALIAS\):/);
  assert.match(mediaRestore, /from \.validation import _safe_archive_members/);
  assert.match(mediaRestore, /from \.database_restore import _load_objects/);
  assert.doesNotMatch(mediaRestore, /with safety_path\.open\("rb"\)/);
  assert.match(mediaRestore, /_rollback_media\(previous\)/);
  assert.match(backupView, /"recovery_succeeded": exc\.recovered/);
});

test("home hero switches to a horizontal edge-preview layout below 1000px", () => {
  const heroStyles = fs.readFileSync(
    path.join(__dirname, "../css/herosection-store.css"),
    "utf8",
  );
  assert.match(heroStyles, /@media \(max-width: 1000px\)/);
  assert.match(heroStyles, /\.hero-full-layout \.hero-showcase-card\s*\{[\s\S]*?width:\s*92%/);
  assert.match(heroStyles, /hero-showcase-card--previous[\s\S]*?translate\(-150%,\s*-50%\)/);
  assert.match(heroStyles, /hero-showcase-card--next[\s\S]*?translate\(50%,\s*-50%\)/);
});

test("home hero has no decorative background behind its slides", () => {
  const heroStyles = fs.readFileSync(
    path.join(__dirname, "../css/herosection-store.css"),
    "utf8",
  );
  assert.match(heroStyles, /\.hero-showcase\s*\{[\s\S]*?background:\s*transparent;/);
  assert.match(heroStyles, /\.hero-showcase::before\s*\{\s*content:\s*none;/);
});

test("registration requires a confirmed password and reset keeps OTP recovery", () => {
  const authSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/auth.jsx"),
    "utf8",
  );
  const authCss = fs.readFileSync(
    path.join(__dirname, "../css/auth-store.css"),
    "utf8",
  );
  assert.match(authSource, /password_confirm: passwordConfirm/);
  assert.match(authSource, /new_password_confirm: newPasswordConfirm/);
  assert.match(authSource, /requestCode\("RESET_PASSWORD"\)/);
  assert.match(authSource, /رمز عبور را فراموش کرده‌ام/);
  assert.match(authSource, /function PasswordInput/);
  assert.match(authSource, /aria-pressed=\{visible\}/);
  assert.match(authSource, /visible \? "text" : "password"/);
  assert.match(authCss, /\.password-visibility-toggle\s*\{[\s\S]*?right: 8px;[\s\S]*?left: auto;/);
  assert.match(authCss, /\.password-input-shell > input\s*\{[\s\S]*?padding-right: 50px;/);
});

test("mega menu exposes category stats, brands and product recommendation cards", () => {
  const headerSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/components/header.jsx"),
    "utf8",
  );
  const shopSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/shop.jsx"),
    "utf8",
  );
  assert.match(headerSource, /selectedMegaFeatured/);
  assert.match(headerSource, /className="mega-category-stats"/);
  assert.match(headerSource, /className="mega-brand-link"/);
  assert.match(headerSource, /className="mega-product-card"/);
  assert.match(headerSource, /className="mega-product-price"/);
  assert.match(shopSource, /location\.search\)\.get\("brand"\)/);
  assert.match(headerSource, /MEGA_SUBCATEGORY_FALLBACKS/);
  assert.match(headerSource, /selectedMegaSubcategories/);
  assert.match(headerSource, /selectedMegaBrandCounts/);
  assert.match(headerSource, /nav\("shop", category\.id\)/);
  assert.match(headerSource, /className="mega-subcategory-list"/);
  assert.match(headerSource, /className="mega-brand-list"/);
  assert.doesNotMatch(headerSource, /title=\{`مشاهده محصولات/);
  assert.match(headerSource, /nav\("product", product\.slug \|\| product\.id\)/);
  assert.match(headerSource, /setMobileMenu\(false\)/);
});

test("customer orders expose structured status, products and payment summary", () => {
  const source = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/account.jsx"),
    "utf8",
  );
  assert.match(source, /className="glass checkout-current-card"/);
  assert.match(source, /className="customer-order-card"/);
  assert.match(source, /className=\{`order-progress \$\{statusInfo\.tone\}`\}/);
  assert.match(source, /className="customer-order-products"/);
  assert.match(source, /className="customer-order-meta"/);
});

test("cart additions replace React state and drawer renders through a portal", () => {
  const storeSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/store/store.jsx"),
    "utf8",
  );
  const cardSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/components/product-card.jsx"),
    "utf8",
  );
  const drawerSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/components/cart-drawer.jsx"),
    "utf8",
  );
  assert.match(storeSource, /const addToCart = \(product, options = \{\}\)/);
  assert.match(storeSource, /new CartEngine\(\[\.\.\.cart\.items\]\)/);
  assert.match(cardSource, /addToCart\(p, \{ qty: 1 \}\)/);
  assert.doesNotMatch(cardSource, /cart\.add\(/);
  assert.match(drawerSource, /ReactDOM\.createPortal\(/);
  assert.match(drawerSource, /\(I\[it\.icon\] \|\| I\.cpu\)/);
});

test("successful referrals are visible to customers and manageable by admins", () => {
  const accountSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/account.jsx"),
    "utf8",
  );
  const adminSource = fs.readFileSync(
    path.join(__dirname, "../js/admin/pages/enterprise.jsx"),
    "utf8",
  );
  assert.match(accountSource, /loyalty\.referral_history\.map/);
  assert.match(accountSource, /invited_phone/);
  assert.match(accountSource, /inviter_points_awarded/);
  assert.match(adminSource, /\/auth\/admin\/referrals\//);
  assert.match(adminSource, /گزارش دعوت‌های موفق/);
  assert.match(adminSource, /readOnly: true/);
});

test("referral registration uses the structured API client instead of parsing HTML as JSON", () => {
  const authSource = fs.readFileSync(
    path.join(__dirname, "../js/storefront/pages/auth.jsx"),
    "utf8",
  );
  assert.match(authSource, /accountApi\("\/auth\/otp\/verify\/"/);
  assert.doesNotMatch(authSource, /const data = await response\.json\(\)/);
});
