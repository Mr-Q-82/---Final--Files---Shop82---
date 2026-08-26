const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relative) => fs.readFileSync(path.join(__dirname, "..", relative), "utf8");

test("desk, chair and mouse-pad exist in storefront categories and navigation", () => {
  const defaults = read("js/storefront/core/catalog/default-data.jsx");
  const header = read("js/storefront/components/header/header/part-01.jsx");
  const icons = read("js/storefront/core/catalog/icons.jsx");
  for (const slug of ["desk", "chair", "mouse-pad"]) {
    assert.match(defaults, new RegExp(`id: "${slug}"`));
    assert.match(header, new RegExp(`target: "${slug}"`));
  }
  assert.match(icons, /desk: \(p\)/);
  assert.match(icons, /chair: \(p\)/);
  assert.match(icons, /mousepad: \(p\)/);
});

test("new categories participate in search, usage profiles and offer palettes", () => {
  const search = read("js/storefront/services/product-selectors.jsx");
  const usages = read("js/storefront/core/catalog/usage-profiles.jsx");
  const offers = read("js/storefront/pages/home/product-carousels.jsx");
  assert.match(search, /"موس پد"/);
  for (const key of ["desk", "chair", "mousepad"]) {
    assert.match(usages, new RegExp(`${key}: \\[\\[`));
  }
  assert.match(offers, /"mouse-pad": \{ from:/);
  assert.match(search, /featuredBalanced\(products = PRODUCTS, limit = 12\)/);
});

test("data migration creates normal and gaming products with full commerce features", () => {
  const migration = read("../backend/apps/catalog/migrations/0046_desk_chair_mousepad_catalog.py");
  for (const slug of ["desk", "chair", "mouse-pad"]) {
    assert.match(migration, new RegExp(`"${slug}"`));
  }
  assert.match(migration, /\(False, config\["normal"\]\), \(True, config\["gaming"\]\)/);
  assert.match(migration, /FlashSale\.objects\.update_or_create/);
  assert.match(migration, /Recommendation\.objects\.update_or_create/);
  assert.match(migration, /"is_featured": True/);
  assert.match(migration, /"available_colors":/);
  assert.match(migration, /"shipping_options":/);
});

test("follow-up migration guarantees sixty manageable products per category", () => {
  const migration = read("../backend/apps/catalog/migrations/0047_ensure_sixty_furniture_products.py");
  assert.match(migration, /TARGET_PER_CATALOG = 30/);
  assert.match(migration, /\(\(False, "NORMAL"\), \(True, "GAMING"\)\)/);
  assert.match(migration, /Product\.objects\.create\(/);
  assert.match(migration, /missing = max\(0, TARGET_PER_CATALOG - existing\)/);
  assert.match(migration, /is_featured=created < 8/);
  assert.match(migration, /FlashSale\.objects\.get_or_create/);
});
