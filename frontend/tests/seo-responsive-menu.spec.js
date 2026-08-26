const { test, expect } = require("@playwright/test");

const product = {
  id: "seo-product-id",
  name: "کارت گرافیک تست سئو",
  slug: "seo-gpu",
  sku: "SEO-GPU-1",
  category_name: "کارت گرافیک",
  brand_name: "ASUS",
  price: 25000000,
  final_price: 24000000,
  stock: 4,
  rating: 4.8,
  approved_reviews_count: 12,
  seo_title: "خرید کارت گرافیک تست سئو | فروشگاه 82",
  seo_description: "توضیحات اختصاصی و بهینه‌شده محصول برای موتورهای جستجو.",
  specifications: { حافظه: "16GB" },
  gallery: [],
  questions: [],
  variants: [],
  price_history: [],
  is_active: true,
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/catalog/**", async (route) => {
    const url = route.request().url();
    if (url.includes("site-settings")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [{ site_name: "فروشگاه 82" }] }) });
    if (url.includes("categories")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [{ name: "کارت گرافیک", slug: "gpu", icon: "gpu", is_active: true, seo_title: "خرید کارت گرافیک", seo_description: "فروش کارت گرافیک" }] }) });
    if (url.includes("products")) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [product] }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ results: [] }) });
  });
});

test("product page publishes one complete product schema", async ({ page }) => {
  await page.goto("/product/seo-gpu");
  await expect(page).toHaveTitle("خرید کارت گرافیک تست سئو | فروشگاه 82");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", product.seo_description);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "http://127.0.0.1:5500/product/seo-gpu");
  const productSchemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.flatMap((node) => { try { const value = JSON.parse(node.textContent); return (Array.isArray(value) ? value : [value]).filter((item) => item["@type"] === "Product"); } catch { return []; } }));
  expect(productSchemas).toHaveLength(1);
  expect(productSchemas[0].offers.availability).toBe("https://schema.org/InStock");
});

test("mobile mega menu stays above its overlay and is not blurred", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 760 });
  await page.goto("/");
  await page.getByRole("button", { name: "بازکردن منوی اصلی" }).click();
  await page.getByRole("button", { name: "همه دسته‌بندی‌ها" }).click();
  await expect(page.locator(".mega")).toBeVisible();
  const layers = await page.evaluate(() => ({
    header: Number(getComputedStyle(document.querySelector("header.hdr")).zIndex),
    navbar: Number(getComputedStyle(document.querySelector(".navbar")).zIndex),
    overlay: Number(getComputedStyle(document.querySelector(".mega-overlay")).zIndex),
    blur: getComputedStyle(document.querySelector(".mega")).backdropFilter,
  }));
  expect(layers.header).toBeGreaterThan(layers.overlay);
  expect(layers.navbar).toBeGreaterThan(layers.overlay);
  expect(["none", ""]).toContain(layers.blur);
});
