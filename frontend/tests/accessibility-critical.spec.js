const { test, expect } = require("@playwright/test");

test("storefront has its primary landmarks and supports keyboard focus", async ({ page }) => {
  await page.goto("/html/index.html");
  await expect(page.locator("main")).toBeVisible();
  await expect(page.locator("header")).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  const invalidImages = await page.locator("img:not([alt])").count();
  expect(invalidImages).toBe(0);
});

test("a failed catalog request is contained without a blank screen", async ({ page }) => {
  await page.route("**/api/catalog/**", (route) => route.abort("failed"));
  await page.goto("/html/index.html");
  await expect(page.locator("#root")).not.toBeEmpty();
  await expect(page.locator("main")).toBeVisible();
});
