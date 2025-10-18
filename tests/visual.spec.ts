/// <reference types="@playwright/test" />
import { test, expect } from "@playwright/test";

/**
 * Visual Regression Tests
 *
 * These tests capture screenshots of critical UI components and compare them
 * against baseline snapshots. If differences are detected, the test will fail
 * and show a visual diff.
 *
 * To update snapshots after intentional UI changes:
 * 1. Review the diff output carefully
 * 2. Run: npm run test:visual:update
 * 3. Commit the new snapshots
 *
 * IMPORTANT: Snapshots should be stable and not include:
 * - Timestamps
 * - Random IDs
 * - Dynamic content that changes on every run
 */

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Wait for any animations to complete
    await page.waitForTimeout(500);

    // Remove any dynamic timestamps or IDs that would cause snapshot instability
    await page.evaluate(() => {
      // Remove any elements with timestamps
      document.querySelectorAll("[data-timestamp]").forEach((el) => {
        el.removeAttribute("data-timestamp");
      });

      // Stabilize any random IDs
      document.querySelectorAll('[id^="random-"]').forEach((el, index) => {
        el.id = `stable-id-${index}`;
      });
    });
  });

  // ============================================================
  // SIDEBAR VISUAL TESTS
  // ============================================================

  test("Diagnosis sidebar visual snapshot", async ({ page }) => {
    // Locate the diagnosis sidebar
    const sidebar = page.locator("#dx-rail");
    await expect(sidebar).toBeVisible();

    // Hide any dynamic content that changes frequently
    await page.evaluate(() => {
      // Hide search results if they're dynamic
      const searchResults = document.querySelector("#search-results");
      if (searchResults) {
        (searchResults as HTMLElement).style.display = "none";
      }
    });

    // Take a snapshot of the sidebar
    await expect(sidebar).toHaveScreenshot("sidebar-diagnosis.png", {
      maxDiffPixels: 100, // Allow small rendering differences
      threshold: 0.2, // 20% threshold for pixel differences
    });
  });

  test("Diagnosis sidebar with search input visible", async ({ page }) => {
    const sidebar = page.locator("#dx-rail");
    await expect(sidebar).toBeVisible();

    // Focus on search to show it's interactive (but don't type to keep stable)
    const searchInput = page.locator("#search");
    if (await searchInput.isVisible()) {
      await searchInput.focus();

      // Take snapshot with focused search
      await expect(sidebar).toHaveScreenshot(
        "sidebar-diagnosis-search-focused.png",
        {
          maxDiffPixels: 100,
          threshold: 0.2,
        },
      );
    }
  });

  test("Sidebar header structure", async ({ page }) => {
    const sidebarHeader = page.locator(".dx-rail-header");
    await expect(sidebarHeader).toBeVisible();

    // Snapshot just the header for more granular testing
    await expect(sidebarHeader).toHaveScreenshot("sidebar-header.png", {
      maxDiffPixels: 50,
      threshold: 0.2,
    });
  });

  // ============================================================
  // NOTE OUTPUT AREA VISUAL TESTS
  // ============================================================

  test("Note output area empty state", async ({ page }) => {
    // Locate the output textarea
    const outputArea = page.locator("#rendered-output");
    await expect(outputArea).toBeVisible();

    // Ensure it's empty
    const value = await outputArea.inputValue();
    if (value) {
      // Clear it
      await page.evaluate(() => {
        const textarea = document.querySelector(
          "#rendered-output",
        ) as HTMLTextAreaElement;
        if (textarea) textarea.value = "";
      });
    }

    // Take snapshot of empty state
    await expect(outputArea).toHaveScreenshot("output-area-empty.png", {
      maxDiffPixels: 50,
      threshold: 0.2,
    });
  });

  test("Note output area with sample content", async ({ page }) => {
    const outputArea = page.locator("#rendered-output");
    await expect(outputArea).toBeVisible();

    // Fill with stable sample content (no dates/times)
    // Use JavaScript to set value since textarea is readonly
    const sampleOutput = `PATIENT INFORMATION:
Name: [Patient Name]
Age: 45 years old
Gender: Male

CHIEF COMPLAINT:
Chest pain

HISTORY OF PRESENT ILLNESS:
Patient presents with chest pain for 2 hours.
Pain is substernal, non-radiating.
Associated with shortness of breath.

VITAL SIGNS:
BP: 145/92 mmHg
HR: 88 bpm
RR: 18 breaths/min
Temp: 98.6 F
SpO2: 96%

ASSESSMENT:
1. Chest pain, likely cardiac in origin
2. Hypertension

PLAN:
1. EKG
2. Troponin levels
3. Aspirin 325mg PO
4. Continue monitoring`;

    await page.evaluate((content) => {
      const textarea = document.querySelector(
        "#rendered-output",
      ) as HTMLTextAreaElement;
      if (textarea) textarea.value = content;
    }, sampleOutput);

    // Wait for any syntax highlighting or formatting to complete
    await page.waitForTimeout(300);

    // Take snapshot with content
    await expect(outputArea).toHaveScreenshot("output-area-with-content.png", {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test("Note output panel full view", async ({ page }) => {
    // Capture the entire output panel including buttons
    const outputPanel = page.locator("#template-content");

    if (await outputPanel.isVisible()) {
      // Add stable content to output using JavaScript
      await page.evaluate(() => {
        const textarea = document.querySelector(
          "#rendered-output",
        ) as HTMLTextAreaElement;
        if (textarea) textarea.value = "Sample output text for visual testing";
      });

      await page.waitForTimeout(300);

      // Snapshot the full panel
      await expect(outputPanel).toHaveScreenshot("output-panel-full.png", {
        maxDiffPixels: 150,
        threshold: 0.2,
      });
    }
  });

  test("Clinical note input panel visual", async ({ page }) => {
    // Test the input side of the note parser
    const inputPanel = page.locator("#clinical-note-input-panel");
    await expect(inputPanel).toBeVisible();

    // Clear any existing input to ensure stable state
    const inputTextarea = page.locator("#vs-paste");
    await inputTextarea.fill("");

    // Take snapshot
    await expect(inputPanel).toHaveScreenshot("input-panel-empty.png", {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test("Clinical note input panel with placeholder visible", async ({
    page,
  }) => {
    const inputPanel = page.locator("#clinical-note-input-panel");
    await expect(inputPanel).toBeVisible();

    const inputTextarea = page.locator("#vs-paste");
    await inputTextarea.fill("");

    // Blur to show placeholder
    await inputTextarea.blur();
    await page.waitForTimeout(200);

    await expect(inputPanel).toHaveScreenshot("input-panel-placeholder.png", {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  // ============================================================
  // BUTTON STATES
  // ============================================================

  test("Parse and Clear buttons visual state", async ({ page }) => {
    const parseButton = page.locator("#vs-parse");
    const clearButton = page.locator("#vs-clear");

    await expect(parseButton).toBeVisible();
    await expect(clearButton).toBeVisible();

    // Snapshot button group
    const buttonContainer = page.locator(".button-group");
    if (await buttonContainer.isVisible()) {
      await expect(buttonContainer).toHaveScreenshot(
        "buttons-parse-clear.png",
        {
          maxDiffPixels: 50,
          threshold: 0.2,
        },
      );
    }
  });

  // ============================================================
  // FULL PAGE LAYOUT TESTS
  // ============================================================

  test("Full page layout with sidebar and main content", async ({ page }) => {
    // Hide dynamic elements that change frequently
    await page.evaluate(() => {
      // Hide search results
      const searchResults = document.querySelector("#search-results");
      if (searchResults) {
        (searchResults as HTMLElement).style.display = "none";
      }

      // Clear any user input to ensure clean state
      const inputs = document.querySelectorAll('input[type="text"], textarea');
      inputs.forEach((input) => {
        (input as HTMLInputElement | HTMLTextAreaElement).value = "";
      });
    });

    // Take full page snapshot
    await expect(page).toHaveScreenshot("full-page-layout.png", {
      fullPage: true,
      maxDiffPixels: 500, // More tolerance for full page
      threshold: 0.2,
    });
  });
});
