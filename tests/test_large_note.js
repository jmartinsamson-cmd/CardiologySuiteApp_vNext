/**
 * Test file for large clinical note processing
 * Tests performance improvements for freezing issues with large notes
 */

// Generate a large clinical note for testing (>20k characters)
const generateLargeNote = () => {
  const hpi = `
History of Present Illness:
Mr. John Smith is a 68-year-old male with a past medical history significant for coronary artery disease status post CABG x3 (LIMA to LAD, SVG to OM, SVG to PDA) performed in 2018, hypertension, hyperlipidemia, type 2 diabetes mellitus, chronic kidney disease stage 3, atrial fibrillation on anticoagulation, and congestive heart failure with reduced ejection fraction (EF 35% on most recent echo 3 months ago) who presents to the emergency department today with complaints of worsening shortness of breath and bilateral lower extremity edema over the past 5-7 days.

The patient reports that he has been generally doing well since his last hospitalization 6 months ago for acute decompensated heart failure. However, approximately one week prior to presentation, he began noticing increased dyspnea on exertion. Initially, he could walk approximately 2-3 blocks before becoming short of breath, but over the past few days, he has difficulty walking from his bedroom to the bathroom without having to stop and catch his breath. He denies any chest pain, but does report some mild pressure sensation in his chest with exertion that resolves with rest. He also notes orthopnea (now requiring 3 pillows to sleep, up from his baseline of 1 pillow) and paroxysmal nocturnal dyspnea, waking up 2-3 times per night feeling like he cannot breathe.

Additionally, the patient has noticed progressive bilateral lower extremity swelling over the same timeframe. He states his ankles and feet have become increasingly swollen, and he can no longer fit into his regular shoes. He has been wearing slippers for the past 3 days. The edema extends up to his mid-shins bilaterally and leaves significant pitting when pressed. He denies any leg pain, redness, or warmth that would suggest DVT or cellulitis.

The patient admits to dietary indiscretion over the past 2 weeks, including consuming multiple canned soups, deli meats, and eating out at restaurants more frequently than usual due to having family visiting from out of town. He has been checking his weight daily at home and notes a 12-pound weight gain over the past 10 days (from his baseline of 185 lbs to current 197 lbs). He has been compliant with his medications, including his diuretic regimen (furosemide 40mg twice daily), but states "it doesn't seem to be working like it used to."

Review of his home medications shows he is currently taking: aspirin 81mg daily, clopidogrel 75mg daily, metoprolol succinate 200mg daily, lisinopril 20mg daily, atorvastatin 80mg daily, furosemide 40mg twice daily, spironolactone 25mg daily, apixaban 5mg twice daily, metformin 1000mg twice daily, and glipizide 10mg daily.

He denies any fever, chills, cough, sputum production, hemoptysis, recent upper respiratory infection symptoms, nausea, vomiting, diarrhea, abdominal pain, or urinary symptoms. He has not had any recent medication changes. He denies any recent travel or sick contacts. He continues to follow up regularly with his primary care physician and cardiologist.

His most recent labs from 2 weeks ago showed: creatinine 1.8 mg/dL (baseline 1.6-1.8), BUN 42 mg/dL, sodium 138 mEq/L, potassium 4.2 mEq/L, hemoglobin 11.2 g/dL (stable anemia, chronic disease), and BNP 1450 pg/mL (up from 800 at his last check 3 months ago).

Past Medical History:
1. Coronary artery disease - CABG x3 in 2018 (LIMA to LAD, SVG to OM, SVG to PDA)
2. Prior myocardial infarction - anterior STEMI in 2017, treated with primary PCI to LAD
3. Systolic heart failure - ischemic cardiomyopathy with EF 35%
4. Atrial fibrillation - paroxysmal, on anticoagulation, CHA2DS2-VASc score of 5
5. Hypertension - diagnosed 15 years ago
6. Hyperlipidemia - on high-intensity statin therapy
7. Type 2 diabetes mellitus - diagnosed 10 years ago, HbA1c 7.2% 3 months ago
8. Chronic kidney disease stage 3 - baseline creatinine 1.6-1.8 mg/dL
9. Anemia of chronic disease - baseline hemoglobin 11-12 g/dL
10. Peripheral vascular disease - s/p right femoral-popliteal bypass 2019
11. Hypothyroidism - on levothyroxine replacement

Past Surgical History:
1. CABG x3 (2018)
2. Primary PCI to LAD with drug-eluting stent placement (2017)
3. Right femoral-popliteal bypass (2019)
4. Cholecystectomy (2010)
5. Right inguinal hernia repair (2015)

Family History:
Father deceased at age 62 from myocardial infarction. Mother deceased at age 75 from stroke. Brother age 70 with history of coronary artery disease and hypertension. Sister age 65 with diabetes mellitus type 2. No family history of sudden cardiac death, cardiomyopathy, or arrhythmias at young age.

Social History:
The patient is a retired construction worker. He is married and lives with his wife in a single-story home. He has good family support. He quit smoking 8 years ago after his heart attack but has a 40 pack-year smoking history. He denies current tobacco use. He drinks alcohol occasionally, approximately 1-2 beers per week. He denies any illicit drug use. He is able to perform most activities of daily living independently but requires assistance with heavy housework and yard work.

Medications (as listed above):
- Aspirin 81mg PO daily
- Clopidogrel 75mg PO daily
- Metoprolol succinate 200mg PO daily
- Lisinopril 20mg PO daily
- Atorvastatin 80mg PO daily
- Furosemide 40mg PO twice daily
- Spironolactone 25mg PO daily
- Apixaban 5mg PO twice daily
- Metformin 1000mg PO twice daily
- Glipizide 10mg PO daily
- Levothyroxine 100mcg PO daily

Allergies: No known drug allergies (NKDA)

Review of Systems:
Constitutional: Reports fatigue and decreased exercise tolerance. Denies fever, chills, or unintentional weight loss.
Cardiovascular: As per HPI - shortness of breath, orthopnea, PND, lower extremity edema. Denies chest pain at rest, palpitations, or syncope.
Respiratory: Denies cough, wheezing, hemoptysis, or pleuritic chest pain.
Gastrointestinal: Denies nausea, vomiting, diarrhea, constipation, abdominal pain, melena, or hematochezia.
Genitourinary: Denies dysuria, hematuria, or changes in urinary frequency. Notes good urine output.
Neurological: Denies headache, dizziness, weakness, numbness, or changes in vision.
Musculoskeletal: Denies joint pain or muscle aches beyond usual chronic back pain.
Skin: Denies rashes, lesions, or skin changes.

Physical Examination:
Vital Signs: Temperature 98.2°F, Blood Pressure 142/88 mmHg, Heart Rate 88 bpm (irregularly irregular), Respiratory Rate 22/min, Oxygen Saturation 92% on room air, Weight 197 lbs (up from 185 lbs baseline)

General: Alert and oriented x3, mild respiratory distress, able to speak in full sentences but pausing occasionally to catch breath

HEENT: Normocephalic, atraumatic. Pupils equal, round, reactive to light. Conjunctivae pale. Oropharynx clear without erythema or exudates. Mucous membranes moist.

Neck: Jugular venous distension present to approximately 10 cm above the sternal angle at 45 degrees. No lymphadenopathy. Thyroid non-enlarged.

Cardiovascular: Irregularly irregular rhythm, normal S1 and S2. S3 gallop present. No murmurs or rubs appreciated. Bilateral lower extremity edema 3+ pitting to mid-shins. Pedal pulses 2+ bilaterally. No cyanosis.

Respiratory: Tachypneic. Bilateral crackles heard in lower lung fields to mid-lung fields. No wheezing. Decreased breath sounds at bases bilaterally. No use of accessory muscles.

Abdominal: Soft, mildly distended. Non-tender to palpation. Bowel sounds present in all quadrants. No hepatosplenomegaly appreciated, though liver edge palpable 2cm below costal margin. No rebound or guarding.

Extremities: Warm, well-perfused. 3+ pitting edema bilaterally to mid-shins. No cyanosis or clubbing. Well-healed surgical scars on right leg from bypass surgery.

Neurological: Alert and oriented to person, place, and time. Cranial nerves II-XII grossly intact. Motor strength 5/5 in all extremities. Sensation intact to light touch. Gait not assessed due to patient's respiratory distress.

Skin: Warm and dry. No rashes or lesions noted. Good capillary refill.

Laboratory Results:
CBC: WBC 8.2 K/uL, Hemoglobin 10.8 g/dL, Hematocrit 32.1%, Platelets 245 K/uL
BMP: Sodium 136 mEq/L, Potassium 4.5 mEq/L, Chloride 102 mEq/L, Bicarbonate 24 mEq/L, BUN 48 mg/dL, Creatinine 2.1 mg/dL (up from baseline 1.8), Glucose 156 mg/dL
Cardiac: Troponin I <0.01 ng/mL, BNP 2450 pg/mL (significantly elevated from 1450 two weeks ago)
Liver: AST 35 U/L, ALT 42 U/L, Alkaline Phosphatase 88 U/L, Total Bilirubin 1.2 mg/dL, Albumin 3.4 g/dL
Coagulation: PT 13.2 seconds, INR 1.1, PTT 32 seconds
Magnesium 2.0 mEq/L, Phosphorus 3.8 mg/dL

Diagnostic Studies:
Chest X-ray: Cardiomegaly with increased cardiac silhouette. Bilateral pleural effusions, moderate on right, small on left. Pulmonary vascular congestion with cephalization. No focal consolidation. No pneumothorax.

ECG: Atrial fibrillation with rapid ventricular response, rate 110-120 bpm. Left ventricular hypertrophy. Non-specific ST-T wave changes in lateral leads. Old Q waves in anterior leads consistent with prior myocardial infarction. No acute ST segment elevation or depression.
`;

  return hpi;
};

// Test function
const testLargeNoteProcessing = () => {
  console.log('=== Large Note Processing Test ===\n');

  const largeNote = generateLargeNote();
  const charCount = largeNote.length;

  console.log(`✓ Generated test note: ${charCount} characters (~${Math.round(charCount/1000)}k)`);
  console.log(`✓ Note is ${charCount > 20000 ? 'VERY LARGE (>20k)' : charCount > 10000 ? 'LARGE (>10k)' : 'MEDIUM'}`);
  console.log('\n--- Expected Behavior ---');
  console.log('1. Progress messages should appear at each stage');
  console.log('2. UI should remain responsive (no freezing)');
  console.log('3. Adaptive delays based on note size should be applied');
  console.log('4. UI yield points should prevent blocking');
  console.log('\n--- Test Note Content Preview ---');
  console.log(largeNote.substring(0, 500) + '...\n');
  console.log('--- Labs Extraction Test ---');
  console.log('Should extract: Creatinine 2.1, BUN 48, BNP 2450, Magnesium 2.0, Phosphorus 3.8, ALT 42, AST 35');
  console.log('\n--- Vitals Extraction Test ---');
  console.log('Should extract: BP 142/88, HR 88 bpm, RR 22/min, O2 92% on room air, Temp 98.2°F');
  console.log('\n=== To run this test: ===');
  console.log('1. Open the Cardiology Suite application in browser');
  console.log('2. Paste the generated note into the input');
  console.log('3. Click Parse and observe:');
  console.log('   - Progress messages appearing');
  console.log('   - UI remaining responsive');
  console.log('   - All vitals and labs extracted correctly');
  console.log('   - Processing completing without freezing');

  return largeNote;
};

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { generateLargeNote, testLargeNoteProcessing };
}

// Auto-run if loaded directly
if (typeof window !== 'undefined') {
  window.testLargeNote = testLargeNoteProcessing();
}

// Run test
const testNote = testLargeNoteProcessing();
console.log('\n✓ Test file created successfully');
console.log('✓ Large note ready for testing');
