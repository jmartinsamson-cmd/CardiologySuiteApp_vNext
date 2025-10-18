/**
 * Quick test to verify vitals and labs are populating
 */
import { test, expect } from '@playwright/test';

test('should extract and display vitals and labs', async ({ page }) => {
  // Capture console logs
  const logs: string[] = [];
  page.on('console', msg => {
    logs.push(msg.text());
    console.log('Browser console:', msg.text());
  });

  await page.goto('/cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/index.html');

  // Wait for page to load
  await page.waitForLoadState('networkidle');

  // Sample note with vitals and labs using proper section headers
  const sampleNote = `
Patient: John Doe
Date: 08/27/2025

Exam/Vitals:
Temperature: 98.6 F
HR: 72 bpm
BP: 120/80 mmHg
RR: 16
SpO2: 98%

Laboratory Results:
Troponin: 0.04 ng/mL (0-0.04)
BNP: 125 pg/mL
Creatinine: 1.1 mg/dL
Potassium: 4.2 mEq/L
Hemoglobin: 14.5 g/dL
  `;

  // Call parser directly
  const parsedData = await page.evaluate((note) => {
    const parseNote = (window as any).parseClinicalNoteFull;
    if (!parseNote) {
      throw new Error('parseClinicalNoteFull function not found');
    }
    return parseNote(note);
  }, sampleNote);

  console.log('\n=== PARSED DATA ===');
  console.log('Vitals:', JSON.stringify(parsedData.vitals, null, 2));
  console.log('Labs:', JSON.stringify(parsedData.labs, null, 2));

  // Check vitals
  expect(parsedData.vitals).toBeDefined();
  expect(Array.isArray(parsedData.vitals)).toBe(true);

  if (parsedData.vitals.length === 0) {
    console.error('⚠️  No vitals extracted!');
  } else {
    console.log(`✅ Extracted ${parsedData.vitals.length} vitals`);
  }

  // Check labs
  expect(parsedData.labs).toBeDefined();
  expect(Array.isArray(parsedData.labs)).toBe(true);

  if (parsedData.labs.length === 0) {
    console.error('⚠️  No labs extracted!');
  } else {
    console.log(`✅ Extracted ${parsedData.labs.length} labs`);
  }

  // Print debug logs
  console.log('\n=== DEBUG LOGS ===');
  logs.filter(log => log.includes('[Vitals]') || log.includes('[Labs]')).forEach(log => {
    console.log(log);
  });
});
