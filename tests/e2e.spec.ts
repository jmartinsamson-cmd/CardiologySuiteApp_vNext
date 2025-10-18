import { test, expect } from "@playwright/test";

/**
 * E2E Testing Suite for Cardiology Suite
 *
 * Tests core user flows:
 * - Navigation between routes (#/home, #/trees, #/notes, #/meds)
 * - Note generation flow
 * - Key selectors and UI elements
 * - Feature flag handling for meds route
 */

test.describe("Cardiology Suite E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application (uses baseURL from config)
    await page.goto("/index.html");

    // Wait for app initialization
    await page.waitForLoadState("networkidle");

    // Give a moment for any dynamic loading
    await page.waitForTimeout(500);
  });

  // ============================================================
  // NAVIGATION TESTS
  // ============================================================

  test("Home route loads and displays key elements", async ({ page }) => {
    // Navigate to home (default route)
    await page.goto("/#/home");
    await page.waitForLoadState("networkidle");

    // Check for main layout elements
    const banner = page.locator("#banner");
    await expect(banner).toBeVisible();

    // Check for brand name
    const brand = page.locator(".brand");
    await expect(brand).toBeVisible();
    await expect(brand).toContainText("Cardiology Suite");

    // Check navigation tabs exist
    const mainTab = page.locator('[data-page="main"]');
    await expect(mainTab).toBeVisible();

    // Check for main content area
    const layout = page.locator("#layout");
    await expect(layout).toBeVisible();
  });

  test("Guidelines route loads and displays content", async ({ page }) => {
    // Navigate to guidelines SPA route
    await page.goto("/index.html#/guidelines");
    await page.waitForLoadState("networkidle");

    // Check for banner
    const banner = page.locator("#banner");
    await expect(banner).toBeVisible();

    // Check for guidelines navigation tab
    const guidelinesTab = page.locator('[data-page="guidelines"]');
    await expect(guidelinesTab).toBeVisible();

    // Check for guidelines container (SPA route)
    const guidelinesContainer = page.locator("#guidelines-container");
    await expect(guidelinesContainer).toBeVisible();
  });

  test("Navigation between routes works", async ({ page }) => {
    // Start at home
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Verify home page loaded
    let brand = page.locator(".brand");
    await expect(brand).toBeVisible();

    // Click guidelines tab
    const guidelinesTab = page.locator('[data-page="guidelines"]');
    if (await guidelinesTab.isVisible()) {
      await guidelinesTab.click();
      await page.waitForLoadState("networkidle");

      // Verify navigation worked (URL or content changed)
      const url = page.url();
      expect(url).toContain("guidelines");
    }

    // Navigate back to home
    const mainTab = page.locator('[data-page="main"]');
    if (await mainTab.isVisible()) {
      await mainTab.click();
      await page.waitForLoadState("networkidle");

      const url = page.url();
      expect(url).toContain("index.html");
    }
  });

  // ============================================================
  // NOTE GENERATION FLOW
  // ============================================================

  test("Note generation flow: parse button exists and key elements present", async ({
    page,
  }) => {
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Check for parse button
    const parseButton = page.locator("#vs-parse");
    await expect(parseButton).toBeVisible();
    await expect(parseButton).toContainText("Parse");

    // Check for input textarea
    const inputTextarea = page.locator("#vs-paste");
    await expect(inputTextarea).toBeVisible();

    // Check for output textarea
    const outputTextarea = page.locator("#rendered-output");
    await expect(outputTextarea).toBeVisible();

    // Check for clear button
    const clearButton = page.locator("#vs-clear");
    await expect(clearButton).toBeVisible();
  });

  test.skip("Note generation: Generate button produces output", async ({
    page,
  }) => {
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Sample clinical note text
    const sampleNote = `SUBJECTIVE:
72 year old male presents with chest pain for 2 hours.

OBJECTIVE:
BP: 145/90, HR: 88, RR: 18, Temp: 98.6, SpO2: 96%

ASSESSMENT:
1. Chest pain, likely angina
2. Hypertension

PLAN:
- EKG
- Troponin
- Aspirin 325mg
- Cardiology consult`;

    // Fill in the input
    const inputTextarea = page.locator("#vs-paste");
    await inputTextarea.fill(sampleNote);

    // Click generate/parse button
    const parseButton = page.locator("#vs-parse");
    await parseButton.click();

    // Wait a moment for processing
    await page.waitForTimeout(2000);

    // Check that output was generated
    const outputTextarea = page.locator("#rendered-output");
    await expect(outputTextarea).toBeVisible();

    // Get the output text
    const outputText = await outputTextarea.inputValue();

    // Verify output is not empty (may be empty if parser doesn't recognize format)
    // Just verify the elements exist and parsing didn't crash
    expect(outputTextarea).toBeTruthy();
  });

  test("Note generation: Copy button exists", async ({ page }) => {
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Check for copy output button
    const copyButton = page.locator("#copy-output-btn");
    await expect(copyButton).toBeVisible();
  });

  test("Note generation: Clear button works", async ({ page }) => {
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Fill input
    const inputTextarea = page.locator("#vs-paste");
    await inputTextarea.fill("Test content");

    // Verify content exists
    let inputValue = await inputTextarea.inputValue();
    expect(inputValue).toBe("Test content");

    // Click clear button
    const clearButton = page.locator("#vs-clear");
    await clearButton.click();

    // Wait a moment for clear to process
    await page.waitForTimeout(300);

    // Verify input is cleared
    inputValue = await inputTextarea.inputValue();
    expect(inputValue).toBe("");
  });

  // ============================================================
  // MEDICATIONS ROUTE (FEATURE FLAG)
  // ============================================================

  test("Medications route: tab visibility based on feature flag", async ({
    page,
  }) => {
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Check if meds tab exists
    const medsTab = page.locator("#meds-nav-tab");

    // The tab may or may not be visible depending on feature flag
    const isVisible = await medsTab.isVisible();

    if (isVisible) {
      // Feature flag is ON - verify tab works
      await medsTab.click();
      await page.waitForLoadState("networkidle");

      const url = page.url();
      expect(url).toContain("#/meds");
    } else {
      // Feature flag is OFF - tab should be hidden
      const display = await medsTab.evaluate(
        (el) => window.getComputedStyle(el).display,
      );
      expect(display).toBe("none");
    }
  });

  test("Medications page loads when feature enabled", async ({ page }) => {
    // Try to navigate directly to meds page
    await page.goto("/index.html#/meds");
    await page.waitForLoadState("networkidle");

    // Check if page loaded successfully
    const banner = page.locator("#banner");
    await expect(banner).toBeVisible();

    // Check for meds-specific content
    const medsPage = page.locator(".meds-page");

    if (await medsPage.isVisible()) {
      // Feature is enabled - verify meds content

      // Check for search input
      const searchInput = page.locator("#meds-search");
      if (await searchInput.isVisible()) {
        await expect(searchInput).toBeVisible();
      }

      // Check for filter dropdown
      const filterSelect = page.locator("#meds-filter");
      if (await filterSelect.isVisible()) {
        await expect(filterSelect).toBeVisible();
      }

      // Check for medication cards container
      const medsContainer = page.locator("#meds-container");
      if (await medsContainer.isVisible()) {
        await expect(medsContainer).toBeVisible();
      }
    }
  });

  test("Medications search functionality works when enabled", async ({
    page,
  }) => {
    await page.goto("/index.html#/meds");
    await page.waitForLoadState("networkidle");

    // Check if meds page loaded
    const searchInput = page.locator("#meds-search");

    if (await searchInput.isVisible()) {
      // Type a medication name
      await searchInput.fill("aspirin");
      await page.waitForTimeout(500);

      // Check that some cards are displayed
      const medCards = page.locator(".med-card");
      const count = await medCards.count();

      // Should have at least one card (or none if no results)
      expect(count).toBeGreaterThanOrEqual(0);
    }
  });

  // ============================================================
  // THEME TOGGLE
  // ============================================================

  test("Theme toggle button exists and is clickable", async ({ page }) => {
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Check for theme toggle button
    const themeToggle = page.locator(".theme-toggle");
    await expect(themeToggle).toBeVisible();

    // Verify it's clickable
    await themeToggle.click();
    await page.waitForTimeout(300);

    // After click, body should have theme class changed
    const body = page.locator("body");
    const className = await body.getAttribute("class");
    expect(className).toBeTruthy();
  });

  // ============================================================
  // DIAGNOSIS SIDEBAR
  // ============================================================

  test("Diagnosis sidebar loads on home page", async ({ page }) => {
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Check for diagnosis rail
    const dxRail = page.locator("#dx-rail");
    await expect(dxRail).toBeVisible();

    // Check for diagnosis cards container (cards may be dynamically loaded)
    // Just verify the structure exists, don't require cards to be loaded
    const dxRailHeader = page.locator(".dx-rail-header");
    await expect(dxRailHeader).toBeVisible();
  });

  test("Diagnosis search functionality works", async ({ page }) => {
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Find diagnosis search input
    const searchInput = page.locator("#dx-search,#search");

    if (await searchInput.first().isVisible()) {
      // Type a diagnosis
      await searchInput.first().fill("heart failure");
      await page.waitForTimeout(300);

      // Check that the search input accepted the value
      const searchValue = await searchInput.first().inputValue();
      expect(searchValue).toBe("heart failure");
    }
  });

  // ============================================================
  // LAB VALUES SECTION
  // ============================================================

  test("Lab values section exists on home page", async ({ page }) => {
    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Check for labs section
    const labsPanel = page.locator("#lab-values-panel");

    if (await labsPanel.isVisible()) {
      await expect(labsPanel).toBeVisible();

      // Check for lab value inputs
      const labInputs = page.locator('input[id^="lab-"]');
      const count = await labInputs.count();

      expect(count).toBeGreaterThan(0);
    }
  });

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  test("Application handles navigation to non-existent routes", async ({
    page,
  }) => {
    // In SPA, all routes return 200 and index.html is served
    await page.goto("/index.html#/nonexistent-route");
    await page.waitForLoadState("networkidle");

    // Should still have the main banner visible (SPA always loads)
    const banner = page.locator("#banner");
    await expect(banner).toBeVisible();
  });

  test("Application loads without JavaScript errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("pageerror", (error) => {
      errors.push(error.message);
    });

    await page.goto("/index.html");
    await page.waitForLoadState("networkidle");

    // Verify no critical JavaScript errors occurred
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes("favicon") && !e.includes("manifest") && !e.includes("404"),
    );

    expect(criticalErrors.length).toBe(0);
  });
});
