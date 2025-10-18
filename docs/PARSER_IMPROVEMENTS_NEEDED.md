# Parser Improvements Needed - Based on ED Note Analysis

## Summary

Your ED note revealed **7 major parsing gaps** that need to be addressed. The parser achieved 90% confidence but failed to extract critical data.

## Test Results Overview

```
✅ WORKING:
- Patient age (65) ✓
- Patient gender (male) ✓
- Heart rate from EKG (93) ✓

❌ FAILING:
- Vitals from table format (BP, RR, SpO2, Temp)
- Lab values (BNP, troponin, Hgb, creatinine, glucose, WBC, BUN, lactate)
- Medications list
- Allergies
- Past medical history diagnoses
- Section detection (ED note format)
```

## Priority 1: Critical Data Extraction Failures

### 1. Vitals Table Format Not Recognized

**Problem:** Parser missed vitals in table format:

```
Initial Vitals [09/22/25 2310]
BP      Pulse   Resp    Temp            SpO2
141/76  82      22      97 °F (36.1 °C) 99 %
```

**Expected:** BP: 141/76, HR: 82, RR: 22, Temp: 97, SpO2: 99
**Actual:** HR: 93 (from EKG instead of vitals table)

**Root Cause:** Parser looking for inline format like "BP 141/76" but not tabular format with headers.

**Fix Location:** `src/parsers/entityExtraction.js` → `extractVitals()`

**Suggested Implementation:**

```javascript
export function extractVitals(text) {
  const vitals = {};

  // EXISTING: Inline format
  const bpMatch = text.match(/BP:?\s*(\d{2,3}\/\d{2,3})/i);
  if (bpMatch) vitals.bp = bpMatch[1];

  // NEW: Table format detection
  // Look for "BP  Pulse  Resp  Temp  SpO2" header followed by values
  const tablePattern =
    /BP\s+Pulse\s+Resp\s+Temp\s+SpO2\s*\n[^\n]*?\n\s*(\d{2,3}\/\d{2,3})\s+(\d{2,3})\s+(\d{1,2})\s+(\d{2,3})\s*°?F?\s+\([\d.]+\s*°C\)\s+(\d{1,3})\s*%/i;
  const tableMatch = text.match(tablePattern);

  if (tableMatch) {
    vitals.bp = tableMatch[1]; // 141/76
    vitals.hr = parseInt(tableMatch[2]); // 82
    vitals.rr = parseInt(tableMatch[3]); // 22
    vitals.temp = parseInt(tableMatch[4]); // 97
    vitals.spo2 = parseInt(tableMatch[5]); // 99
    console.log("✅ Extracted vitals from table format");
  }

  return vitals;
}
```

**Test Command:**

```bash
npm run test:diff -- note-pneumonia-trach
# Should show vitals.bp, vitals.hr, vitals.rr, vitals.spo2, vitals.temp all ✅
```

---

### 2. Lab Values Not Extracted

**Problem:** All labs returned `undefined` despite clear lab results in note.

**Lab Format in Note:**

```
COMPREHENSIVE METABOLIC PANEL - Abnormal
    Result  Value
    Sodium  140
    Potassium 4.2
    Creatinine 0.59 (*)
    Glucose 128 (*)
    ...

NT-PRO NATRIURETIC PEPTIDE - Abnormal
    NT-proBNP 3,030 (*)

CBC WITH DIFFERENTIAL - Abnormal
    WBC 4.75
    Hgb 11.0 (*)
    ...

TROPONIN I HIGH SENSITIVITY - Normal
    Troponin High Sensitive 3

LACTIC ACID, PLASMA - Normal
    Lactic Acid Level 1.0
```

**Expected:** labs.bnp = 3030, labs.troponin = 3, labs.hgb = 11.0, etc.
**Actual:** All labs = undefined

**Root Cause:** Parser not recognizing tabular lab format with "Result/Value" columns.

**Fix Location:** `src/parsers/entityExtraction.js` → **CREATE** `extractLabs()` function

**Suggested Implementation:**

```javascript
export function extractLabs(text) {
  const labs = {};

  // BNP (various formats)
  const bnpMatch = text.match(
    /(?:NT-proBNP|BNP):?\s*(\d{1,5})[,\s]*(?:\(\*\))?/i,
  );
  if (bnpMatch) {
    labs.bnp = parseInt(bnpMatch[1].replace(/,/g, "")); // Handle 3,030
  }

  // Troponin (handle "High Sensitive" label)
  const tropMatch = text.match(/Troponin.*?(\d+\.?\d*)/i);
  if (tropMatch) {
    labs.troponin = parseFloat(tropMatch[1]);
  }

  // Hemoglobin
  const hgbMatch = text.match(/Hgb:?\s*(\d+\.?\d*)/i);
  if (hgbMatch) {
    labs.hgb = parseFloat(hgbMatch[1]);
  }

  // Creatinine
  const crMatch = text.match(/Creatinine:?\s*(\d+\.?\d*)/i);
  if (crMatch) {
    labs.creatinine = parseFloat(crMatch[1]);
  }

  // Glucose
  const glucoseMatch = text.match(/Glucose:?\s*(\d{2,3})/i);
  if (glucoseMatch) {
    labs.glucose = parseInt(glucoseMatch[1]);
  }

  // WBC
  const wbcMatch = text.match(/WBC:?\s*(\d+\.?\d*)/i);
  if (wbcMatch) {
    labs.wbc = parseFloat(wbcMatch[1]);
  }

  // BUN
  const bunMatch = text.match(/(?:Blood Urea Nitrogen|BUN):?\s*(\d+\.?\d*)/i);
  if (bunMatch) {
    labs.bun = parseFloat(bunMatch[1]);
  }

  // Lactate
  const lactateMatch = text.match(
    /(?:Lactic Acid Level|Lactate):?\s*(\d+\.?\d*)/i,
  );
  if (lactateMatch) {
    labs.lactate = parseFloat(lactateMatch[1]);
  }

  return labs;
}
```

**Integration:** Add to `smartParser.js` entity extraction:

```javascript
// In extractEntities() function
const labs = extractLabs(fullText);
entities.labs = labs;
```

**Test Command:**

```bash
npm run test:diff -- note-pneumonia-trach
# Should show labs.bnp, labs.troponin, labs.hgb all ✅
```

---

### 3. Medications Not Extracted

**Problem:** Medications list extracted incorrectly - returning full text instead of med names.

**Expected:** ["Vancomycin", "Piperacillin-tazobactam", "Insulin", "Ondansetron"]
**Actual:** Huge array including "Medical Decision Making", "65 yo with SCC", etc.

**Root Cause:** Parser treating entire medication section as a list instead of extracting drug names.

**Fix Location:** `src/parsers/entityExtraction.js` → `extractMeds()`

**Suggested Implementation:**

```javascript
export function extractMeds(text) {
  const medications = new Set();

  // Pattern 1: Generic drug names (ends with common suffixes)
  const genericPattern =
    /\b([A-Z][a-z]+(?:cillin|mycin|pril|olol|pine|statin|ide|zone|azole|prazole|sartan|dipine|afil))\b/g;
  let match;
  while ((match = genericPattern.exec(text)) !== null) {
    medications.add(match[1]);
  }

  // Pattern 2: Brand names in parentheses
  const brandPattern = /\(([A-Z][A-Z]+)\)\s*\d+/g;
  while ((match = brandPattern.exec(text)) !== null) {
    medications.add(match[1]);
  }

  // Pattern 3: Common meds by exact name
  const commonMeds = [
    "vancomycin",
    "piperacillin",
    "tazobactam",
    "linezolid",
    "insulin",
    "ondansetron",
    "aspirin",
    "metoprolol",
    "lisinopril",
    "furosemide",
    "heparin",
    "warfarin",
    "clopidogrel",
    "atorvastatin",
  ];

  for (const med of commonMeds) {
    const regex = new RegExp(`\\b${med}\\b`, "gi");
    if (regex.test(text)) {
      // Capitalize first letter
      medications.add(med.charAt(0).toUpperCase() + med.slice(1));
    }
  }

  // Filter out false positives (common words that match patterns)
  const stopwords = [
    "Medical",
    "Decision",
    "Making",
    "Problems",
    "Addressed",
    "Exam",
    "Workup",
    "Will",
    "Recently",
  ];

  return Array.from(medications)
    .filter((med) => !stopwords.includes(med))
    .sort();
}
```

**Test Command:**

```bash
npm run test:diff -- note-pneumonia-trach
# Should show medications as clean array: ["Insulin", "Linezolid", "Ondansetron", ...]
```

---

### 4. Allergies Not Extracted

**Problem:** Allergies section exists but parser returns empty array.

**Allergy Format in Note:**

```
Review of patient's allergies indicates:
Allergen    Reactions
• Dextromethorphan
```

**Expected:** ["Dextromethorphan"]
**Actual:** []

**Root Cause:** Parser not recognizing "Review of patient's allergies" header or bullet format.

**Fix Location:** `src/parsers/entityExtraction.js` → `extractAllergies()`

**Suggested Implementation:**

```javascript
export function extractAllergies(text) {
  const allergies = [];

  // Pattern 1: "Allergen" header followed by drug names
  const allergySection = text.match(
    /Allergen\s+Reactions?\s*\n([\s\S]*?)(?=\n[A-Z][a-z]+\s+History|$)/i,
  );
  if (allergySection) {
    const allergenText = allergySection[1];

    // Extract items after bullets
    const bulletPattern = /•\s*([A-Za-z\s-]+)/g;
    let match;
    while ((match = bulletPattern.exec(allergenText)) !== null) {
      const allergen = match[1].trim();
      if (allergen && allergen !== "NKDA") {
        allergies.push(allergen);
      }
    }
  }

  // Pattern 2: "Allergies:" followed by list
  const allergyLine = text.match(/Allergies?:(.+?)(?:\n|$)/i);
  if (allergyLine) {
    const items = allergyLine[1].split(/[,;]/).map((s) => s.trim());
    allergies.push(...items.filter((s) => s && s.toLowerCase() !== "nkda"));
  }

  // Pattern 3: NKDA
  if (text.match(/\bNKDA\b/i)) {
    return ["NKDA"];
  }

  return allergies.length > 0 ? allergies : [];
}
```

**Test Command:**

```bash
npm run test:diff -- note-pneumonia-trach
# Should show allergies: ["Dextromethorphan"] ✅
```

---

### 5. Past Medical History Not Extracted as Diagnoses

**Problem:** PMH section has structured diagnosis list but parser missed it.

**PMH Format in Note:**

```
Past Medical History:
Diagnosis   Date
• CAD (coronary artery disease)
• DM (diabetes mellitus), type 2
• HLD (hyperlipidemia)
• HTN (hypertension)
• GERD (gastroesophageal reflux disease)
• SCC (squamous cell carcinoma)
```

**Expected diagnoses:** ["Pneumonia", "CAD", "Diabetes", "Hypertension", "Hyperlipidemia", "GERD", "Squamous cell carcinoma"]
**Actual diagnoses:** Long CT report impression text

**Root Cause:** Parser extracting numbered items from imaging report instead of PMH section.

**Fix Location:** `src/parsers/entityExtraction.js` → `extractDiagnoses()`

**Suggested Implementation:**

```javascript
export function extractDiagnoses(text) {
  const diagnoses = new Set();

  // Strategy 1: Extract from "Past Medical History" section
  const pmhSection = text.match(
    /Past Medical History:[\s\S]*?Diagnosis\s+Date\s*\n([\s\S]*?)(?=\n[A-Z][a-z]+\s+[A-Z][a-z]+\s+History|$)/i,
  );
  if (pmhSection) {
    const pmhText = pmhSection[1];

    // Extract diagnoses after bullets, expand abbreviations
    const diagPattern = /•\s*([A-Z]{2,})[:\s]*\(([^)]+)\)/g;
    let match;
    while ((match = diagPattern.exec(pmhText)) !== null) {
      const abbrev = match[1]; // CAD
      const full = match[2]; // coronary artery disease
      diagnoses.add(full.split(",")[0].trim()); // Take first part before comma
    }
  }

  // Strategy 2: Extract from "Problems Addressed" section
  const problemsSection = text.match(
    /Problems Addressed:([\s\S]*?)(?=\n[A-Z][a-z]+:|$)/i,
  );
  if (problemsSection) {
    const problems = problemsSection[1];

    // Match diagnosis names before colons
    const problemPattern = /([A-Za-z\s]+?)(?:\s+of\s+[^:]+)?:/g;
    let match;
    while ((match = problemPattern.exec(problems)) !== null) {
      diagnoses.add(match[1].trim());
    }
  }

  // Strategy 3: Extract from "Assessment" or "Impression" section
  const assessmentSection = sections.assessment || "";

  // Look for numbered diagnoses
  const assessPattern = /\d+\.\s*([^(\n]+)/g;
  let match;
  while ((match = assessPattern.exec(assessmentSection)) !== null) {
    const diag = match[1].trim();
    // Only add if it's a medical term (not imaging description)
    if (diag.length < 100 && !diag.includes("seen in")) {
      diagnoses.add(diag);
    }
  }

  return Array.from(diagnoses);
}
```

**Test Command:**

```bash
npm run test:diff -- note-pneumonia-trach
# Should show diagnoses: ["Pneumonia", "CAD", "Diabetes", ...] ✅
```

---

## Priority 2: Section Detection Issues

### 6. ED Note Format Not Recognized

**Problem:** Parser doesn't recognize ED-specific sections:

- "Chief Complaint"
- "Review of Systems"
- "Physical Exam" (as separate header, not "Objective")
- "ED Course"
- "Medical Decision Making"
- "Problems Addressed"

**Current Behavior:** Parser lumped "Physical Exam" + "ED Course" + labs into "objective" section.

**Expected:** Map ED sections to SOAP format:

- Chief Complaint → subjective
- Physical Exam → objective
- Medical Decision Making → assessment
- Problems Addressed → assessment

**Fix Location:** `src/parsers/synonyms.js` → Add ED section synonyms

**Suggested Implementation:**

```javascript
// Add to SECTION_SYNONYMS in src/parsers/synonyms.js

export const SECTION_SYNONYMS = {
  subjective: [
    "subjective",
    "hpi",
    "history of present illness",
    "cc",
    "chief complaint", // ← ADD THIS
    "presenting complaint",
  ],
  objective: [
    "objective",
    "physical exam",
    "examination",
    "pe",
    "vitals",
    "physical examination", // ← ADD THIS (already there?)
    "review of systems", // ← Or separate section?
  ],
  assessment: [
    "assessment",
    "impression",
    "diagnosis",
    "diagnoses",
    "medical decision making", // ← ADD THIS
    "problems addressed", // ← ADD THIS
    "differential diagnosis",
  ],
  plan: [
    "plan",
    "treatment plan",
    "recommendations",
    "disposition",
    "ed course", // ← ADD THIS (or keep separate?)
  ],
};
```

**Alternative:** Create ED-specific parser that normalizes to SOAP format first.

---

### 7. Heart Rate Source Confusion

**Problem:** Parser extracted HR from EKG report (93) instead of vital signs table (82).

**Root Cause:** EKG interpretation appears later in document and overwrites earlier vitals.

**Expected:** HR: 82 (from vitals table)
**Actual:** HR: 93 (from EKG report)

**Fix:** Prioritize structured vitals table over narrative EKG interpretation.

**Implementation:** In `extractVitals()`, only overwrite existing values if confidence is higher:

```javascript
// After extracting from vitals table
const vitalsTableHR = 82; // from table
vitals.hr = vitalsTableHR;
vitals.hrSource = "vitals-table";
vitals.hrConfidence = 0.95;

// Later, when encountering EKG
const ekgHR = 93;
if (!vitals.hr || vitals.hrConfidence < 0.9) {
  vitals.hr = ekgHR;
  vitals.hrSource = "ekg";
  vitals.hrConfidence = 0.85;
}
```

---

## Implementation Priority

### Phase 1: High-Impact Fixes (Do First)

1. ✅ **Vitals table extraction** (affects 5 fields)
2. ✅ **Lab values extraction** (affects 8+ fields)
3. ✅ **Allergies extraction** (critical safety data)

### Phase 2: Data Quality

4. ✅ **Medications cleanup** (currently broken)
5. ✅ **Diagnoses from PMH** (comprehensive dx list)

### Phase 3: Structure Improvements

6. ⚠️ **ED section synonyms** (better section mapping)
7. ⚠️ **HR source prioritization** (accuracy fix)

---

## Testing Workflow

After each fix:

```bash
# 1. Run diff to see what improved
npm run test:diff -- note-pneumonia-trach

# 2. Run all real note tests (non-regression)
npm run test:real-notes

# 3. Run smart parser tests (non-regression)
npm run test:parser

# 4. Commit only if ALL tests pass
git add src/parsers/entityExtraction.js
git commit -m "feat: extract vitals from table format"
```

---

## Expected Outcomes

After implementing all 7 fixes:

**Before:**

```
✅ Passed: 0
❌ Failed: 1
📈 Success Rate: 0.0%
```

**After:**

```
✅ Passed: 1
❌ Failed: 0
📈 Success Rate: 100%
```

**Field Accuracy:**

- Vitals: 0/5 → 5/5 ✅
- Labs: 0/8 → 8/8 ✅
- Medications: broken → 5+ extracted ✅
- Allergies: 0/1 → 1/1 ✅
- Diagnoses: wrong → 7+ correct ✅

---

## Next Steps

1. **Start with Phase 1** (vitals, labs, allergies)
2. **Test each fix individually** before moving to next
3. **Add 2-3 more ED notes** to validate patterns
4. **Measure improvement** with `npm run test:real-notes --stats`

---

## Files to Modify

```
src/parsers/
├── entityExtraction.js  ← Most changes here
│   ├── extractVitals()       # Add table format support
│   ├── extractLabs()         # CREATE new function
│   ├── extractMeds()         # Fix to extract names only
│   ├── extractAllergies()    # Add bullet pattern
│   └── extractDiagnoses()    # Add PMH section support
│
├── synonyms.js          ← Add ED section headers
│   └── SECTION_SYNONYMS      # Add Chief Complaint, etc.
│
└── smartParser.js       ← Integration
    └── extractEntities()     # Call extractLabs()
```

---

## Questions?

See the full testing guide: [docs/PARSER_TESTING_GUIDE.md](PARSER_TESTING_GUIDE.md)

Quick start: [docs/PARSER_TESTING_QUICKSTART.md](PARSER_TESTING_QUICKSTART.md)
