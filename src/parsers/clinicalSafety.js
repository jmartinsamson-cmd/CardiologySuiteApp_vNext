/**
 * Clinical Safety Validation Module
 * Validates clinical logic and flags safety concerns
 */

/**
 * Validate clinical logic and flag safety concerns
 * @param {Object} parsed - Parsed note data
 * @returns {Array<{severity: string, message: string, action: string}>} Safety warnings
 */
export function validateClinicalSafety(parsed) {
  const warnings = [];

  if (!parsed) return warnings;

  // Check 1: Anticoagulation + bleeding risk
  const medications = parsed.medications || [];
  const labs = parsed.labs || {};
  
  const onAnticoag = medications.some(m => 
    typeof m === 'string' && /warfarin|heparin|apixaban|rivaroxaban|dabigatran|enoxaparin/i.test(m)
  );
  
  const bleedingRisk = (labs.platelets && labs.platelets < 50) || 
                       (labs.hgb && labs.hgb < 8) ||
                       (labs.hemoglobin && labs.hemoglobin < 8);
  
  if (onAnticoag && bleedingRisk) {
    warnings.push({
      severity: 'HIGH',
      message: 'Patient on anticoagulation with bleeding risk (low platelets/Hgb)',
      action: 'Consider holding anticoagulation and hematology consult'
    });
  }

  // Check 2: Renal dosing adjustments
  const creatinine = labs.creatinine;
  if (creatinine && creatinine > 2.0) {
    const renalDosedMeds = medications.filter(m => 
      typeof m === 'string' && /metformin|enoxaparin|dabigatran|fondaparinux/i.test(m)
    );
    if (renalDosedMeds.length > 0) {
      warnings.push({
        severity: 'MEDIUM',
        message: `Renal dysfunction (Cr ${creatinine}) with meds requiring adjustment`,
        action: `Review dosing for: ${renalDosedMeds.join(', ')}`
      });
    }
  }

  // Check 3: Potassium + ACEi/ARB + MRA (hyperkalemia risk)
  const potassium = labs.potassium || labs.k;
  const onRAAS = medications.some(m => 
    typeof m === 'string' && /lisinopril|losartan|spironolactone|eplerenone|enalapril|valsartan/i.test(m)
  );
  if (potassium && potassium > 5.0 && onRAAS) {
    warnings.push({
      severity: 'HIGH',
      message: `Hyperkalemia (K+ ${potassium}) on RAAS inhibitors`,
      action: 'Consider reducing MRA dose, check EKG for peaked T waves'
    });
  }

  // Check 4: Beta-blocker + bradycardia
  const vitals = parsed.vitals || {};
  const hr = vitals.hr;
  const onBetaBlocker = medications.some(m => 
    typeof m === 'string' && /metoprolol|carvedilol|bisoprolol|atenolol/i.test(m)
  );
  if (hr && hr < 50 && onBetaBlocker) {
    warnings.push({
      severity: 'MEDIUM',
      message: `Bradycardia (HR ${hr}) on beta-blocker`,
      action: 'Consider holding next dose, check for symptoms (dizziness, syncope)'
    });
  }

  // Check 5: Hypotension + antihypertensives
  const bp = vitals.bp;
  if (bp && typeof bp === 'string') {
    const [systolic] = bp.split('/').map(v => parseInt(v));
    if (systolic && systolic < 90) {
      const onAntihypertensives = medications.some(m => 
        typeof m === 'string' && /amlodipine|lisinopril|losartan|metoprolol|hydralazine/i.test(m)
      );
      if (onAntihypertensives) {
        warnings.push({
          severity: 'HIGH',
          message: `Hypotension (SBP ${systolic}) on antihypertensives`,
          action: 'Consider holding doses, assess for shock, check orthostatics'
        });
      }
    }
  }

  // Check 6: Digoxin + renal dysfunction
  const onDigoxin = medications.some(m => typeof m === 'string' && /digoxin/i.test(m));
  if (onDigoxin && creatinine && creatinine > 1.5) {
    warnings.push({
      severity: 'MEDIUM',
      message: `Digoxin with elevated creatinine (${creatinine})`,
      action: 'Check digoxin level, consider dose adjustment'
    });
  }

  // Check 7: Elevated BNP + no diuretic
  const bnp = labs.bnp;
  const onDiuretic = medications.some(m => 
    typeof m === 'string' && /furosemide|lasix|bumetanide|torsemide/i.test(m)
  );
  if (bnp && bnp > 500 && !onDiuretic) {
    warnings.push({
      severity: 'MEDIUM',
      message: `Elevated BNP (${bnp}) without diuretic therapy`,
      action: 'Consider volume status assessment and diuretic initiation'
    });
  }

  // Check 8: Troponin elevation without antiplatelet
  const troponin = labs.troponin;
  const onAntiplatelet = medications.some(m => 
    typeof m === 'string' && /aspirin|asa|plavix|clopidogrel|ticagrelor|prasugrel/i.test(m)
  );
  if (troponin && troponin > 0.04 && !onAntiplatelet) {
    warnings.push({
      severity: 'HIGH',
      message: `Elevated troponin (${troponin}) without antiplatelet therapy`,
      action: 'Consider ACS workup, aspirin loading if no contraindications'
    });
  }

  return warnings;
}

/**
 * Generate evidence-based plan with guideline references
 * @param {Object} parsed - Parsed note data
 * @returns {string|null} Generated plan text with guidelines
 */
export function generateEvidenceBasedPlan(parsed) {
  const plan = [];
  
  const guidelines = {
    'STEMI': {
      actions: [
        'Activate cath lab within 90 minutes (ACC/AHA Class I)',
        'Aspirin 162-325 mg PO (Class I)',
        'P2Y12 inhibitor loading dose: ticagrelor 180mg or clopidogrel 600mg (Class I)',
        'Heparin bolus 60 units/kg (max 4000) + infusion 12 units/kg/hr (Class I)',
        'High-intensity statin (atorvastatin 80mg or rosuvastatin 40mg) (Class I)'
      ],
      contraindications: ['recent surgery', 'active bleeding', 'severe hypertension']
    },
    'Heart Failure': {
      actions: [
        'Optimize GDMT: ACEi/ARB/ARNI (Class I)',
        'Beta-blocker (carvedilol/metoprolol succinate/bisoprolol) titrate to target (Class I)',
        'MRA (spironolactone/eplerenone) if EF <35% (Class I)',
        'SGLT2i (dapagliflozin 10mg or empagliflozin 10mg) (Class I)',
        'Loop diuretic (furosemide) titrate to euvolemia (Class I)'
      ],
      monitoring: ['Daily weights', 'Strict I&O', 'BNP trend', 'Renal function', 'Potassium']
    },
    'Atrial Fibrillation': {
      actions: [
        'Calculate CHA2DS2-VASc score',
        'Anticoagulation (apixaban 5mg BID or rivaroxaban 20mg daily) if score ≥2 (Class I)',
        'Rate control: beta-blocker (metoprolol) or CCB (diltiazem) target HR <110 (Class I)',
        'Consider rhythm control (cardioversion/ablation) if symptomatic and heart failure'
      ],
      contraindications: ['HAS-BLED ≥3', 'recent bleeding', 'thrombocytopenia <50k']
    },
    'Hypertension': {
      actions: [
        'Target BP <130/80 (ACC/AHA 2017)',
        'First-line: ACEi/ARB or CCB or thiazide diuretic (Class I)',
        'If Black patient: CCB or thiazide preferred (Class I)',
        'If CKD/proteinuria: ACEi/ARB preferred (Class I)'
      ],
      monitoring: ['Home BP log', 'Renal function', 'Electrolytes']
    }
  };

  // Match diagnoses to guidelines
  const diagnoses = parsed.diagnoses || parsed.assessment || [];
  const diagnosisStrings = diagnoses.map(d => 
    typeof d === 'string' ? d : d.diagnosis || String(d)
  );

  diagnosisStrings.forEach(dx => {
    const dxLower = dx.toLowerCase();
    
    // Check each guideline
    Object.entries(guidelines).forEach(([condition, protocol]) => {
      if (dxLower.includes(condition.toLowerCase()) || 
          (condition === 'Heart Failure' && (dxLower.includes('hf') || dxLower.includes('chf'))) ||
          (condition === 'Atrial Fibrillation' && dxLower.includes('afib'))) {
        
        plan.push(`\n## ${condition} Management (Evidence-Based)`);
        
        // Add actions with safety checks
        const pmh = parsed.pmh || parsed.pastMedicalHistory || '';
        const socialHistory = parsed.socialHistory || '';
        
        protocol.actions.forEach(action => {
          const contraindicated = protocol.contraindications?.some(contra => 
            (typeof pmh === 'string' && pmh.toLowerCase().includes(contra)) || 
            (typeof socialHistory === 'string' && socialHistory.toLowerCase().includes(contra))
          );
          
          if (contraindicated) {
            plan.push(`  ⚠️  ${action} - CHECK CONTRAINDICATIONS`);
          } else {
            plan.push(`  ✓ ${action}`);
          }
        });

        // Add monitoring
        if (protocol.monitoring) {
          plan.push(`\n  Monitoring:`);
          protocol.monitoring.forEach(m => plan.push(`    - ${m}`));
        }
      }
    });
  });

  return plan.length > 0 ? plan.join('\n') : null;
}
