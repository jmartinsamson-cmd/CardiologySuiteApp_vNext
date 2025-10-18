# AI Enhancement Quick Reference

**Quick guide for using enhanced AI features in the cardiology suite.**

---

## 🚀 Quick Start

### Import Enhanced Functions

```javascript
// Clinical context extraction
import { extractClinicalContext, disambiguateDiagnoses } from './src/parsers/entityExtraction.js';

// Safety validation
import { validateClinicalSafety } from './src/parsers/clinicalSafety.js';

// Evidence-based recommendations
import { generateEvidenceBasedPlan } from './src/parsers/evidenceBasedPlan.js';
```

### Basic Usage Pattern

```javascript
async function enhancedParsing(noteText) {
  // Step 1: Parse
  const parsed = await window.parseClinicalNoteFull(noteText);
  
  // Step 2: Extract context
  const context = extractClinicalContext(noteText);
  
  // Step 3: Disambiguate
  parsed.diagnoses = disambiguateDiagnoses(parsed.diagnoses, context, parsed.vitals);
  
  // Step 4: Safety check
  parsed.safetyWarnings = validateClinicalSafety(parsed);
  
  // Step 5: Generate plan
  parsed.plan = [generateEvidenceBasedPlan(parsed)];
  
  return parsed;
}
```

---

## 📋 Feature Cheat Sheet

### Context Extraction

```javascript
const context = extractClinicalContext("Acute chest pain x 3 hours, chronic HTN, no fever");
// Returns:
// {
//   temporal: [{entity: "chest pain", modifier: "3 hours", type: "duration"}],
//   severity: [],
//   causality: [],
//   negations: ["fever"]
// }
```

**Detects**:
- ⏰ Temporal: "acute", "chronic", "x 3 hours", "since 2020"
- 📊 Severity: "mild", "moderate", "severe", "stable", "worsening"
- 🔗 Causality: "A causing B", "B due to A"
- ❌ Negations: "no", "denies", "negative for"

---

### Diagnosis Disambiguation

```javascript
const diagnoses = ["Acute MI", "Chronic CAD", "No PE"];
const disambiguated = disambiguateDiagnoses(diagnoses, context, vitals);
// Returns:
// [
//   {diagnosis: "Acute MI", confidence: 1.0, warnings: []},
//   // "Chronic CAD" removed (acute takes priority)
//   // "No PE" removed (negated)
// ]
```

**Rules**:
1. ✅ Acute > Chronic (when conflict)
2. ❌ Remove negated diagnoses
3. ⚠️ Flag vital sign inconsistencies
4. 🔗 Attach causal evidence

---

### Safety Validation

```javascript
const parsed = {
  medications: ["warfarin", "metoprolol"],
  labs: [{name: "platelets", value: 45}],
  vitals: {hr: 48}
};

const warnings = validateClinicalSafety(parsed);
// Returns:
// [
//   {severity: "HIGH", message: "Anticoagulation + bleeding risk", action: "..."},
//   {severity: "MEDIUM", message: "Bradycardia on beta-blocker", action: "..."}
// ]
```

**Checks**:
- 🩸 Anticoagulation + bleeding (platelets <50, Hgb <8)
- 🫘 Renal dosing (Cr >2.0 + renally cleared meds)
- ⚡ Hyperkalemia (K+ >5.0 + RAAS inhibitors)
- 💓 Bradycardia (HR <50 + beta-blocker)

---

### Evidence-Based Plans

```javascript
const parsed = {
  diagnoses: [{diagnosis: "STEMI"}],
  pmh: ["recent GI bleed"] // Contraindication
};

const plan = generateEvidenceBasedPlan(parsed);
// Returns markdown with:
// ## STEMI Management (Evidence-Based)
//   ⚠️ Activate cath lab (Class I) - CHECK CONTRAINDICATIONS
//   ⚠️ Aspirin 162-325mg (Class I) - CHECK CONTRAINDICATIONS
```

**Supported**:
- 🫀 STEMI (5 core interventions)
- 💔 Heart Failure (GDMT: 4 pillars)
- ⚡ Atrial Fibrillation (CHA2DS2-VASc, rate/rhythm)

---

## 🎯 Confidence Scoring

### Interpretation

| Score | Meaning | Action |
|-------|---------|--------|
| **0.90-1.00** | High confidence | Auto-approve |
| **0.80-0.89** | Good confidence | Quick review |
| **0.70-0.79** | Moderate | Detailed review |
| **<0.70** | Low | Manual entry |

### Factors

```javascript
// 5 factors contribute to score:
confidence = 
  dataCompleteness(0-0.25) +      // Vitals + Labs + EKG
  assessmentQuality(0-0.30) +     // Evidence + Severity
  planSpecificity(0-0.25) +       // Dosing + Timeline + Guidelines
  guidelineSupport(0-0.20) +      // Citation count
  clinicalReasoning(0-0.10);      // Reasoning chain
```

---

## 🧪 Testing Examples

### Test Context Extraction

```bash
node -e "
const { extractClinicalContext } = require('./src/parsers/entityExtraction.js');
const text = 'Acute chest pain x 3 hours, severe dyspnea, no fever';
console.log(extractClinicalContext(text));
"
```

### Test Safety Validation

```bash
node -e "
const { validateClinicalSafety } = require('./src/parsers/clinicalSafety.js');
const parsed = {
  medications: ['warfarin'],
  labs: [{name: 'platelets', value: 45}]
};
console.log(validateClinicalSafety(parsed));
"
```

### Run Full Test Suite

```bash
node tests/ai-enhancements.test.js
```

---

## ⚙️ Configuration

### Enable/Disable Features

```javascript
// In config/features.json
{
  "ai_enhancements": {
    "enabled": true,
    "features": {
      "context_extraction": true,
      "safety_validation": true,
      "evidence_plans": true
    }
  }
}
```

### Environment Variables

```bash
export ENABLE_ENHANCED_AI=true
export SAFETY_CHECKS=true
export MIN_CONFIDENCE_THRESHOLD=0.70
```

---

## 🚨 Common Issues

### Issue: Low Confidence Scores

**Cause**: Incomplete data  
**Solution**: Ensure note includes vitals, labs, and assessment

```javascript
// Before: confidence = 0.65
"Patient has chest pain."

// After: confidence = 0.88
"68M with chest pain x 3h. BP 145/92, HR 98. Troponin 0.8. EKG: ST elevation II/III/aVF. Assessment: Acute inferior STEMI."
```

### Issue: False Safety Warnings

**Cause**: Medication name variations  
**Solution**: Use standard names or update drug database

```javascript
// May not detect: "coumadin" (trade name)
// Better: "warfarin" (generic name)
```

### Issue: Missing Diagnoses

**Cause**: Negation detected incorrectly  
**Solution**: Check negation patterns, rephrase if needed

```javascript
// May remove: "No evidence of PE" → removes "PE"
// Better: "PE workup negative" → context preserved
```

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `services/ai-search/analyze-note.js` | GPT-4 prompts, confidence scoring |
| `src/parsers/entityExtraction.js` | Context extraction, disambiguation |
| `src/parsers/clinicalSafety.js` | Safety validation rules |
| `src/parsers/evidenceBasedPlan.js` | Guideline-based recommendations |
| `tests/ai-enhancements.test.js` | Integration tests |

---

## 💡 Pro Tips

1. **Always extract context first** - It improves all downstream processing
2. **Check safety warnings** - Even if confidence is high
3. **Review low-confidence notes** - Manual verification recommended
4. **Use specific diagnoses** - "Acute inferior STEMI" > "chest pain"
5. **Include evidence** - "Troponin 0.8" > "elevated troponin"
6. **Test with real notes** - Synthetic examples may not catch edge cases

---

## 🔗 Related Documentation

- Full docs: [`docs/AI_ENHANCEMENTS.md`](./AI_ENHANCEMENTS.md)
- Test examples: `tests/ai-enhancements.test.js`
- Integration guide: See "Integration Guide" in full docs
- Troubleshooting: See "Known Limitations" in full docs

---

**Last Updated**: October 18, 2025  
**Version**: 2.0.0
