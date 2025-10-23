/* eslint-env node */
// Test evidence-based plan integration with templateRenderer
import './src/parsers/evidenceBasedPlanBridge.js'; // Load the bridge
import './src/utils/parserHelpers.js'; // Load parser dependencies
import './src/parsers/noteParser.js';
import './src/parsers/templateRenderer.js';

// Wait a moment for the bridge to initialize
await new Promise(resolve => setTimeout(resolve, 100));

console.log('🧪 Testing Evidence-Based Plan Integration with TemplateRenderer\n');

// Sample clinical note with STEMI
const stemiNote = `
Chief Complaint: Chest pain

History of Present Illness:
68-year-old male presents with acute onset chest pain x 2 hours. 
Pain described as crushing, substernal, radiating to left arm.
Associated with nausea and diaphoresis.

Past Medical History: Diabetes, Hypertension

Vital Signs:
BP: 180/110, HR: 85, RR: 18, Temp: 98.6F, O2Sat: 98% RA

Labs:
Troponin: 15.2 ng/mL (H)
Potassium: 4.2 mEq/L
Creatinine: 1.1 mg/dL

Assessment:
STEMI - acute ST elevation myocardial infarction
Hypertension

Plan:
Standard STEMI protocol initiated.
`;

console.log('📝 Parsing clinical note...');
const parsed = globalThis.parseClinicalNote(stemiNote);
console.log(`✅ Parsed: ${parsed.diagnoses?.length || 0} diagnoses, ${parsed.labs?.length || 0} labs\n`);

console.log('📋 Testing templateRenderer with evidence-based plan...');
const renderer = new globalThis.TemplateRenderer();
const rendered = renderer.renderTemplate(parsed, { format: 'CIS', includeEvidence: true });

console.log('Generated Template:');
console.log('================');
console.log(rendered);

console.log('\n✅ Integration testing complete');