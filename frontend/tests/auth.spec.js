const { test, expect } = require("@playwright/test");

test("login page offers password, otp and forgot password", async ({
  page,
}) => {
  await page.route("**/api/v1/catalog/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"results":[]}',
    }),
  );
  await page.goto("/auth");
  await expect(page.getByRole("button", { name: "شماره و رمز" })).toBeVisible();
  await expect(page.getByRole("button", { name: "شماره و کد" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "رمز عبور را فراموش کرده‌ام" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "ثبت‌نام" })).toBeVisible();
});

test("admin page offers password and otp login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page.getByRole("button", { name: "شماره و رمز" })).toBeVisible();
  await expect(page.getByRole("button", { name: "شماره و کد" })).toBeVisible();
});

test("registration shows a precise error below every invalid field", async ({
  page,
}) => {
  await page.route("**/api/v1/catalog/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"results":[]}',
    }),
  );
  await page.goto("/auth");
  await page.getByRole("button", { name: "ثبت‌نام", exact: true }).click();
  await page.getByLabel("نام", { exact: true }).fill("مهدی82");
  await page.getByLabel("شماره موبایل", { exact: true }).fill("09123");
  await page.getByLabel("کد دعوت (اختیاری)").fill("ABC");

  await expect(page.getByText(/نام باید ۲ تا ۸۰ حرف و بدون عدد باشد/)).toBeVisible();
  await expect(page.getByText(/09123456789/)).toBeVisible();
  await expect(page.getByText(/کد دعوت باید ۸ تا ۱۶/)).toBeVisible();
});

test("login validates phone and password separately", async ({ page }) => {
  await page.route("**/api/v1/catalog/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: '{"results":[]}',
    }),
  );
  await page.goto("/auth");
  await page.getByRole("button", { name: "ورود با رمز" }).click();
  await expect(page.getByText(/شماره موبایل را به‌شکل/)).toBeVisible();
  await expect(page.getByText("رمز عبور را وارد کنید.")).toBeVisible();
});
