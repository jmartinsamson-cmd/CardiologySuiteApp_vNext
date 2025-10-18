/**
 * Unit tests for extractVitals function
 * Tests happy path, no-match fast exit, and pathological large input
 */

import { test, expect } from '@playwright/test';

test.describe('extractVitals', () => {
  // Load the parser helpers in browser context
  test.beforeEach(async ({ page }) => {
    await page.goto('/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html');
    await page.waitForFunction(() => {
      return typeof (window as any).extractVitals === 'function';
    }, { timeout: 5000 });
  });

  test('should extract vitals from typical clinical text (happy path)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const text = `
        Vital Signs:
        Temperature: 98.6 F
        HR: 72 bpm
        BP: 120/80 mmHg
        RR: 16
        SpO2: 98%
        Weight: 165 lb
      `;
      return (window as any).extractVitals(text);
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);

    // Check that we extracted temperature
    const temp = result.find((v: any) => v.name === 'Temp');
    expect(temp).toBeDefined();
    expect(temp.value).toBeCloseTo(98.6, 1);

    // Check heart rate
    const hr = result.find((v: any) => v.name === 'HR');
    expect(hr).toBeDefined();
    expect(hr.value).toBe(72);

    // Check blood pressure
    const bp = result.find((v: any) => v.name === 'BP');
    expect(bp).toBeDefined();
    expect(bp.value).toBe('120/80');

    console.log('✅ Extracted vitals:', result);
  });

  test('should return empty array for text with no vitals (fast exit)', async ({ page }) => {
    const startTime = Date.now();

    const result = await page.evaluate(() => {
      const text = `
        This is a clinical note with no vital signs mentioned.
        Patient reports feeling well.
        Assessment: Stable condition.
      `;
      return (window as any).extractVitals(text);
    });

    const elapsed = Date.now() - startTime;

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
    expect(elapsed).toBeLessThan(1000); // Should be very fast

    console.log(`✅ No vitals found, completed in ${elapsed}ms`);
  });

  test('should handle large input without stalling (pathological case)', async ({ page }) => {
    const startTime = Date.now();
    const TIMEOUT_MS = 5000;

    const result = await page.evaluate((timeoutMs) => {
      // Generate large text with repeating patterns
      const largeText = `
        Hospital Course:
        ${Array(1000).fill('Patient stable. HR: 75 bpm. BP: 118/76 mmHg. ').join('\n')}
        ${Array(1000).fill('Assessment: Improving. Temp: 98.4 F. SpO2: 97%. ').join('\n')}
      `;

      const start = Date.now();
      const vitals = (window as any).extractVitals(largeText);
      const elapsed = Date.now() - start;

      return { vitals, elapsed, textLength: largeText.length };
    }, TIMEOUT_MS);

    const totalElapsed = Date.now() - startTime;

    expect(result).toBeDefined();
    expect(Array.isArray(result.vitals)).toBe(true);
    expect(result.textLength).toBeGreaterThan(50000); // Verify it's actually large
    expect(result.elapsed).toBeLessThan(TIMEOUT_MS);
    expect(totalElapsed).toBeLessThan(TIMEOUT_MS);

    console.log(`✅ Large input test passed:`);
    console.log(`   Text length: ${result.textLength} chars`);
    console.log(`   Extraction time: ${result.elapsed}ms`);
    console.log(`   Vitals found: ${result.vitals.length}`);
  });

  test('should deduplicate identical vital readings', async ({ page }) => {
    const result = await page.evaluate(() => {
      const text = `
        Initial vitals: HR: 80 bpm, BP: 120/80
        Repeated: HR: 80 bpm, BP: 120/80
        Final: HR: 80 bpm
      `;
      return (window as any).extractVitals(text);
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);

    // Count HR entries - should be deduplicated
    const hrCount = result.filter((v: any) => v.name === 'HR').length;
    expect(hrCount).toBeLessThanOrEqual(1);

    console.log('✅ Deduplication working, vitals:', result);
  });

  test('should handle edge case with zero-length match protection', async ({ page }) => {
    const result = await page.evaluate(() => {
      // Text that might cause zero-length matches
      const text = 'BP:  mmHg HR:  bpm';
      return (window as any).extractVitals(text);
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    // Should not freeze or error, even if no valid vitals found
    console.log('✅ Zero-length protection working');
  });
});
