/**
 * Test AI Integration in Frontend
 * 
 * This script simulates the frontend workflow:
 * 1. Parse note with base parser
 * 2. Enrich with AI analysis
 * 3. Normalize sections
 * 4. Check that AI content made it into normalized sections
 */

import { enrichWithAIAnalysis } from '../src/parsers/aiAnalyzer.js';

const testNote = `
65-year-old male presenting with chest pain.

Chief Complaint: Chest pain

History of Present Illness:
Patient reports chest discomfort that started 2 hours ago while watching TV. Describes it as pressure-like, substernal, radiating to left arm. Associated with diaphoresis and mild shortness of breath. Denies nausea or vomiting. Has history of hypertension and hyperlipidemia. Takes daily aspirin.

Past Medical History:
- Hypertension
- Hyperlipidemia
- Type 2 Diabetes

Vital Signs:
BP 155/92, HR 88, RR 18, SpO2 97% on RA, Temp 98.2°F

Physical Exam:
Gen: Alert, uncomfortable appearing, diaphoretic
CV: Regular rate and rhythm, no murmurs
Lungs: Clear bilaterally
Ext: No edema

Medical Decision Making:
ECG shows ST elevation in leads II, III, and aVF. Troponin elevated at 2.5 ng/mL.

X-Ray Report:
Chest X-ray: No acute cardiopulmonary process. Heart size normal. Lungs clear.

ED Course:
Patient given aspirin 325mg, clopidogrel 300mg, and started on heparin drip. Cardiology consulted for urgent cardiac catheterization.
`.trim();

async function testAIIntegration() {
  console.log('='.repeat(80));
  console.log('Testing AI Integration in Frontend Workflow');
  console.log('='.repeat(80));
  console.log('');
  
  // Step 1: Simulate base parser result
  console.log('Step 1: Simulating base parser result...');
  const baseResult = {
    fullText: testNote,
    sections: {
      'Chief Complaint': 'Chest pain',
      'History of Present Illness': testNote.split('History of Present Illness:')[1]?.split('Past Medical History:')[0]?.trim() || '',
      'Past Medical History': '- Hypertension\n- Hyperlipidemia\n- Type 2 Diabetes',
      'Vital Signs': 'BP 155/92, HR 88, RR 18, SpO2 97% on RA, Temp 98.2°F',
      'Physical Exam': 'Gen: Alert, uncomfortable appearing, diaphoretic\nCV: Regular rate and rhythm, no murmurs\nLungs: Clear bilaterally\nExt: No edema'
    }
  };
  
  console.log('✓ Base sections:', Object.keys(baseResult.sections).join(', '));
  console.log('');
  
  // Step 2: Enrich with AI
  console.log('Step 2: Calling AI enrichment...');
  console.log('  (This calls http://127.0.0.1:8081/api/analyze-note)');
  console.log('');
  
  let enriched;
  try {
    enriched = await enrichWithAIAnalysis(baseResult, testNote);
  } catch (error) {
    console.error('❌ AI enrichment failed:', error.message);
    console.error('');
    console.error('Make sure the AI server is running on port 8081:');
    console.error('  cd /workspaces/CardiologySuiteApp_vNext');
    console.error('  $env:PORT=8081; node services/ai-search/server.js');
    console.error('');
    process.exit(1);
  }
  
  console.log('✓ AI enrichment complete');
  console.log('');
  
  // Step 3: Check enrichment results
  console.log('Step 3: Checking enrichment results...');
  console.log('');
  
  console.log('Sections after enrichment:', Object.keys(enriched.sections).join(', '));
  console.log('');
  
  // Check if AI data was injected
  const hasAIAssessment = enriched.sections.ASSESSMENT && enriched.sections.ASSESSMENT.length > 0;
  const hasAIPlan = enriched.sections.PLAN && enriched.sections.PLAN.length > 0;
  
  console.log('AI Data Injection Status:');
  console.log(`  ASSESSMENT section: ${hasAIAssessment ? '✓ POPULATED' : '❌ MISSING'}`);
  console.log(`  PLAN section: ${hasAIPlan ? '✓ POPULATED' : '❌ MISSING'}`);
  console.log('');
  
  if (hasAIAssessment) {
    console.log('ASSESSMENT Section Content:');
    console.log('-'.repeat(80));
    console.log(enriched.sections.ASSESSMENT);
    console.log('-'.repeat(80));
    console.log('');
  }
  
  if (hasAIPlan) {
    console.log('PLAN Section Content:');
    console.log('-'.repeat(80));
    console.log(enriched.sections.PLAN);
    console.log('-'.repeat(80));
    console.log('');
  }
  
  // Check AI metadata
  console.log('AI Metadata:');
  console.log(`  Assessment array: ${enriched.assessment ? enriched.assessment.length + ' items' : 'none'}`);
  console.log(`  Plan array: ${enriched.plan ? enriched.plan.length + ' items' : 'none'}`);
  console.log(`  Citations: ${enriched.citations ? enriched.citations.length + ' items' : 'none'}`);
  console.log(`  Evidence docs: ${enriched.evidenceDocs ? enriched.evidenceDocs.length + ' items' : 'none'}`);
  console.log('');
  
  if (enriched.assessment && Array.isArray(enriched.assessment)) {
    console.log('AI Assessment Details:');
    enriched.assessment.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });
    console.log('');
  }
  
  if (enriched.plan && Array.isArray(enriched.plan)) {
    console.log('AI Plan Details:');
    enriched.plan.forEach((item, i) => {
      console.log(`  ${i + 1}. ${item}`);
    });
    console.log('');
  }
  
  // Final verdict
  console.log('='.repeat(80));
  if (hasAIAssessment && hasAIPlan) {
    console.log('✅ SUCCESS: AI content successfully integrated into sections!');
    console.log('');
    console.log('The frontend will now:');
    console.log('  1. Parse the note with base parser');
    console.log('  2. Call enrichWithAIAnalysis() to add AI-generated assessment/plan');
    console.log('  3. Normalize sections (ASSESSMENT and PLAN now include AI content)');
    console.log('  4. Render template with AI-enriched data');
  } else {
    console.log('⚠️  PARTIAL: AI enrichment ran but sections not fully populated');
    console.log('');
    console.log('This could mean:');
    console.log('  - AI server returned no/empty assessment or plan');
    console.log('  - Note is too short for AI analysis');
    console.log('  - Base parser already had good ASSESSMENT/PLAN (>50 chars)');
  }
  console.log('='.repeat(80));
}

testAIIntegration().catch(error => {
  console.error('');
  console.error('❌ Test failed with error:', error);
  console.error('');
  process.exit(1);
});
