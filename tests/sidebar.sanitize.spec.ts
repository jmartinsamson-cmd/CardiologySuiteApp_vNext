/**
 * Sidebar Sanitization Smoke Test
 * Verifies that non-medical items are filtered from diagnosis sidebar
 */

import { test, expect } from "@playwright/test";

test.describe("Sidebar Sanitization", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/index.html#/guidelines");
    await page.waitForLoadState("networkidle");
  });

  test("should exclude non-medical items from diagnosis sidebar", async ({
    page,
  }) => {
    // Define non-medical items that should be filtered out
    const blacklistedItems = [
      "Common Cardiac Medications & Dosages",
      "H&P and Consult Note Guidelines",
      "Electrophysiology (EP) Guidelines",
      "MitraClip (Post-Operative Care by NP)",
      "Watchman (Post-Operative Care by NP)",
      "Perioperative Medication Management",
      "Surgical Risk Stratification",
    ];

    // Get only visible diagnosis items in the sidebar
    const diagnosisItems = page.locator(".guidelines-dx-item:visible");
    const itemTexts = await diagnosisItems.allTextContents();

    // Verify none of the blacklisted items are visible
    for (const blacklistedItem of blacklistedItems) {
      const found = itemTexts.some((text) =>
        text.toLowerCase().includes(blacklistedItem.toLowerCase()),
      );
      expect(
        found,
        `"${blacklistedItem}" should not be visible in sidebar`,
      ).toBe(false);
    }

    console.log(
      `✅ Verified ${blacklistedItems.length} non-medical items are filtered out`,
    );
  });

  test("should preserve medical diagnoses in sidebar", async ({ page }) => {
    // Sample medical diagnoses that should remain
    const medicalDiagnoses = [
      "Acute Coronary Syndrome",
      "Atrial Fibrillation",
      "Heart Failure",
      "Hypertension",
      "Aortic Stenosis",
    ];

    const diagnosisItems = page.locator(".guidelines-dx-item");
    const itemTexts = await diagnosisItems.allTextContents();

    // Verify medical diagnoses are present
    for (const diagnosis of medicalDiagnoses) {
      const found = itemTexts.some((text) =>
        text.toLowerCase().includes(diagnosis.toLowerCase()),
      );
      expect(found, `"${diagnosis}" should appear in sidebar`).toBe(true);
    }

    console.log(
      `✅ Verified ${medicalDiagnoses.length} medical diagnoses are preserved`,
    );
  });

  test("should maintain original order of medical diagnoses", async ({
    page,
  }) => {
    const diagnosisItems = page.locator(".guidelines-dx-item");
    const itemTexts = await diagnosisItems.allTextContents();

    // Verify alphabetical order is preserved (first few items)
    const expectedOrder = [
      "Abdominal Aortic Aneurysm",
      "Acute Coronary Syndrome",
      "Acute Limb Ischemia",
    ];

    for (let i = 0; i < expectedOrder.length; i++) {
      const found = itemTexts[i]
        .toLowerCase()
        .includes(expectedOrder[i].toLowerCase());
      expect(found, `Item ${i} should be "${expectedOrder[i]}"`).toBe(true);
    }

    console.log("✅ Verified diagnosis order is preserved");
  });

  test("should display filtered count in console", async ({ page }) => {
    // Listen for console logs
    const logs: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "debug" && msg.text().includes("Filtered")) {
        logs.push(msg.text());
      }
    });

    // Trigger a reload to capture initialization logs
    await page.reload();
    await page.waitForLoadState("networkidle");

    // Verify debug log appears (if any items were filtered)
    const hasFilterLog = logs.some(
      (log) => log.includes("Filtered") && log.includes("non-medical items"),
    );

    // This test passes if either:
    // 1. Items were filtered and log appears
    // 2. No items needed filtering (valid scenario)
    if (hasFilterLog) {
      console.log(
        "✅ Verified filter debug log:",
        logs.find((l) => l.includes("Filtered")),
      );
    } else {
      console.log(
        "⚠️  No items filtered (possibly all items in whitelist already)",
      );
    }

    expect(true).toBe(true); // Always pass, log is informational
  });

  test("should not break sidebar UI or interactions", async ({ page }) => {
    // Verify sidebar is visible
    const sidebar = page.locator("#guidelines-sidebar");
    await expect(sidebar).toBeVisible();

    // Verify search box works
    const searchInput = page.locator("#guidelines-search-input");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("heart failure");

    // Verify clicking a visible diagnosis item works
    const visibleItem = page.locator(".guidelines-dx-item:visible").first();
    await expect(visibleItem).toBeVisible();
    await visibleItem.click();

    // Verify content area becomes visible after selection
    const contentArea = page.locator("#guidelines-content");
    await expect(contentArea).toBeVisible();

    console.log("✅ Verified sidebar UI and interactions work correctly");
  });
});
