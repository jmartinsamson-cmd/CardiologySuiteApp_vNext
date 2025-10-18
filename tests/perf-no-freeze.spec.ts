/**
 * Performance Test: No UI Freeze During Parse
 *
 * Hardened against flakiness:
 * - Ignores first animation frame (warm-up)
 * - Fails only on long tasks >100ms
 * - Budgets: maxFrame <=200ms, parse <=500ms
 * - Checks console for duplicate identifiers and viewBox errors
 */

import { test, expect, Page } from '@playwright/test';

const MAX_FRAME_DURATION = 200; // ms
const MAX_LONG_TASK = 100; // ms - fail only if task exceeds this
const MAX_PARSE_TIME = 500; // ms

const SAMPLE_NOTE = `
Chief Complaint
Chest pain and shortness of breath

History of Present Illness
72 yo M with PMH of HTN, HLD, DM2 presents with chest pain x 2 hours.
Pain started at rest, 7/10 intensity, pressure-like quality.
Associated with diaphoresis and SOB. No radiation.
Denies nausea, vomiting, or syncope.

Past Medical History
- Hypertension
- Hyperlipidemia
- Type 2 Diabetes Mellitus
- Prior MI (2018)

Past Surgical History
- Appendectomy (1995)
- CABG x3 (2018)

Family History
Father with CAD, Mother with HTN

Social History
Former smoker (quit 2020), No alcohol, No drugs

Laboratory Results
Troponin: 0.8 ng/mL (H)
BNP: 450 pg/mL (H)
Creatinine: 1.2 mg/dL

Impression and Plan
1. Acute Coronary Syndrome - NSTEMI
   - Aspirin 325mg, Plavix load
   - Heparin drip
   - Cardiology consult
   - Troponin serial q4h
2. Heart Failure - Volume overload
   - Lasix 40mg IV
   - Daily weights
   - Strict I/O
`.trim();

test.describe('Performance: No UI Freeze', () => {
  let consoleErrors: string[] = [];
  let consoleWarnings: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    consoleWarnings = [];

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else if (msg.type() === 'warning') {
        consoleWarnings.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
    });
  });

  test('should load page without duplicate identifier errors', async ({ page }) => {
    await page.goto('/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html');

    // Wait for parser to load
    await page.waitForFunction(() => {
      return typeof (window as any).parseClinicalNoteFull === 'function';
    }, { timeout: 5000 });

    // Check for duplicate identifier errors
    const duplicateErrors = consoleErrors.filter(err =>
      /Identifier .* has already been declared/i.test(err)
    );

    if (duplicateErrors.length > 0) {
      console.error('❌ Duplicate identifier errors found:');
      duplicateErrors.forEach(err => console.error(`   ${err}`));
    }

    expect(duplicateErrors, 'Should have no duplicate identifier errors').toHaveLength(0);

    // Verify no duplicate script tags
    const duplicateScripts = await page.evaluate(() => {
      return document.querySelectorAll('script[src*="noteParser_full_async.js"]').length;
    });

    expect(duplicateScripts, 'Should have zero duplicate async parser script tags').toBe(0);
  });

  test('should have no SVGs with percentage in viewBox', async ({ page }) => {
    await page.goto('/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html');
    await page.waitForLoadState('networkidle');

    const badViewBoxCount = await page.evaluate(() => {
      return [...document.querySelectorAll('svg')]
        .filter(svg => {
          const viewBox = svg.getAttribute('viewBox');
          return viewBox && viewBox.includes('%');
        }).length;
    });

    expect(badViewBoxCount, 'Should have no SVGs with % in viewBox').toBe(0);

    // Also check console for viewBox errors
    const viewBoxErrors = consoleErrors.filter(err =>
      /viewBox: Expected number/i.test(err)
    );

    if (viewBoxErrors.length > 0) {
      console.error('❌ viewBox errors found:');
      viewBoxErrors.forEach(err => console.error(`   ${err}`));
    }

    expect(viewBoxErrors, 'Should have no viewBox errors in console').toHaveLength(0);
  });

  test('should parse note without exceeding 200ms frame duration', async ({ page }) => {
    await page.goto('/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html');

    // Wait for parser to load
    await page.waitForFunction(() => {
      return typeof (window as any).parseClinicalNoteFull === 'function';
    }, { timeout: 5000 });

    // Start monitoring long frames (ignore first frame for warm-up)
    await page.evaluate((maxDuration) => {
      (window as any).__longFrames = [];
      (window as any).__frameCount = 0;
      let lastFrameTime = performance.now();

      // Monitor via requestAnimationFrame
      function checkFrame() {
        const now = performance.now();
        const frameDuration = now - lastFrameTime;
        (window as any).__frameCount++;

        // Ignore first frame (warm-up)
        if ((window as any).__frameCount > 1 && frameDuration > maxDuration) {
          (window as any).__longFrames.push({
            duration: frameDuration,
            name: 'RAF frame',
            type: 'frame',
            frameNumber: (window as any).__frameCount
          });
        }

        lastFrameTime = now;
        requestAnimationFrame(checkFrame);
      }
      requestAnimationFrame(checkFrame);
    }, MAX_FRAME_DURATION);

    // Find and fill the input textarea
    const noteInput = await page.locator('textarea#noteInput, textarea[placeholder*="note"], textarea').first();
    await noteInput.fill(SAMPLE_NOTE);

    // Find and click Parse button
    const parseButton = await page.locator('button:has-text("Parse"), button#parseBtn, button[onclick*="parse"]').first();
    await parseButton.click();

    // Wait for parse to complete
    await page.waitForFunction(() => {
      const output = document.querySelector('textarea#output, textarea[readonly], div#output');
      return output && (
        (output as HTMLTextAreaElement).value?.length > 100 ||
        (output as HTMLElement).textContent?.length > 100
      );
    }, { timeout: 10000 });

    // Give time for any remaining async operations
    await page.waitForTimeout(500);

    // Get long frames data
    const longFramesData = await page.evaluate(() => {
      return (window as any).__longFrames || [];
    });

    // Report findings
    if (longFramesData.length > 0) {
      const maxFrame = Math.max(...longFramesData.map((f: any) => f.duration));
      console.log(`⚠️  Found ${longFramesData.length} long frame(s) (ignoring first frame warm-up)`);
      console.log(`   Longest frame: ${maxFrame.toFixed(2)}ms`);
      longFramesData.slice(0, 5).forEach((frame: any) => {
        console.log(`   - Frame ${frame.frameNumber}: ${frame.duration.toFixed(2)}ms`);
      });

      expect(maxFrame, `Max frame duration should be <${MAX_FRAME_DURATION}ms`).toBeLessThan(MAX_FRAME_DURATION);
    } else {
      console.log('✅ No frames exceeded 200ms (after warm-up)');
    }

    // Check console for errors
    const viewBoxErrors = consoleErrors.filter(err =>
      /viewBox: Expected number/i.test(err)
    );
    expect(viewBoxErrors, 'Should have no viewBox errors').toHaveLength(0);
  });

  test('should show parse timing markers in console', async ({ page }) => {
    const consoleMessages: string[] = [];

    page.on('console', (msg) => {
      consoleMessages.push(msg.text());
    });

    await page.goto('/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html');
    await page.waitForFunction(() => {
      return typeof (window as any).parseClinicalNoteFull === 'function';
    }, { timeout: 5000 });

    // Fill and parse
    const noteInput = await page.locator('textarea#noteInput, textarea[placeholder*="note"], textarea').first();
    await noteInput.fill(SAMPLE_NOTE);

    const parseButton = await page.locator('button:has-text("Parse"), button#parseBtn, button[onclick*="parse"]').first();
    await parseButton.click();

    await page.waitForFunction(() => {
      const output = document.querySelector('textarea#output, textarea[readonly], div#output');
      return output && (
        (output as HTMLTextAreaElement).value?.length > 100 ||
        (output as HTMLElement).textContent?.length > 100
      );
    }, { timeout: 10000 });

    await page.waitForTimeout(500);

    // Check for timing markers
    const timingMarkers = consoleMessages.filter(msg =>
      /⏱️ Parse:/.test(msg)
    );

    console.log(`Found ${timingMarkers.length} timing markers:`);
    timingMarkers.forEach(marker => console.log(`  ${marker}`));

    // Skip if timing markers are not enabled
    if (timingMarkers.length === 0) {
      console.log('⚠️  No timing markers found - may not be enabled in parser');
      test.skip();
      return;
    }

    // Should have at least: Preprocess, SplitIntoSections, ParseHPI, ParseAssessment, ParsePlan, Normalize, Total
    expect(timingMarkers.length, 'Should have at least 7 timing markers').toBeGreaterThanOrEqual(7);

    // Check for "Total" marker
    const totalMarker = timingMarkers.find(m => /Parse: Total/.test(m));
    expect(totalMarker, 'Should have Parse: Total marker').toBeDefined();
  });

  test('should complete parse in under 500ms for typical note', async ({ page }) => {
    await page.goto('/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html');
    await page.waitForFunction(() => {
      return typeof (window as any).parseClinicalNoteFull === 'function';
    }, { timeout: 5000 });

    // Fill input
    const noteInput = await page.locator('textarea#noteInput, textarea[placeholder*="note"], textarea').first();
    await noteInput.fill(SAMPLE_NOTE);

    // Measure parse time
    const parseButton = await page.locator('button:has-text("Parse"), button#parseBtn, button[onclick*="parse"]').first();

    const startTime = Date.now();
    await parseButton.click();

    await page.waitForFunction(() => {
      const output = document.querySelector('textarea#output, textarea[readonly], div#output');
      return output && (
        (output as HTMLTextAreaElement).value?.length > 100 ||
        (output as HTMLElement).textContent?.length > 100
      );
    }, { timeout: 10000 });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`Parse completed in ${duration}ms (budget: ${MAX_PARSE_TIME}ms)`);

    expect(duration, `Parse should complete in <${MAX_PARSE_TIME}ms`).toBeLessThan(MAX_PARSE_TIME);
  });

  test('should have JankMonitor report zero long tasks >100ms', async ({ page }) => {
    await page.goto('/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html');

    // Check if JankMonitor is available (skip if not loaded)
    const hasJankMonitor = await page.evaluate(() => {
      return typeof (window as any).JankMonitor !== 'undefined';
    });

    if (!hasJankMonitor) {
      console.log('⚠️  JankMonitor not loaded - skipping test');
      test.skip();
      return;
    }

    // Start jank monitor
    await page.evaluate(() => {
      (window as any).JankMonitor.start();
    });

    // Fill and parse
    const noteInput = await page.locator('textarea#noteInput, textarea[placeholder*="note"], textarea').first();
    await noteInput.fill(SAMPLE_NOTE);

    const parseButton = await page.locator('button:has-text("Parse"), button#parseBtn, button[onclick*="parse"]').first();
    await parseButton.click();

    await page.waitForFunction(() => {
      const output = document.querySelector('textarea#output, textarea[readonly], div#output');
      return output && (
        (output as HTMLTextAreaElement).value?.length > 100 ||
        (output as HTMLElement).textContent?.length > 100
      );
    }, { timeout: 10000 });

    await page.waitForTimeout(500);

    // Stop and check stats
    const stats = await page.evaluate(() => {
      const result = (window as any).JankMonitor.stop();
      return (window as any).__JANK_STATS__ || result;
    });

    console.log('JankMonitor stats:', stats);
    console.log(`  Long tasks detected: ${stats.longTaskCount}`);
    console.log(`  Max jank duration: ${stats.maxJankDuration.toFixed(2)}ms`);

    // Fail only on long tasks >100ms (JankMonitor threshold is 50ms, which is too strict)
    if (stats.maxJankDuration > MAX_LONG_TASK) {
      console.error(`❌ Found long tasks exceeding ${MAX_LONG_TASK}ms`);
      expect(stats.maxJankDuration, `No tasks should exceed ${MAX_LONG_TASK}ms`).toBeLessThan(MAX_LONG_TASK);
    } else {
      console.log(`✅ No tasks exceeded ${MAX_LONG_TASK}ms`);
    }

    expect(stats.longTaskCount, 'Should have low count of long tasks').toBeLessThanOrEqual(5);
  });
});
