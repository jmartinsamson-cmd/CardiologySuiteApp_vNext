/* eslint-env node */
/* global process */
import { analyzeNote, analyzeNoteParallel } from './analyze-note.js';

// Mock parser function for parallel execution demo
function mockParser(noteText) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        vitals: { hr: 85, bp: '120/80' },
        chief_complaint: 'Chest pain',
        extracted_from: noteText.slice(0, 50) + '...',
      });
    }, 300);
  });
}

// Test note
const testNote = `
Patient: 65yo male
Chief Complaint: Chest pain radiating to left arm, onset 2 hours ago
PMH: Hypertension, hyperlipidemia
Vitals: BP 140/90, HR 95, O2 98% RA
EKG: ST elevation in leads II, III, aVF (2-3mm)
Assessment: Acute inferior STEMI
Plan: 
- STEMI protocol activated
- Aspirin 325mg PO given
- Heparin bolus
- Emergent cardiac catheterization
`;

async function runTests() {
  console.log('=== Testing AI Note Analyzer Enhancements ===\n');

  // Test 1: Basic analysis with caching
  console.log('Test 1: Basic Analysis (uncached)');
  const result1 = await analyzeNote(testNote, { useCache: true });
  console.log('Result:', JSON.stringify(result1, null, 2));
  console.log(`Latency: ${result1.latency}ms, Confidence: ${result1.confidence}, Cached: ${result1.cached}\n`);

  // Test 2: Cached analysis
  console.log('Test 2: Cached Analysis');
  const result2 = await analyzeNote(testNote, { useCache: true });
  console.log(`Latency: ${result2.latency}ms, Confidence: ${result2.confidence}, Cached: ${result2.cached}\n`);

  // Test 3: Parallel execution
  console.log('Test 3: Parallel Execution');
  const startParallel = Date.now();
  const { parsed, analysis } = await analyzeNoteParallel(testNote, mockParser, { useCache: false });
  const parallelLatency = Date.now() - startParallel;
  console.log('Parser output:', JSON.stringify(parsed, null, 2));
  console.log('AI analysis:', JSON.stringify(analysis, null, 2));
  console.log(`Total parallel latency: ${parallelLatency}ms\n`);

  console.log('=== All Tests Complete ===');
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error);
}

export { runTests };
