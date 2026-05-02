import { test, expect } from "@playwright/test";

test("homepage loads", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("main")).toBeVisible();
});

test("skip link is present and keyboard-focusable", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const skipLink = page.locator('a[href="#main-content"]');
  await expect(skipLink).toBeFocused();
});

test("blog listing page loads", async ({ page }) => {
  await page.goto("/blog");
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("main")).toBeVisible();
});

test("events listing page loads", async ({ page }) => {
  await page.goto("/events");
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("main")).toBeVisible();
});

test("programs listing page loads", async ({ page }) => {
  await page.goto("/programs");
  await expect(page).toHaveTitle(/.+/);
  await expect(page.locator("main")).toBeVisible();
});

test("admin login page redirects unauthenticated users", async ({ page }) => {
  await page.goto("/admin");
  // Should redirect to login
  await expect(page).toHaveURL(/login/);
});
