import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y, getViolations } from "axe-playwright";

/**
 * Accessibility Testing Suite for Modern Cardiac Suite
 *
 * Tests key clinical routes for WCAG 2.1 AA compliance
 * Uses axe-core for automated accessibility scanning
 */

test.describe("Accessibility Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to application
    await page.goto("http://localhost:8080");

    // Inject axe-core into the page
    await injectAxe(page);

    // Wait for application to initialize
    await page.waitForSelector("#app-container");
  });

  test("Homepage accessibility compliance", async ({ page }) => {
    // Navigate to home route
    await page.goto("http://localhost:8080/#/home");

    // Wait for content to load
    await page.waitForSelector('[data-testid="home-dashboard"]', {
      timeout: 5000,
    });

    // Run accessibility scan
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });

    // Additional manual checks
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("Clinical Notes Parser accessibility", async ({ page }) => {
    // Navigate to notes route
    await page.goto("http://localhost:8080/#/notes");

    // Wait for notes interface to load
    await page.waitForSelector('[data-testid="notes-container"]', {
      timeout: 5000,
    });

    // Check for proper form labeling
    const textarea = page.locator("textarea");
    if ((await textarea.count()) > 0) {
      await expect(textarea.first()).toHaveAttribute("aria-label");
    }

    // Run accessibility scan
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });

    // Test keyboard navigation
    await page.keyboard.press("Tab");
    await expect(page.locator(":focus")).toBeVisible();
  });

  test("ACS Decision Tree accessibility", async ({ page }) => {
    // Navigate to ACS decision tree
    await page.goto("http://localhost:8080/#/trees/acs");

    // Wait for decision tree to load
    await page.waitForSelector('[data-testid="acs-decision-tree"]', {
      timeout: 5000,
    });

    // Check for proper heading structure
    const headings = page.locator("h1, h2, h3, h4, h5, h6");
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Run accessibility scan
    await checkA11y(page, null, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });

    // Test interactive elements
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Check that buttons have accessible names
      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        const hasText = await button.textContent();
        const hasAriaLabel = await button.getAttribute("aria-label");
        expect(hasText || hasAriaLabel).toBeTruthy();
      }
    }
  });

  test("Navigation accessibility", async ({ page }) => {
    // Test navigation between routes
    await page.goto("http://localhost:8080/#/home");

    // Wait for navigation to be available
    await page.waitForSelector("nav", { timeout: 5000 });

    // Test navigation links have proper ARIA attributes
    const navLinks = page.locator("nav a, nav button");
    const linkCount = await navLinks.count();

    if (linkCount > 0) {
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = navLinks.nth(i);
        const hasText = await link.textContent();
        const hasAriaLabel = await link.getAttribute("aria-label");
        expect(hasText || hasAriaLabel).toBeTruthy();
      }
    }

    // Run accessibility scan on navigation
    await checkA11y(page, "nav", {
      detailedReport: true,
    });
  });

  test("Color contrast and theme accessibility", async ({ page }) => {
    await page.goto("http://localhost:8080/#/home");

    // Test light theme
    await page.waitForSelector("body");

    // Run color contrast checks
    await checkA11y(page, null, {
      rules: {
        "color-contrast": { enabled: true },
        "color-contrast-enhanced": { enabled: true },
      },
    });

    // Test dark theme if toggle available
    const themeToggle = page.locator('[data-testid="theme-toggle"]');
    if ((await themeToggle.count()) > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500); // Allow theme to apply

      // Re-run contrast checks for dark theme
      await checkA11y(page, null, {
        rules: {
          "color-contrast": { enabled: true },
        },
      });
    }
  });

  test("Keyboard navigation flow", async ({ page }) => {
    await page.goto("http://localhost:8080/#/notes");

    // Test tab navigation through the page
    let focusedElementCount = 0;
    const maxTabs = 10;

    for (let i = 0; i < maxTabs; i++) {
      await page.keyboard.press("Tab");

      const focusedElement = page.locator(":focus");
      if ((await focusedElement.count()) > 0) {
        focusedElementCount++;

        // Ensure focused element is visible
        await expect(focusedElement).toBeVisible();
      }
    }

    // Should be able to tab to interactive elements
    expect(focusedElementCount).toBeGreaterThan(0);

    // Test escape key functionality if modals exist
    await page.keyboard.press("Escape");
  });

  test("Screen reader compatibility", async ({ page }) => {
    await page.goto("http://localhost:8080/#/trees/acs");

    // Check for proper ARIA landmarks
    await expect(page.locator("main")).toBeVisible();

    // Check for skip links
    const skipLink = page.locator(
      'a[href="#main-content"], [data-testid="skip-link"]',
    );
    // Skip link may not be visible until focused

    // Check for proper heading hierarchy
    const h1Count = await page.locator("h1").count();
    expect(h1Count).toBe(1); // Should have exactly one h1

    // Run full accessibility scan
    await checkA11y(page, null, {
      detailedReport: true,
    });
  });

  test("Form accessibility", async ({ page }) => {
    await page.goto("http://localhost:8080/#/notes");

    // Check form controls have labels
    const inputs = page.locator("input, textarea, select");
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute("id");
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");

        // Should have some form of labeling
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = (await label.count()) > 0;
          expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }
    }

    // Run form-specific accessibility checks
    await checkA11y(page, 'form, [role="form"]', {
      detailedReport: true,
    });
  });
});

/**
 * Helper function to log accessibility violations
 */
test.afterEach(async ({ page }) => {
  try {
    const violations = await getViolations(page);
    if (violations.length > 0) {
      console.log(`Found ${violations.length} accessibility violations:`);
      violations.forEach((violation, index) => {
        console.log(`${index + 1}. ${violation.id}: ${violation.help}`);
      });
    }
  } catch (error) {
    // Ignore errors in cleanup
  }
});
