/**
 * Evidence-Based Clinical Plan Generator
 * Generates guideline-linked recommendations with contraindication checks
 *
 * @module evidenceBasedPlan
 */
/**
 * Guidelines database with evidence-based protocols
 */
export const CLINICAL_GUIDELINES = {
    'STEMI': {
        keywords: ['stemi', 'st elevation', 'acute mi', 'myocardial infarction'],
        actions: [
            'Activate cath lab within 90 minutes (ACC/AHA Class I)',
            'Aspirin 162-325 mg PO (Class I)',
            'P2Y12 inhibitor loading dose: ticagrelor 180mg or clopidogrel 600mg (Class I)',
            'Heparin bolus 60 units/kg (max 4000) + infusion 12 units/kg/hr (Class I)',
            'High-intensity statin (atorvastatin 80mg or rosuvastatin 40mg) (Class I)'
        ],
        contraindications: ['active bleeding', 'recent surgery', 'severe hypertension >180/110'],
        monitoring: ['Serial troponins q6h', 'Continuous telemetry', 'Post-PCI access site checks']
    },
    'Heart Failure': {
        keywords: ['heart failure', 'hf', 'chf', 'decompensated', 'cardiomyopathy'],
        actions: [
            'Optimize GDMT: ACEi/ARB/ARNI (sacubitril-valsartan if EF ≤40%) (Class I)',
            'Beta-blocker (carvedilol/metoprolol succinate/bisoprolol) (Class I)',
            'MRA (spironolactone/eplerenone) if EF <35% and NYHA II-IV (Class I)',
            'SGLT2i (dapagliflozin 10mg or empagliflozin 10mg daily) regardless of diabetes (Class I)'
        ],
        contraindications: ['hyperkalemia >5.5', 'severe renal dysfunction CrCl <30', 'symptomatic hypotension'],
        monitoring: ['Daily weights', 'Strict I&O', 'BNP trend', 'Renal function and potassium q3-5 days']
    },
    'Atrial Fibrillation': {
        keywords: ['atrial fibrillation', 'afib', 'af', 'atrial flutter'],
        actions: [
            'Calculate CHA2DS2-VASc score',
            'Anticoagulation (apixaban 5mg BID or rivaroxaban 20mg daily) if score ≥2 (Class I)',
            'Rate control: beta-blocker (metoprolol) or CCB (diltiazem) target HR <110 (Class I)',
            'Consider rhythm control (cardioversion/ablation) if symptomatic and heart failure'
        ],
        contraindications: ['active bleeding', 'thrombocytopenia <50k', 'HAS-BLED ≥3 (relative)'],
        monitoring: ['HR/rhythm monitoring', 'Renal function if on DOAC', 'Signs of bleeding']
    },
    'Hypertensive Emergency': {
        keywords: ['hypertensive emergency', 'hypertensive crisis', 'malignant hypertension'],
        actions: [
            'IV antihypertensive therapy: labetalol or nicardipine (Class I)',
            'Reduce BP by 10-20% in first hour, then 5-15% over next 23 hours',
            'Evaluate for end-organ damage (AKI, MI, stroke, aortic dissection)',
            'Avoid aggressive BP lowering (risk of ischemia)'
        ],
        contraindications: ['ischemic stroke <24h (relative)', 'severe bradycardia if using labetalol'],
        monitoring: ['Continuous BP monitoring', 'Neuro checks q15min', 'Urine output', 'Cardiac enzymes']
    }
};
/**
 * Generate evidence-based clinical plan
 * @param parsed - Parsed clinical note
 * @returns Formatted evidence-based plan or null if no diagnoses
 */
export function generateEvidenceBasedPlan(parsed) {
    const planSections = [];
    if (!parsed || !parsed.diagnoses || parsed.diagnoses.length === 0) {
        return null;
    }
    // Extract diagnoses (handle both string array and object array)
    const diagnoses = parsed.diagnoses.map(d => typeof d === 'string' ? d : (d.diagnosis || ''));
    // Match diagnoses to guidelines
    for (const dx of diagnoses) {
        const dxLower = dx.toLowerCase();
        for (const [condition, protocol] of Object.entries(CLINICAL_GUIDELINES)) {
            // Check if diagnosis matches any keywords
            const matches = protocol.keywords.some(keyword => dxLower.includes(keyword));
            if (matches) {
                planSections.push(`\n## ${condition} Management (Evidence-Based)`);
                // Check for contraindications in PMH/social history
                const hasContraindication = protocol.contraindications.some(contra => {
                    const contraLower = contra.toLowerCase();
                    return (parsed.pmh?.toLowerCase().includes(contraLower) ||
                        parsed.socialHistory?.toLowerCase().includes(contraLower) ||
                        checkLabContraindication(contra, parsed.labs) ||
                        checkVitalContraindication(contra, parsed.vitals));
                });
                // Add actions with contraindication warnings
                for (const action of protocol.actions) {
                    if (hasContraindication) {
                        planSections.push(`  ⚠️  ${action} - CHECK CONTRAINDICATIONS`);
                    }
                    else {
                        planSections.push(`  ✓ ${action}`);
                    }
                }
                // Add monitoring parameters
                if (protocol.monitoring && protocol.monitoring.length > 0) {
                    planSections.push(`\n  Monitoring:`);
                    for (const m of protocol.monitoring) {
                        planSections.push(`    - ${m}`);
                    }
                }
                // Add specific contraindication notes if present
                if (hasContraindication) {
                    planSections.push(`\n  ⚠️  Contraindications detected - review before implementation:`);
                    for (const contra of protocol.contraindications) {
                        if (parsed.pmh?.toLowerCase().includes(contra.toLowerCase())) {
                            planSections.push(`    - ${contra} (in PMH)`);
                        }
                    }
                }
            }
        }
    }
    return planSections.length > 0 ? planSections.join('\n') : null;
}
/**
 * Check if lab values indicate contraindication
 * @param contraindication - Contraindication text
 * @param labs - Laboratory values
 * @returns True if contraindicated
 */
function checkLabContraindication(contraindication, labs) {
    if (!labs || labs.length === 0)
        return false;
    const contraLower = contraindication.toLowerCase();
    // Check for specific lab-based contraindications
    if (contraLower.includes('hyperkalemia') || contraLower.includes('potassium')) {
        const kLab = labs.find(l => l.name?.toLowerCase().includes('potassium'));
        if (kLab && typeof kLab.value === 'number' && kLab.value > 5.5)
            return true;
    }
    if (contraLower.includes('thrombocytopenia') || contraLower.includes('platelet')) {
        const pltLab = labs.find(l => l.name?.toLowerCase().includes('platelet'));
        if (pltLab && typeof pltLab.value === 'number' && pltLab.value < 50)
            return true;
    }
    if (contraLower.includes('renal') || contraLower.includes('crcl')) {
        const crLab = labs.find(l => l.name?.toLowerCase().includes('creatinine'));
        if (crLab && typeof crLab.value === 'number' && crLab.value > 3.0)
            return true; // Severe renal dysfunction
    }
    if (contraLower.includes('bleeding')) {
        const hgbLab = labs.find(l => l.name?.toLowerCase().includes('hemoglobin'));
        if (hgbLab && typeof hgbLab.value === 'number' && hgbLab.value < 7)
            return true; // Active bleeding suspected
    }
    return false;
}
/**
 * Check if vital signs indicate contraindication
 * @param contraindication - Contraindication text
 * @param vitals - Vital signs
 * @returns True if contraindicated
 */
function checkVitalContraindication(contraindication, vitals) {
    if (!vitals)
        return false;
    const contraLower = contraindication.toLowerCase();
    // Check for vital sign-based contraindications
    if (contraLower.includes('hypotension')) {
        if (vitals.systolic && vitals.systolic < 90)
            return true;
        if (vitals.bp && /\d+\/\d+/.test(vitals.bp)) {
            const matches = vitals.bp.match(/\d+/g);
            if (matches && matches.length > 0) {
                const sys = Number(matches[0]);
                if (sys < 90)
                    return true;
            }
        }
    }
    if (contraLower.includes('hypertension') && contraLower.includes('severe')) {
        if (vitals.systolic && vitals.systolic > 180)
            return true;
        if (vitals.bp && /\d+\/\d+/.test(vitals.bp)) {
            const matches = vitals.bp.match(/\d+/g);
            if (matches && matches.length >= 2) {
                const [sys, dia] = matches.map(Number);
                if (sys > 180 || dia > 110)
                    return true;
            }
        }
    }
    if (contraLower.includes('bradycardia')) {
        if (vitals.hr && vitals.hr < 50)
            return true;
    }
    if (contraLower.includes('tachycardia')) {
        if (vitals.hr && vitals.hr > 120)
            return true;
    }
    return false;
}
/**
 * Get guideline reference for a specific condition
 * @param condition - Clinical condition
 * @returns Guideline data or null
 */
export function getGuidelineReference(condition) {
    const conditionUpper = condition.toUpperCase();
    return CLINICAL_GUIDELINES[conditionUpper] || null;
}
/**
 * List all available guidelines
 * @returns List of condition names
 */
export function listAvailableGuidelines() {
    return Object.keys(CLINICAL_GUIDELINES);
}
//# sourceMappingURL=evidenceBasedPlan.js.map