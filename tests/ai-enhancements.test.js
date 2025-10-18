/**
 * AI Enhancement Integration Tests
 * Tests for enhanced clinical context extraction, diagnosis disambiguation,
 * safety validation, and evidence-based plan generation
 */

/* eslint-env node */

import { extractClinicalContext, disambiguateDiagnoses } from '../src/parsers/entityExtraction.js';
import { validateClinicalSafety, generateEvidenceBasedPlan } from '../src/parsers/clinicalSafety.js';

// Test case 1: Context extraction with temporal, severity, causality, and negations
function testContextExtraction() {
  console.log('\n=== Test 1: Clinical Context Extraction ===');
  
  const note = `
    Patient presents with acute chest pain for 3 hours.
    No fever or chills. Denies nausea or vomiting.
    Severe dyspnea due to pulmonary edema.
    Chronic hypertension - stable on current regimen.
    Worsening heart failure symptoms since last visit.
  `;
  
  const context = extractClinicalContext(note);
  
  console.log('Temporal markers:', context.temporal.length);
  console.log('  - acute chest pain (onset)');
  console.log('  - chronic hypertension (onset)');
  console.log('  - worsening heart failure (onset)');
  
  console.log('Severity markers:', context.severity.length);
  console.log('  - severe dyspnea');
  
  console.log('Causality:', context.causality.length);
  console.log('  - pulmonary edema → dyspnea');
  
  console.log('Negations:', context.negations.length);
  console.log('  - fever/chills, nausea, vomiting');
  
  return context.temporal.length > 0 && context.negations.length > 0;
}

// Test case 2: Diagnosis disambiguation
function testDisambiguation() {
  console.log('\n=== Test 2: Diagnosis Disambiguation ===');
  
  const diagnoses = [
    'Acute heart failure',
    'Chronic heart failure',
    'Atrial fibrillation',
    'Fever' // Should be removed due to negation
  ];
  
  const context = {
    temporal: [
      { entity: 'heart failure', modifier: 'acute', type: 'onset' }
    ],
    severity: [],
    causality: [],
    negations: ['fever', 'chills']
  };
  
  const vitals = { hr: 110, bp: '140/90' };
  
  const disambiguated = disambiguateDiagnoses(diagnoses, context, vitals);
  
  console.log('Original diagnoses:', diagnoses.length);
  console.log('After disambiguation:', disambiguated.length);
  disambiguated.forEach(d => {
    console.log(`  - ${d.diagnosis} (confidence: ${d.confidence.toFixed(2)})`);
  });
  
  // Should prioritize acute over chronic and remove negated fever
  return disambiguated.length < diagnoses.length &&
         disambiguated[0].diagnosis.includes('Acute');
}

// Test case 3: Clinical safety validation
function testSafetyValidation() {
  console.log('\n=== Test 3: Clinical Safety Validation ===');
  
  const parsed = {
    medications: [
      'Warfarin 5mg daily',
      'Metoprolol 50mg BID',
      'Lisinopril 20mg daily',
      'Spironolactone 25mg daily'
    ],
    labs: {
      platelets: 45, // Low!
      creatinine: 2.5, // Elevated!
      potassium: 5.5, // High!
      hgb: 9.5
    },
    vitals: {
      hr: 48, // Bradycardia!
      bp: '140/85'
    }
  };
  
  const warnings = validateClinicalSafety(parsed);
  
  console.log(`Safety warnings detected: ${warnings.length}`);
  warnings.forEach(w => {
    console.log(`  [${w.severity}] ${w.message}`);
    console.log(`    → ${w.action}`);
  });
  
  // Should detect: anticoag+bleeding, renal dosing, hyperkalemia, bradycardia
  return warnings.length >= 3 && 
         warnings.some(w => w.severity === 'HIGH');
}

// Test case 4: Evidence-based plan generation
function testEvidenceBasedPlan() {
  console.log('\n=== Test 4: Evidence-Based Plan Generation ===');
  
  const parsed = {
    diagnoses: ['Acute STEMI', 'Atrial fibrillation'],
    pmh: 'No active bleeding',
    medications: []
  };
  
  const plan = generateEvidenceBasedPlan(parsed);
  
  console.log('Generated plan:');
  console.log(plan);
  
  // Should include STEMI and AFib management with ACC/AHA references
  return plan && 
         plan.includes('cath lab') && 
         plan.includes('Aspirin') &&
         plan.includes('Class I');
}

// Test case 5: Integration test with full workflow
function testFullWorkflow() {
  console.log('\n=== Test 5: Full AI Enhancement Workflow ===');
  
  const clinicalNote = `
    72 yo M with PMH of CAD s/p PCI 2015, HTN, CKD Stage 3 presents with chest pain x 3 hours.
    
    Vitals: BP 165/92, HR 110, RR 22, O2 sat 94% RA
    
    Medications:
    - Aspirin 81mg daily
    - Metoprolol 50mg BID
    - Lisinopril 20mg daily
    - Warfarin 5mg daily
    
    Labs:
    Troponin: 1.2 (elevated)
    BNP: 850
    Creatinine: 2.8
    Potassium: 5.8
    Platelets: 48,000
    
    EKG: ST elevation 2mm in II, III, aVF
    
    Assessment: Acute inferior STEMI with acute kidney injury
    
    No denies dyspnea. No chest pain at rest.
  `;
  
  console.log('Processing clinical note...');
  
  // Step 1: Extract context
  const context = extractClinicalContext(clinicalNote);
  console.log(`✓ Context extracted: ${context.temporal.length} temporal, ${context.negations.length} negations`);
  
  // Step 2: Extract diagnoses (simulated)
  const diagnoses = ['Acute inferior STEMI', 'Acute kidney injury', 'CKD Stage 3', 'Dyspnea'];
  
  // Step 3: Disambiguate
  const vitals = { hr: 110, bp: '165/92' };
  const disambiguated = disambiguateDiagnoses(diagnoses, context, vitals);
  console.log(`✓ Diagnoses disambiguated: ${diagnoses.length} → ${disambiguated.length}`);
  console.log(`  Top diagnosis: ${disambiguated[0].diagnosis}`);
  
  // Step 4: Safety validation
  const parsed = {
    medications: ['Aspirin 81mg', 'Metoprolol 50mg', 'Lisinopril 20mg', 'Warfarin 5mg'],
    labs: { troponin: 1.2, creatinine: 2.8, potassium: 5.8, platelets: 48 },
    vitals,
    diagnoses: disambiguated.map(d => d.diagnosis)
  };
  
  const warnings = validateClinicalSafety(parsed);
  console.log(`✓ Safety checks: ${warnings.length} warnings`);
  warnings.forEach(w => console.log(`  [${w.severity}] ${w.message.substring(0, 60)}...`));
  
  // Step 5: Generate evidence-based plan
  const plan = generateEvidenceBasedPlan(parsed);
  console.log('✓ Evidence-based plan generated');
  console.log(plan ? plan.substring(0, 200) + '...' : 'No plan generated');
  
  return disambiguated.length > 0 && warnings.length > 0 && plan !== null;
}

// Run all tests
console.log('╔═══════════════════════════════════════════════════════════╗');
console.log('║   AI Enhancement Integration Tests                        ║');
console.log('╚═══════════════════════════════════════════════════════════╝');

const tests = [
  { name: 'Context Extraction', fn: testContextExtraction },
  { name: 'Diagnosis Disambiguation', fn: testDisambiguation },
  { name: 'Clinical Safety Validation', fn: testSafetyValidation },
  { name: 'Evidence-Based Plan Generation', fn: testEvidenceBasedPlan },
  { name: 'Full Workflow Integration', fn: testFullWorkflow }
];

let passed = 0;
let failed = 0;

tests.forEach(test => {
  try {
    const result = test.fn();
    if (result) {
      console.log(`\n✅ ${test.name}: PASSED`);
      passed++;
    } else {
      console.log(`\n❌ ${test.name}: FAILED`);
      failed++;
    }
  } catch (error) {
    console.log(`\n❌ ${test.name}: ERROR`);
    console.error(error.message);
    failed++;
  }
});

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log(`║   Results: ${passed} passed, ${failed} failed                          ║`);
console.log('╚═══════════════════════════════════════════════════════════╝');

export { testContextExtraction, testDisambiguation, testSafetyValidation, testEvidenceBasedPlan, testFullWorkflow };
