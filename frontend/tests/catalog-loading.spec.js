const { test, expect } = require("@playwright/test");

test("automatic product sliders never scroll the page vertically", async ({
  page,
}) => {
  const source = await page.request.get("/js/storefront/pages/home.jsx");
  const code = await source.text();
  expect(code).not.toContain("scrollIntoView");
  expect(code).toContain("track.scrollBy");
});

test("homepage product sliders support mouse drag", async ({ page }) => {
  const source = await page.request.get("/js/storefront/pages/home.jsx");
  const code = await source.text();
  expect(code).toContain("function useDragToScroll");
  expect(code).toContain('track.classList.add("is-dragging")');
  expect(code).toContain("track.scrollLeft -= movement");
  expect(code.indexOf("totalMovement < 9")).toBeLessThan(
    code.indexOf("track.setPointerCapture(pointerId)"),
  );
  expect(code).toContain("moveLoopTrack");
  expect(code).toContain("...products, ...products, ...products");
  expect(code).toContain("function BrandCarousel");
  expect(code).toContain("بازدیدهای اخیر و محصولات مشابه");
});

test("shop renders products that arrive after the first paint", async ({
  page,
}) => {
  let productRequests = 0;
  await page.route("**/api/v1/catalog/**", async (route) => {
    const url = route.request().url();
    let body = { results: [] };
    if (url.includes("/categories/")) {
      body = {
        results: [
          {
            id: "1",
            name: "لپ‌تاپ",
            slug: "laptop",
            icon: "laptop",
            subcategories: [],
            is_active: true,
          },
        ],
      };
    } else if (url.includes("/products/")) {
      productRequests += 1;
      await new Promise((resolve) => setTimeout(resolve, 350));
      body = {
        results: [
          {
            id: "p1",
            sku: "LAP-DELAY",
            slug: "laptop-delayed",
            name: "لپ‌تاپ تست بارگذاری",
            category_name: "لپ‌تاپ",
            brand_name: "ایسوس",
            price: 1000000,
            final_price: 750000,
            stock: 4,
            discount_percent: 0,
            rating: 0,
            sold_count: 0,
            gallery: [],
            variants: [],
            available_colors: [],
            shipping_options: [],
            active_flash_sale: {
              id: "sale-1",
              title: "شگفت‌انگیز تست",
              discount_percent: 25,
              special_price: 750000,
              ends_at: "2099-08-03T12:00:00Z",
            },
          },
        ],
      };
    } else if (url.includes("/brands/")) {
      body = {
        results: [{ id: "b1", name: "ایسوس", slug: "asus", is_active: true }],
      };
    } else if (url.includes("/menu-items/")) {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ detail: "temporary menu error" }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });

  await page.goto("/shop");
  await expect(page.getByText("لپ‌تاپ تست بارگذاری")).toBeVisible();
  await expect(page.locator(".shop-showcase")).toBeVisible();
  await expect(page.locator(".shop-showcase-products")).toHaveCount(1);
  await expect(page.locator(".shop-top-slider")).toBeVisible();
  await expect(page.locator(".shop-showcase .amazing-countdown")).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: "لپ‌تاپ تست بارگذاری" }).first(),
  ).toHaveAttribute("target", "_blank");
  await page.evaluate(() => {
    for (let index = 0; index < 5; index += 1)
      window.dispatchEvent(new Event("focus"));
  });
  await page.waitForTimeout(300);
  expect(productRequests).toBe(1);
  const productLink = page.locator(".shop-showcase-product").first();
  const [productPage] = await Promise.all([
    page.waitForEvent("popup"),
    productLink.click(),
  ]);
  await expect(productPage).toHaveURL(/\/product\/laptop-delayed/);
  await expect(
    productPage.getByText("لپ‌تاپ تست بارگذاری", { exact: true }).first(),
  ).toBeVisible({ timeout: 1000 });
});

test("shop retries a temporary product API failure", async ({ page }) => {
  let productRequests = 0;
  await page.route("**/api/v1/catalog/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/products/")) {
      productRequests += 1;
      if (productRequests < 3) {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ detail: "temporary database error" }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          results: [
            {
              id: "p2",
              sku: "RETRY-OK",
              slug: "retry-product",
              name: "محصول بازیابی‌شده",
              category_name: "لپ‌تاپ",
              brand_name: "ایسوس",
              price: 2000000,
              final_price: 2000000,
              stock: 2,
              gallery: [],
              variants: [],
              available_colors: [],
              shipping_options: [],
            },
          ],
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [] }),
    });
  });

  await page.goto("/shop");
  await expect(page.getByText("محصول بازیابی‌شده")).toBeVisible({
    timeout: 7000,
  });
  expect(productRequests).toBe(3);
});

test("shop and gaming routes load strictly separated catalogs", async ({
  page,
}) => {
  const requestedScopes = [];
  const product = (sku, name, isGaming) => ({
    id: sku,
    sku,
    slug: sku.toLowerCase(),
    name,
    category_name: "ماوس",
    brand_name: "تست",
    price: 1000000,
    final_price: 1000000,
    stock: 3,
    is_gaming: isGaming,
    gallery: [],
    variants: [],
    available_colors: [],
    shipping_options: [],
  });

  await page.route("**/api/v1/catalog/**", async (route) => {
    const url = new URL(route.request().url());
    let results = [];
    if (url.pathname.includes("/products/")) {
      const scope = url.searchParams.get("is_gaming");
      requestedScopes.push(scope);
      results =
        scope === "true"
          ? [product("GAM-MOUSE-001", "ماوس فقط گیمینگ", true)]
          : [
              product("NORMAL-MOUSE-001", "ماوس فقط معمولی", false),
              // A stale API row must still be rejected from the normal shop.
              product("GAM-STALE-001", "محصول گیمینگ قدیمی", false),
            ];
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results }),
    });
  });

  await page.goto("/shop");
  await expect(page.getByText("ماوس فقط معمولی")).toBeVisible();
  await expect(page.getByText("محصول گیمینگ قدیمی")).toHaveCount(0);
  expect(requestedScopes).toContain("false");

  await page.goto("/gaming");
  await expect(page.getByText("ماوس فقط گیمینگ").first()).toBeVisible();
  await expect(page.getByText("ماوس فقط معمولی")).toHaveCount(0);
  expect(requestedScopes).toContain("true");
});
