/// <reference types="@playwright/test" />
import { test, expect } from "@playwright/test";
import { injectAxe, checkA11y, getViolations } from "axe-playwright";

/**
 * Accessibility audit for MPA pages
 * Tests WCAG 2.1 AA compliance
 */

test.describe("Accessibility Audit - Main Pages", () => {
  test("index.html - Home page accessibility", async ({ page }) => {
    await page.goto("/index.html");
    await injectAxe(page);

    const violations = await getViolations(page);

    // Log violations for manual review
    if (violations.length > 0) {
      console.log("\n=== VIOLATIONS ON index.html ===");
      violations.forEach((violation, i) => {
        console.log(`\n${i + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Elements affected: ${violation.nodes.length}`);
        violation.nodes.forEach((node) => {
          console.log(`     - ${node.html}`);
          console.log(`       Fix: ${node.failureSummary}`);
        });
      });
    }

    // Expect no critical or serious violations
    const criticalViolations = violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(criticalViolations).toHaveLength(0);
  });

  test("SPA route #/guidelines - Guidelines page accessibility", async ({ page }) => {
    await page.goto("/index.html#/guidelines");
    await injectAxe(page);

    const violations = await getViolations(page);

    if (violations.length > 0) {
      console.log("\n=== VIOLATIONS ON #/guidelines ===");
      violations.forEach((violation, i) => {
        console.log(`\n${i + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Elements affected: ${violation.nodes.length}`);
      });
    }

    const criticalViolations = violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(criticalViolations).toHaveLength(0);
  });

  test("meds SPA route accessibility", async ({ page }) => {
    await page.goto("/index.html#/meds");
    await injectAxe(page);

    const violations = await getViolations(page);

    if (violations.length > 0) {
      console.log("\n=== VIOLATIONS ON #/meds ===");
      violations.forEach((violation, i) => {
        console.log(`\n${i + 1}. ${violation.id}: ${violation.description}`);
        console.log(`   Impact: ${violation.impact}`);
        console.log(`   Help: ${violation.help}`);
        console.log(`   Elements affected: ${violation.nodes.length}`);
      });
    }

    const criticalViolations = violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    expect(criticalViolations).toHaveLength(0);
  });

  test("Color contrast check - index.html", async ({ page }) => {
    await page.goto("/index.html");
    await injectAxe(page);

    const violations = await getViolations(page, null, {
      rules: {
        "color-contrast": { enabled: true },
      },
    });

    const contrastViolations = violations.filter(
      (v) => v.id === "color-contrast",
    );

    if (contrastViolations.length > 0) {
      console.log("\n=== COLOR CONTRAST VIOLATIONS ===");
      contrastViolations.forEach((violation) => {
        violation.nodes.forEach((node) => {
          console.log(`\n  Element: ${node.html}`);
          console.log(`  Issue: ${node.failureSummary}`);
        });
      });
    }

    expect(contrastViolations).toHaveLength(0);
  });

  test("Focus order and keyboard navigation - index.html", async ({ page }) => {
    await page.goto(
      "/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html",
    );

    // Check tab order of interactive elements
    const textarea = page.locator("#vs-paste");
    const generateBtn = page.locator("#vs-parse");
    const clearBtn = page.locator("#vs-clear");

    // Start at textarea
    await textarea.focus();
    await expect(textarea).toBeFocused();

    // Tab to generate button
    await page.keyboard.press("Tab");
    await expect(generateBtn).toBeFocused();

    // Tab to clear button
    await page.keyboard.press("Tab");
    await expect(clearBtn).toBeFocused();

    // Verify buttons have accessible names
    await expect(generateBtn).toHaveAccessibleName();
    await expect(clearBtn).toHaveAccessibleName();
  });

  test("ARIA labels on critical elements - index.html", async ({ page }) => {
    await page.goto(
      "/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html",
    );

    const generateBtn = page.locator("#vs-parse");
    const clearBtn = page.locator("#vs-clear");
    const textarea = page.locator("#vs-paste");

    // Check for aria-label or aria-labelledby
    const generateLabel = await generateBtn.getAttribute("aria-label");
    const clearLabel = await clearBtn.getAttribute("aria-label");
    const textareaLabel = await textarea.getAttribute("aria-label");

    console.log("\n=== ARIA LABEL CHECK ===");
    console.log(`Generate button aria-label: ${generateLabel || "MISSING"}`);
    console.log(`Clear button aria-label: ${clearLabel || "MISSING"}`);
    console.log(`Textarea aria-label: ${textareaLabel || "MISSING"}`);

    // Generate button should have accessible name (aria-label or visible text)
    await expect(generateBtn).toHaveAccessibleName();
  });
});
