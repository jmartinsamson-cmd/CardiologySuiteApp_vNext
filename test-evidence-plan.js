/* eslint-env node */
// Test the evidence-based plan generator with sample clinical notes
import { generateEvidenceBasedPlan, listAvailableGuidelines } from './src/parsers/evidenceBasedPlan.js';

console.log('🧪 Testing Evidence-Based Plan Generator\n');

// Test 1: STEMI case
console.log('📝 Test 1: STEMI Case');
const stemiNote = {
  diagnoses: ['STEMI', 'Hypertension'],
  vitals: { bp: '180/110', hr: 85 },
  labs: [
    { name: 'Troponin', value: 15.2, unit: 'ng/mL' },
    { name: 'Potassium', value: 4.2, unit: 'mEq/L' }
  ],
  pmh: 'DM, HTN'
};

const stemiPlan = generateEvidenceBasedPlan(stemiNote);
console.log('Generated Plan:');
console.log(stemiPlan || 'No plan generated');
console.log();

// Test 2: Heart Failure with contraindications
console.log('📝 Test 2: Heart Failure with Hyperkalemia');
const hfNote = {
  diagnoses: [{ diagnosis: 'Heart failure with reduced EF' }],
  vitals: { bp: '85/60', hr: 110 },
  labs: [
    { name: 'Potassium', value: 5.8, unit: 'mEq/L' },
    { name: 'Creatinine', value: 2.1, unit: 'mg/dL' }
  ],
  pmh: 'HFrEF, CKD'
};

const hfPlan = generateEvidenceBasedPlan(hfNote);
console.log('Generated Plan:');
console.log(hfPlan || 'No plan generated');
console.log();

// Test 3: Atrial Fibrillation
console.log('📝 Test 3: Atrial Fibrillation');
const afibNote = {
  diagnoses: ['Atrial fibrillation', 'Stroke risk'],
  vitals: { bp: '140/85', hr: 95 },
  labs: [
    { name: 'Platelet', value: 180, unit: 'k/uL' }
  ],
  pmh: 'HTN, DM'
};

const afibPlan = generateEvidenceBasedPlan(afibNote);
console.log('Generated Plan:');
console.log(afibPlan || 'No plan generated');
console.log();

// Test 4: List available guidelines
console.log('📋 Available Clinical Guidelines:');
const guidelines = listAvailableGuidelines();
console.log(guidelines.join(', '));
console.log();

console.log('✅ Evidence-based plan testing complete');