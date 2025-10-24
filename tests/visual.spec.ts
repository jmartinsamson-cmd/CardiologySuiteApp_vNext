/// <reference types="@playwright/test" />
import { test, expect } from "@playwright/test";

// --- stability helpers (inline to avoid extra files) ---
const STABILITY_CSS = `
  * { animation: none !important; transition: none !important; }
  * { caret-color: transparent !important; } /* why: caret blinks and breaks pixels */
  html, body { -webkit-font-smoothing: antialiased !important; }
  body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif !important; }
  [data-dynamic], [data-now], [data-random], time { visibility: hidden !important; }
  [role="progressbar"], [aria-busy="true"], .spinner, [data-spinner] { visibility: hidden !important; }
  ::placeholder { opacity: 1 !important; color: inherit !important; }
  * { scrollbar-width: none !important; }
  *::-webkit-scrollbar { width: 0 !important; height: 0 !important; }
  html { scroll-behavior: auto !important; }
`;

/** why: ensure deterministic time/random across engines */
async function freezeTimeAndRandom(page: import("@playwright/test").Page) {
  await page.addInitScript(({ seed }) => {
    const fixedNow = Date.UTC(2024, 0, 1, 12, 0, 0);
    const OriginalDate = Date;
    class StableDate extends OriginalDate {
      constructor(...args: ConstructorParameters<DateConstructor>) {
        const hasArgs = (args as unknown[]).length > 0;
        if (hasArgs) {
          super(...args);
        } else {
          super(fixedNow);
        }
      }
      static now() { return fixedNow; }
      static readonly UTC = OriginalDate.UTC;
      static readonly parse = OriginalDate.parse;
    }
    // @ts-ignore override Date for stability
    globalThis.Date = StableDate as unknown as DateConstructor;

    let s = seed >>> 0;
    globalThis.Math.random = () => {
      s ^= s << 13;
      s ^= s >>> 17;
      s ^= s << 5;
      return ((s >>> 0) % 1_000_000) / 1_000_000;
    };
  }, { seed: 0xC0FFEE });
}

/** why: consistent page state before snapshots */
async function stableReady(page: import("@playwright/test").Page, path = "/index.html") {
  await freezeTimeAndRandom(page);
  await page.addStyleTag({ content: STABILITY_CSS });
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    globalThis.scrollTo(0, 0);
    const doc = globalThis.document;
    for (const el of Array.from(doc.querySelectorAll<HTMLElement>("[data-timestamp]"))) {
      el.dataset.timestamp = "stable";
    }
    let idx = 0;
    for (const el of Array.from(doc.querySelectorAll<HTMLElement>('[id^="random-"]'))) {
      el.id = `stable-id-${idx++}`;
    }
    const sr = doc.querySelector<HTMLElement>("#search-results");
    if (sr) sr.style.display = "none";
  });
  // brief idle for layout/fonts
  await page.evaluate(() => new Promise<void>((resolve) => {
    const idleCandidate = (globalThis as { requestIdleCallback?: Function }).requestIdleCallback;
    if (typeof idleCandidate === "function") {
      idleCandidate(resolve);
    } else {
      globalThis.setTimeout(resolve, 60);
    }
  }));
}

/** sugar for stable screenshots */
async function snap(
  target: import("@playwright/test").Page | import("@playwright/test").Locator,
  name: string,
  opts: { masks?: import("@playwright/test").Locator[]; fullPage?: boolean } = {}
) {
  await expect(target).toHaveScreenshot(name, {
    animations: "disabled",
    mask: opts.masks,
    fullPage: opts.fullPage ?? false,
    maxDiffPixelRatio: 0.015, // allow tiny engine variance
    timeout: 10_000,
  });
}

test.describe("Visual Regression Tests", () => {
  test.beforeEach(async ({ page }) => {
    await stableReady(page);
  });

  // Common masks for volatility
  const masks = (page: import("@playwright/test").Page) => ([
    page.locator("time"),
    page.locator("[data-timestamp]"),
    page.locator("[data-dynamic]"),
    page.locator('[role="progressbar"]'),
    page.locator('[aria-busy="true"]'),
    page.locator(".spinner"),
    page.locator("[data-spinner]"),
    page.locator("[data-placeholder]"),
    page.locator("[data-scrollbar]"),
    page.locator("[aria-live]")
  ]);


  // ============================================================
  // SIDEBAR VISUAL TESTS
  // ============================================================

  test("Diagnosis sidebar visual snapshot", async ({ page }) => {
    const sidebar = page.locator("#dx-rail");
    await expect(sidebar).toBeVisible();
    // Hide dynamic search results if present
    await page.evaluate(() => {
      const el = document.querySelector<HTMLElement>("#search-results");
      if (el) el.style.display = "none";
    });
    await snap(sidebar, "sidebar-diagnosis.png", { masks: masks(page) });
  });

  test("Diagnosis sidebar with search input visible", async ({ page }) => {
    const sidebar = page.locator("#dx-rail");
    await expect(sidebar).toBeVisible();
    const searchInput = page.locator("#search");
    if (await searchInput.isVisible()) {
      await searchInput.focus(); // caret hidden via CSS anyway
    }
    await snap(sidebar, "sidebar-diagnosis-search-focused.png", {
      masks: [...masks(page), searchInput], // extra guard
    });
  });

  test("Sidebar header structure", async ({ page }) => {
    const header = page.locator(".dx-rail-header");
    await expect(header).toBeVisible();
    await snap(header, "sidebar-header.png", { masks: masks(page) });
  });


  // ============================================================
  // NOTE OUTPUT AREA VISUAL TESTS
  // ============================================================

  test("Note output area empty state", async ({ page }) => {
    const outputArea = page.locator("#rendered-output");
    await expect(outputArea).toBeVisible();
    // Ensure empty
    try {
      const v = await outputArea.inputValue();
      if (v) {
        await page.evaluate(() => {
          const ta = document.querySelector<HTMLTextAreaElement>("#rendered-output");
          if (ta) ta.value = "";
        });
      }
    } catch {
      /* readonly or non-input; ignore */
    }
    await snap(outputArea, "output-area-empty.png", { masks: masks(page) });
  });

  test("Note output area with sample content", async ({ page }) => {
    const outputArea = page.locator("#rendered-output");
    await expect(outputArea).toBeVisible();
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
      const ta = document.querySelector<HTMLTextAreaElement>("#rendered-output");
      if (ta) ta.value = content;
    }, sampleOutput);
    await page.waitForTimeout(60);
    await snap(outputArea, "output-area-with-content.png", { masks: masks(page) });
  });

  test("Note output panel full view", async ({ page }) => {
    const outputPanel = page.locator("#template-content");
    if (await outputPanel.isVisible()) {
      await page.evaluate(() => {
        const ta = document.querySelector<HTMLTextAreaElement>("#rendered-output");
        if (ta) ta.value = "Sample output text for visual testing";
      });
      await page.waitForTimeout(60);
      await snap(outputPanel, "output-panel-full.png", { masks: masks(page) });
    }
  });

  // ============================================================
  // INPUT PANEL
  // ============================================================

  test("Clinical note input panel visual", async ({ page }) => {
    const inputPanel = page.locator("#clinical-note-input-panel");
    await expect(inputPanel).toBeVisible();
    const inputTextarea = page.locator("#vs-paste");
    if (await inputTextarea.isVisible()) await inputTextarea.fill("");
    await snap(inputPanel, "input-panel-empty.png", { masks: masks(page) });
  });

  test("Clinical note input panel with placeholder visible", async ({ page }) => {
    const inputPanel = page.locator("#clinical-note-input-panel");
    await expect(inputPanel).toBeVisible();
    const inputTextarea = page.locator("#vs-paste");
    if (await inputTextarea.isVisible()) {
      await inputTextarea.fill("");
      await inputTextarea.blur();
    }
    await page.waitForTimeout(60);
    await snap(inputPanel, "input-panel-placeholder.png", { masks: masks(page) });
  });


  // ============================================================
  // BUTTON STATES
  // ============================================================

  test("Parse and Clear buttons visual state", async ({ page }) => {
    const parseButton = page.locator("#vs-parse");
    const clearButton = page.locator("#vs-clear");
    await expect(parseButton).toBeVisible();
    await expect(clearButton).toBeVisible();
    const container = page.locator(".button-group");
    if (await container.isVisible()) {
      await snap(container, "buttons-parse-clear.png", { masks: masks(page) });
    }
  });

  // ============================================================
  // FULL PAGE LAYOUT
  // ============================================================

  test("Full page layout with sidebar and main content", async ({ page }) => {
    await page.evaluate(() => {
      const sr = document.querySelector<HTMLElement>("#search-results");
      if (sr) sr.style.display = "none";
      for (const el of Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input[type="text"], textarea'))) {
        el.value = "";
      }
    });
    await snap(page, "full-page-layout.png", {
      fullPage: true,
      masks: masks(page),
    });
  });
});
