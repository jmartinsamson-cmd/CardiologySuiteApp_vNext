# Parser Patterns Analysis - 2 Real ED Notes

## Test Results Summary

```
📊 Overall: 0/3 notes passing (0.0%)

Note                        Confidence  Major Issues
─────────────────────────────────────────────────────────────
note-pneumonia-trach        90%         Vitals table, Labs, Allergies
note-gerd-diabetes          80%         Vitals table, Labs, Age, Allergies
note-001 (example)          95%         Labs, Gender, Diagnoses
```

## Common Patterns Across Both Notes

### ✅ What Works

1. **Gender extraction** - Works for both notes (male detected)
2. **Text normalization** - No issues with formatting
3. **Section detection** - Decent confidence (80-90%)

### ❌ What's Broken (100% failure rate)

#### 1. Vitals Table Format - **CRITICAL**

**Failing in:** Both ED notes (2/2)

**Format in your EMR:**

```
Initial Vitals [DATE TIME]
BP      Pulse   Resp    Temp            SpO2
163/85  89      18      97.7 °F (36.5)  98 %
```

**Current behavior:** Parser returns `undefined` for all vitals
**Impact:** Missing critical vital signs in 100% of ED notes

---

#### 2. Lab Values - **CRITICAL**

**Failing in:** All 3 notes (3/3)

**Format in your EMR:**

```
COMPREHENSIVE METABOLIC PANEL - Abnormal
    Result  Value
    Glucose 240 (*)
    Creatinine 1.11

CBC WITH DIFFERENTIAL - Abnormal
    Hgb     14.7 (*)
```

**Current behavior:** Parser returns `undefined` for ALL lab values
**Impact:** Missing all lab data (glucose, Hgb, creatinine, BNP, troponin, etc.)

---

#### 3. Allergies - **HIGH PRIORITY**

**Failing in:** Both ED notes (2/2)

**Format variations found:**

1. Explicit list:

   ```
   Review of patient's allergies indicates:
   Allergen    Reactions
   • Dextromethorphan
   ```

2. NKDA:
   ```
   Review of patient's allergies indicates:
   No Known Allergies
   ```

**Current behavior:** Returns empty array `[]`
**Impact:** Critical safety data missing

---

#### 4. Age Extraction - **MEDIUM PRIORITY**

**Failing in:** 1/2 ED notes (note-gerd-diabetes)

**Format found:**

```
43-year-old black male presents emergency department...
```

**Expected:** age = 43
**Actual:** age = undefined

**Why it failed:** Parser looks for "43yo" format but note has "43-year-old"

---

#### 5. Past Medical History Diagnoses - **MEDIUM PRIORITY**

**Failing in:** Both ED notes

**Format in your EMR:**

```
Past Medical History:
Diagnosis   Date
• CAD (coronary artery disease)
• DM (diabetes mellitus), type 2
• HTN (hypertension)
```

**Current behavior:** Not extracting PMH diagnoses
**Impact:** Missing historical context for patient

---

## Note-Specific Findings

### Note 1: Pneumonia/Trach Patient (65yo M)

**Unique Issues:**

- ✅ Age extracted correctly ("65 yo male" format works)
- ❌ HR source confusion: Used EKG reading (93) instead of vitals table (82)
- ❌ Medications: Extracted entire text blocks instead of drug names

**Lab Format Notes:**

- BNP with comma: "NT-proBNP 3,030 (\*)"
- Troponin with label: "Troponin High Sensitive 3"

---

### Note 2: GERD/Diabetes Patient (43yo M)

**Unique Issues:**

- ❌ Age not extracted ("43-year-old" hyphenated format)
- ✅ Gender extracted correctly
- ❌ New-onset diabetes (glucose 240) not flagged in diagnoses

**Additional Data Available:**

- Social History: Smoking quantified ("0.5 PPD for 17 years")
- Family History: Structured format
- Lipase/Amylase: Specific to GI workup

---

## Priority Fix List (Based on Impact)

### Priority 1: Zero-Tolerance Failures (Affect 100% of notes)

1. **Vitals table extraction** - Affects 2/2 ED notes
2. **Lab values extraction** - Affects 3/3 all notes
3. **Allergy extraction** - Affects 2/2 ED notes (safety critical)

### Priority 2: High-Impact (Affect >50% of notes)

4. **Age variations** - "43-year-old" vs "43yo"
5. **PMH diagnosis extraction**
6. **Medication name extraction** (vs full text)

### Priority 3: Edge Cases

7. **HR source prioritization** (vitals table > EKG)
8. **Social/Family history** (nice-to-have)

---

## Implementation Roadmap

### Week 1: Critical Fixes

**Goal:** Get vitals and labs working (raises success rate to ~60%)

```javascript
// 1. Add vitals table format support
// Location: src/parsers/entityExtraction.js → extractVitals()
// Pattern: Detect "BP  Pulse  Resp  Temp  SpO2" header + values

// 2. Add lab extraction
// Location: src/parsers/entityExtraction.js → extractLabs() [NEW FUNCTION]
// Pattern: Match "Lab Name\tValue (*)" format
```

**Test after each fix:**

```bash
npm run test:diff -- note-gerd-diabetes
npm run test:real-notes
```

---

### Week 2: Safety Data

**Goal:** Get allergies working (critical for safety)

```javascript
// 3. Add allergy extraction
// Location: src/parsers/entityExtraction.js → extractAllergies()
// Patterns:
//   - "• Drug name" after "Allergen" header
//   - "No Known Allergies" → return ["NKDA"]
```

---

### Week 3: Completeness

**Goal:** Age variations, PMH, medications

```javascript
// 4. Expand age regex
// Pattern: /(\d{2,3})(?:\s*yo|\s*year[s]?[- ]old)/i

// 5. Extract PMH diagnoses
// Pattern: Bullet items in "Past Medical History" section

// 6. Clean medication extraction
// Pattern: Drug name only (not full IV admixture text)
```

---

## Testing Strategy

### After Each Fix:

```bash
# 1. Test the specific note that revealed the issue
npm run test:diff -- note-gerd-diabetes

# 2. Run all real notes (non-regression)
npm run test:real-notes

# 3. Run existing smart parser tests (non-regression)
npm run test:parser

# 4. Only commit if ALL pass
git add src/parsers/
git commit -m "feat: extract vitals from table format"
```

### Weekly Progress Check:

```bash
npm run test:real-notes -- --stats

# Target progression:
# Week 0: 0/3 passing (0%)
# Week 1: 2/3 passing (66%) - after vitals/labs
# Week 2: 3/3 passing (100%) - after allergies
# Week 3: 3/3 passing + new notes
```

---

## Code Examples for Priority 1 Fixes

### Fix 1: Vitals Table Extraction

**File:** `src/parsers/entityExtraction.js`

```javascript
export function extractVitals(text) {
  const vitals = {};

  // NEW: Table format (your EMR format)
  // Match: BP      Pulse   Resp    Temp            SpO2
  //        163/85  89      18      97.7 °F (36.5)  98 %
  const tableHeaderPattern =
    /Initial Vitals.*?\n\s*BP\s+Pulse\s+Resp\s+Temp\s+SpO2/i;
  if (tableHeaderPattern.test(text)) {
    // Extract the line after the header
    const tableMatch = text.match(
      /BP\s+Pulse\s+Resp\s+Temp\s+SpO2\s*\n[^\n]*?\n\s*(\d{2,3}\/\d{2,3})\s+(\d{2,3})\s+(\d{1,2})\s+(\d{2,3}\.?\d*)\s*°?F?[^%]*?(\d{1,3})\s*%/i,
    );

    if (tableMatch) {
      vitals.bp = tableMatch[1];
      vitals.hr = parseInt(tableMatch[2]);
      vitals.rr = parseInt(tableMatch[3]);
      vitals.temp = parseFloat(tableMatch[4]);
      vitals.spo2 = parseInt(tableMatch[5]);
      vitals.source = "vitals-table";
      console.log("✅ Extracted vitals from table format");
      return vitals;
    }
  }

  // EXISTING: Inline format fallback
  const bpMatch = text.match(/BP:?\s*(\d{2,3}\/\d{2,3})/i);
  if (bpMatch) vitals.bp = bpMatch[1];

  const hrMatch = text.match(/(?:HR|Pulse|Heart Rate):?\s*(\d{2,3})/i);
  if (hrMatch) vitals.hr = parseInt(hrMatch[1]);

  return vitals;
}
```

**Test:**

```bash
npm run test:diff -- note-gerd-diabetes
# Should show:
# ✅ vitals.bp: exact match
# ✅ vitals.hr: exact match
# ✅ vitals.temp: exact match
```

---

### Fix 2: Lab Values Extraction

**File:** `src/parsers/entityExtraction.js`

```javascript
/**
 * Extract lab values from EMR tabular format
 * Handles both simple and complex lab names
 */
export function extractLabs(text) {
  const labs = {};

  // Pattern: Lab Name + Value on same line, optional (*) for abnormal
  // Examples:
  //   Glucose  240 (*)
  //   Hgb      14.7 (*)
  //   NT-proBNP 3,030 (*)

  // Glucose
  const glucoseMatch = text.match(/Glucose\s+(\d{2,3})/i);
  if (glucoseMatch) {
    labs.glucose = parseInt(glucoseMatch[1]);
  }

  // Hemoglobin
  const hgbMatch = text.match(/Hgb\s+(\d{1,2}\.\d)/i);
  if (hgbMatch) {
    labs.hgb = parseFloat(hgbMatch[1]);
  }

  // Creatinine
  const crMatch = text.match(/Creatinine\s+(\d+\.\d+)/i);
  if (crMatch) {
    labs.creatinine = parseFloat(crMatch[1]);
  }

  // BNP (handle comma in number)
  const bnpMatch = text.match(/(?:NT-proBNP|BNP)\s+(\d{1,3}),?(\d{3})/i);
  if (bnpMatch) {
    labs.bnp = parseInt(bnpMatch[1] + bnpMatch[2]); // 3,030 → 3030
  }

  // Troponin (various formats)
  const tropMatch = text.match(/Troponin.*?\s+(\d+\.?\d*)/i);
  if (tropMatch) {
    labs.troponin = parseFloat(tropMatch[1]);
  }

  // WBC
  const wbcMatch = text.match(/WBC\s+(\d+\.\d+)/i);
  if (wbcMatch) {
    labs.wbc = parseFloat(wbcMatch[1]);
  }

  // BUN
  const bunMatch = text.match(/Blood Urea Nitrogen\s+(\d+\.\d+)/i);
  if (bunMatch) {
    labs.bun = parseFloat(bunMatch[1]);
  }

  // Lactate
  const lactateMatch = text.match(/Lactic Acid Level\s+(\d+\.\d+)/i);
  if (lactateMatch) {
    labs.lactate = parseFloat(lactateMatch[1]);
  }

  // Amylase
  const amylaseMatch = text.match(/Amylase Level\s+(\d+)/i);
  if (amylaseMatch) {
    labs.amylase = parseInt(amylaseMatch[1]);
  }

  // Lipase
  const lipaseMatch = text.match(/Lipase Level\s+(\d+)/i);
  if (lipaseMatch) {
    labs.lipase = parseInt(lipaseMatch[1]);
  }

  return labs;
}
```

**Integration in `smartParser.js`:**

```javascript
// In extractEntities() function, add:
import { extractLabs } from "./entityExtraction.js";

function extractEntities(sections, fullText) {
  // ... existing code ...

  // Add lab extraction
  const labs = extractLabs(fullText);
  entities.labs = labs;

  return entities;
}
```

**Test:**

```bash
npm run test:diff -- note-gerd-diabetes
# Should show:
# ✅ labs.glucose: exact match (240)
# ✅ labs.hgb: exact match (14.7)
```

---

### Fix 3: Allergy Extraction

**File:** `src/parsers/entityExtraction.js`

```javascript
export function extractAllergies(text) {
  const allergies = [];

  // Pattern 1: NKDA
  if (text.match(/No Known Allergies/i)) {
    return ["NKDA"];
  }

  // Pattern 2: Bullet list under "Allergen" header
  const allergySection = text.match(
    /Review of patient's allergies.*?Allergen\s+Reactions?\s*\n([\s\S]{0,200}?)(?=\n[A-Z][a-z]+ History)/i,
  );

  if (allergySection) {
    const bullets = allergySection[1].match(/•\s*([A-Za-z\s-]+)/g);
    if (bullets) {
      for (const bullet of bullets) {
        const allergen = bullet.replace("•", "").trim();
        if (allergen && allergen.length > 1) {
          allergies.push(allergen);
        }
      }
    }
  }

  return allergies;
}
```

**Test:**

```bash
npm run test:diff -- note-gerd-diabetes
# Should show:
# ✅ allergies: ["NKDA"] (exact match)

npm run test:diff -- note-pneumonia-trach
# Should show:
# ✅ allergies: ["Dextromethorphan"] (exact match)
```

---

## Success Metrics

### Before Fixes:

```
✅ Passed: 0/3 (0%)
❌ Failed: 3/3 (100%)

Critical data missing:
- Vitals: 0/10 extracted (0%)
- Labs: 0/17 extracted (0%)
- Allergies: 0/2 extracted (0%)
```

### After Priority 1 Fixes:

```
✅ Passed: 2/3 (66%)
❌ Failed: 1/3 (33%)

Critical data extraction:
- Vitals: 10/10 extracted (100%) ✅
- Labs: 17/17 extracted (100%) ✅
- Allergies: 2/2 extracted (100%) ✅
```

---

## Next Steps

1. **Implement Priority 1 fixes** (vitals, labs, allergies)
2. **Run full test suite** after each fix
3. **Add 2-3 more ED notes** to validate patterns
4. **Track improvement:** `npm run test:real-notes --stats`
5. **Move to Priority 2** once 100% passing

---

## Files to Modify

```
src/parsers/
├── entityExtraction.js    ← Most changes here
│   ├── extractVitals()      # Add table format
│   ├── extractLabs()        # NEW FUNCTION
│   └── extractAllergies()   # Add bullet + NKDA patterns
│
└── smartParser.js         ← Integration
    └── extractEntities()    # Call extractLabs()
```

---

## Questions?

- Full testing guide: [PARSER_TESTING_GUIDE.md](PARSER_TESTING_GUIDE.md)
- Quick start: [PARSER_TESTING_QUICKSTART.md](PARSER_TESTING_QUICKSTART.md)
- Specific fixes: [PARSER_IMPROVEMENTS_NEEDED.md](PARSER_IMPROVEMENTS_NEEDED.md)
