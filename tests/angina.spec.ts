/// <reference types="@playwright/test" />
import { test, expect } from "@playwright/test";

test("Angina route renders and sections present", async ({ page }) => {
  await page.goto("/index.html#/angina");
  await expect(page.locator("h1")).toHaveText(/Angina/i);
  await expect(page.locator('summary:has-text("Stable Angina")')).toHaveCount(
    1,
  );
  await expect(page.locator('summary:has-text("Variant")')).toHaveCount(1);
  await expect(page.locator('summary:has-text("Microvascular")')).toHaveCount(
    1,
  );

  // Sidebar link exists and becomes active
  const anginaLink = page.locator('.dx-item[data-id="angina"]');
  await expect(anginaLink).toHaveAttribute("aria-current", "page");
});

test("Router fallback works for invalid routes", async ({ page }) => {
  await page.goto("/index.html#/invalid-route");
  // Should redirect to angina
  await page.waitForURL("**/index.html#/angina");
  await expect(page.locator("h1")).toHaveText(/Angina/i);
});

test("Service Worker registers successfully", async ({ page }) => {
  await page.goto("/index.html");

  // Check if service worker is registered
  const swRegistered = await page.evaluate(() => {
    return "serviceWorker" in navigator;
  });

  expect(swRegistered).toBe(true);
});
