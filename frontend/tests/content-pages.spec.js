import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/catalog/**", async (route) => {
    const url = route.request().url();
    if (url.includes("site-settings")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ results: [{ site_name: "فروشگاه 82" }] }),
      });
      return;
    }
    if (url.includes("store-stats")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ products: 0, customers: 0, support: "۲۴/۷" }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ results: [] }),
    });
  });
});

for (const pageInfo of [
  ["/about", "درباره فروشگاه 82"],
  ["/contact", "تماس با ما"],
  ["/faq", "سؤالات متداول"],
  ["/returns", "شرایط بازگشت کالا"],
  ["/gaming", "دنیای محصولات گیمینگ"],
]) {
  test(`${pageInfo[0]} opens directly`, async ({ page }) => {
    await page.goto(pageInfo[0]);
    await expect(
      page.getByRole("heading", { name: pageInfo[1], level: 1 }),
    ).toBeVisible();
  });
}

test("gaming menu entry is visible and uses the clean route", async ({ page }) => {
  await page.goto("/");
  const gamingLink = page.getByRole("link", { name: /محصولات گیمینگ/ }).first();
  await expect(gamingLink).toBeVisible();
  await expect(gamingLink).toHaveAttribute("href", "/gaming");
  await expect(gamingLink).toHaveAttribute("target", "_blank");
  await expect(gamingLink).toHaveAttribute("rel", "noopener noreferrer");
});

test("footer content links use clean URLs", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "درباره ما" })).toHaveAttribute(
    "href",
    "/about",
  );
  await expect(page.getByRole("link", { name: "درباره ما" })).toHaveAttribute(
    "target",
    "_blank",
  );
  await expect(page.getByRole("link", { name: "تماس با ما" })).toHaveAttribute(
    "href",
    "/contact",
  );
  await expect(
    page.getByRole("link", { name: "سؤالات متداول" }),
  ).toHaveAttribute("href", "/faq");
  await expect(
    page.getByRole("link", { name: "شرایط بازگشت" }),
  ).toHaveAttribute("href", "/returns");
  for (const name of [
    "صفحه اصلی",
    "فروشگاه",
    "تخفیف‌ها",
    "درباره ما",
    "پیگیری سفارش",
    "شرایط بازگشت",
    "سؤالات متداول",
    "تماس با ما",
  ]) {
    await expect(page.getByRole("link", { name, exact: true })).toHaveAttribute(
      "target",
      "_blank",
    );
  }
});
