/**
 * Unit tests for vitals and labs extraction
 */
import { test, expect } from '@playwright/test';

test.describe('Vitals and Labs Extraction', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html');
    await page.waitForLoadState('networkidle');
  });

  test('should extract all vitals including SpO2 with percent sign', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Exam/Vitals:
Temperature: 98.6 F
HR: 72 bpm
BP: 120/80 mmHg
RR: 16
SpO2: 98%
Weight: 165 lb
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    expect(result.vitals).toBeDefined();
    expect(Array.isArray(result.vitals)).toBe(true);
    expect(result.vitals.length).toBeGreaterThanOrEqual(5);

    // Check SpO2 specifically
    const spo2 = result.vitals.find((v: any) => v.name === 'SpO2');
    expect(spo2).toBeDefined();
    expect(spo2.value).toBe(98);
    expect(spo2.unit).toContain('%');

    console.log('✅ All vitals extracted:', result.vitals.length);
  });

  test('should extract SpO2 on room air variant', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Exam/Vitals:
SpO2 97 on room air
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    const spo2 = result.vitals.find((v: any) => v.name === 'SpO2');
    expect(spo2).toBeDefined();
    expect(spo2.value).toBe(97);

    console.log('✅ Room air variant extracted');
  });

  test('should extract labs correctly with proper formatting', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Laboratory Results:
Troponin: 0.04 ng/mL (0-0.04)
BNP: 125 pg/mL
Creatinine: 1.1 mg/dL
Potassium: 4.2 mEq/L
Hemoglobin: 14.5 g/dL
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    expect(result.labs).toBeDefined();
    expect(Array.isArray(result.labs)).toBe(true);
    expect(result.labs.length).toBeGreaterThanOrEqual(5);

    // Check each lab
    const troponin = result.labs.find((l: any) => l.name.toLowerCase().includes('trop'));
    expect(troponin).toBeDefined();
    expect(troponin.value).toBe(0.04);

    const bnp = result.labs.find((l: any) => l.name.toLowerCase().includes('bnp'));
    expect(bnp).toBeDefined();
    expect(bnp.value).toBe(125);

    const creatinine = result.labs.find((l: any) => l.name.toLowerCase().includes('creat'));
    expect(creatinine).toBeDefined();
    expect(creatinine.value).toBe(1.1);

    const potassium = result.labs.find((l: any) => l.name.toLowerCase().includes('potassium'));
    expect(potassium).toBeDefined();
    expect(potassium.value).toBe(4.2);

    const hemoglobin = result.labs.find((l: any) => l.name.toLowerCase().includes('hemo') || l.name.toLowerCase().includes('hgb'));
    expect(hemoglobin).toBeDefined();
    expect(hemoglobin.value).toBe(14.5);

    console.log('✅ All 5 labs extracted correctly');
  });

  test('should NOT extract Date line as a lab', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Date: 08/27/2025

Laboratory Results:
Troponin: 0.04 ng/mL
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    // Check that no lab has "Date" as the name
    const dateLab = result.labs.find((l: any) =>
      l.name.toLowerCase() === 'date' || l.raw.startsWith('Date:')
    );
    expect(dateLab).toBeUndefined();

    console.log('✅ Date line correctly excluded from labs');
  });

  test('should handle combo lab format (AST/ALT)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Laboratory Results:
AST/ALT: 25/30 U/L
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    const ast = result.labs.find((l: any) => l.name.toLowerCase().includes('ast'));
    const alt = result.labs.find((l: any) => l.name.toLowerCase().includes('alt'));

    expect(ast).toBeDefined();
    expect(ast.value).toBe(25);
    expect(alt).toBeDefined();
    expect(alt.value).toBe(30);

    console.log('✅ Combo format split into two labs');
  });

  test('should ignore admin headers', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Laboratory Results:
Date: 08/27/2025
Time: 14:30
Patient: John Doe
MRN: 12345
Troponin: 0.04 ng/mL
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    // Should only have troponin, not date/time/patient/mrn
    expect(result.labs.length).toBe(1);
    expect(result.labs[0].name.toLowerCase()).toContain('trop');

    console.log('✅ Admin headers correctly ignored');
  });

  test('should handle high/low flags with various formats', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Laboratory Results:
Potassium: 5.5 mEq/L (3.5-5.0) H
Sodium: 132 mEq/L (135-145) Low
Glucose: 180 mg/dL ↑
Hemoglobin: 10.5 g/dL *
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    const potassium = result.labs.find((l: any) => l.name.toLowerCase().includes('potassium'));
    const sodium = result.labs.find((l: any) => l.name.toLowerCase().includes('sodium'));
    const glucose = result.labs.find((l: any) => l.name.toLowerCase().includes('glucose'));
    const hemoglobin = result.labs.find((l: any) => l.name.toLowerCase().includes('hemo') || l.name.toLowerCase().includes('hgb'));

    expect(potassium).toBeDefined();
    expect(String(potassium.value)).toContain('(H)');

    expect(sodium).toBeDefined();
    expect(String(sodium.value)).toContain('(L)');

    expect(glucose).toBeDefined();
    expect(String(glucose.value)).toContain('(H)');

    expect(hemoglobin).toBeDefined();
    expect(String(hemoglobin.value)).toContain('(H)');

    console.log('✅ All flag formats detected (H, Low, ↑, *)');
  });

  test('should handle ranges in brackets and parentheses', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Laboratory Results:
Creatinine: 1.2 mg/dL [0.6-1.2]
BUN: 18 mg/dL (7-20)
Calcium: 9.5 mg/dL range 8.5-10.5
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    const creatinine = result.labs.find((l: any) => l.name.toLowerCase().includes('creat'));
    const bun = result.labs.find((l: any) => l.name.toLowerCase().includes('bun'));
    const calcium = result.labs.find((l: any) => l.name.toLowerCase().includes('calcium'));

    expect(creatinine).toBeDefined();
    expect(creatinine.value).toBe(1.2);

    expect(bun).toBeDefined();
    expect(bun.value).toBe(18);

    expect(calcium).toBeDefined();
    expect(calcium.value).toBe(9.5);

    console.log('✅ Various range formats parsed');
  });

  test('should apply lab allowlist to suppress junk', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Laboratory Results:
Troponin: 0.04 ng/mL
RandomJunkField: 123 xyz
BNP: 125 pg/mL
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    // Should only have troponin and BNP, not RandomJunkField
    expect(result.labs.length).toBe(2);
    const hasJunk = result.labs.some((l: any) => l.name.includes('RandomJunkField'));
    expect(hasJunk).toBe(false);

    console.log('✅ Non-allowlisted lab filtered out');
  });

  test('should handle comparator in value (<0.5)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Laboratory Results:
Creatinine: <0.5 mg/dL
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    const creat = result.labs.find((l: any) => l.name.toLowerCase().includes('creat'));
    expect(creat).toBeDefined();
    expect(creat.value).toBe('<0.5');
    expect(creat.unit).toBe('mg/dL');

    console.log('✅ Comparator value parsed');
  });

  test('should handle lab with no unit (K 4.0)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Laboratory Results:
Potassium: 4.0
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    const k = result.labs.find((l: any) => l.name.toLowerCase().includes('potassium'));
    expect(k).toBeDefined();
    expect(k.value).toBe(4.0);
    expect(k.unit).toBeUndefined();

    console.log('✅ Lab without unit parsed');
  });

  test('should handle dual combo line (PT/INR: 12.0/1.1 sec)', async ({ page }) => {
    const result = await page.evaluate(() => {
      const note = `
Laboratory Results:
PT/INR: 12.0/1.1 sec
      `;
      return (window as any).parseClinicalNoteFull(note);
    });

    const pt = result.labs.find((l: any) => l.name.toLowerCase().includes('pt'));
    const inr = result.labs.find((l: any) => l.name.toLowerCase().includes('inr'));

    expect(pt).toBeDefined();
    expect(pt.value).toBe(12.0);
    expect(pt.unit).toBe('sec');

    expect(inr).toBeDefined();
    expect(inr.value).toBe(1.1);
    expect(inr.unit).toBe('sec');

    console.log('✅ PT/INR combo split correctly');
  });
});
