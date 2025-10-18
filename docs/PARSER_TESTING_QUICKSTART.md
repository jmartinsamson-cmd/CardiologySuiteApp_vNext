# Parser Testing Quick Start

## TL;DR - Your 5-Minute Workflow

### 1. Add Your Clinical Note

```bash
# Copy the template
cp tests/fixtures/real/TEMPLATE.json tests/fixtures/real/note-001.json

# Edit and paste your de-identified note text
code tests/fixtures/real/note-001.json
```

Paste your note in the `"input"` field and fill out the `"expected"` output.

### 2. Run Tests

```bash
# Test your new note
npm run test:real-notes -- --file=note-001

# See detailed comparison
npm run test:diff -- note-001 --verbose
```

### 3. Identify Failures

The test output shows exactly what's missing:

```
❌ note-001: Heart failure follow-up
   Missing required value "Heart failure" in diagnoses
   Expected labs.bnp to be 1250, got undefined
```

### 4. Fix Parser (If Needed)

**Example: Parser isn't extracting BNP from labs**

1. **Find the extraction function:**

   ```bash
   # Search for lab extraction
   grep -r "extractLabs" src/parsers/
   ```

2. **Add BNP pattern:**

   ```javascript
   // src/parsers/entityExtraction.js
   export function extractLabs(text) {
     const labs = {};

     // Add BNP extraction
     const bnpMatch = text.match(/BNP:?\s*(\d+)/i);
     if (bnpMatch) {
       labs.bnp = parseInt(bnpMatch[1]);
     }

     return labs;
   }
   ```

3. **Test again:**

   ```bash
   npm run test:real-notes -- --file=note-001
   # ✅ note-001: Heart failure follow-up
   ```

4. **Run ALL tests (non-regression):**

   ```bash
   npm run test:parser        # Smart parser tests
   npm run test:real-notes    # All real notes
   ```

5. **Commit if all pass:**
   ```bash
   git add src/parsers/entityExtraction.js tests/fixtures/real/note-001.json
   git commit -m "feat: extract BNP from lab results"
   ```

## Common Improvements Needed

Based on the example note test results, here are the most common parser improvements:

### 1. Gender Not Detected

**Problem:** Parser warning: "Patient gender not detected"

**Example note:** `68yo M h/o CAD...`

**Fix location:** `src/parsers/entityExtraction.js` → `extractDemographics()`

**Pattern to add:**

```javascript
// Handle "68yo M" or "68 yo M" format
const genderMatch = text.match(/\d{2}\s*y\.?o\.?\s+(M|F|Male|Female)/i);
if (genderMatch) {
  demographics.gender = genderMatch[1].toLowerCase().startsWith("m")
    ? "male"
    : "female";
}
```

### 2. Diagnoses Not Extracted

**Problem:** Missing diagnoses like "Heart failure", "CAD"

**Example note:** `ASSESSMENT:\n1. Acute decompensated heart failure (HFrEF)`

**Fix location:** `src/parsers/entityExtraction.js` → `extractDiagnoses()`

**Pattern to add:**

```javascript
// Extract numbered diagnoses from assessment
const diagnosisRegex = /\d+\.\s*([^(\n]+)/g;
let match;
while ((match = diagnosisRegex.exec(assessmentText)) !== null) {
  const diagnosis = match[1].trim();
  diagnoses.push(diagnosis);
}

// Also check for abbreviations
const abbrevMap = {
  HFrEF: "Heart failure with reduced ejection fraction",
  CAD: "Coronary artery disease",
  DM2: "Type 2 Diabetes",
  HTN: "Hypertension",
  CKD: "Chronic kidney disease",
};

// Expand abbreviations in extracted diagnoses
diagnoses = diagnoses.map((d) => {
  for (const [abbrev, full] of Object.entries(abbrevMap)) {
    if (d.includes(abbrev)) {
      return d.replace(abbrev, full);
    }
  }
  return d;
});
```

### 3. Labs Not Extracted

**Problem:** BNP, troponin, creatinine not detected

**Example note:** `BNP 1250 (prev 450)\nTroponin <0.01\nCr 1.3`

**Fix location:** `src/parsers/entityExtraction.js` → `extractLabs()`

**Pattern to add:**

```javascript
export function extractLabs(text) {
  const labs = {};

  // BNP (with optional units)
  const bnpMatch = text.match(/BNP:?\s*(\d+)/i);
  if (bnpMatch) labs.bnp = parseInt(bnpMatch[1]);

  // Troponin (handle < values)
  const tropMatch = text.match(/Troponin:?\s*<?(\d+\.?\d*)/i);
  if (tropMatch) labs.troponin = parseFloat(tropMatch[1]);

  // Creatinine (handle Cr abbreviation)
  const crMatch = text.match(/(?:Creatinine|Cr):?\s*(\d+\.?\d*)/i);
  if (crMatch) labs.creatinine = parseFloat(crMatch[1]);

  // Hemoglobin (Hgb or Hb)
  const hgbMatch = text.match(/(?:Hemoglobin|Hgb|Hb):?\s*(\d+\.?\d*)/i);
  if (hgbMatch) labs.hgb = parseFloat(hgbMatch[1]);

  return labs;
}
```

### 4. Medications Not Detected

**Problem:** Parser warning: "No medications detected"

**Example note:** `PLAN:\n1. Increase furosemide to 40mg BID`

**Fix location:** `src/parsers/entityExtraction.js` → `extractMeds()`

**Pattern to add:**

```javascript
// Extract medications from plan section
const medPattern = /\b([A-Z][a-z]+(?:opril|olol|pril|pine|statin|ide))\b/g;
const planSection = sections.plan || "";

let match;
while ((match = medPattern.exec(planSection)) !== null) {
  medications.push(match[1]);
}

// Common abbreviations
const medAbbrevs = {
  ASA: "Aspirin",
  HCTZ: "Hydrochlorothiazide",
  MVI: "Multivitamin",
};

for (const [abbrev, full] of Object.entries(medAbbrevs)) {
  if (planSection.includes(abbrev)) {
    medications.push(full);
  }
}
```

## Testing Workflow Diagram

```
┌─────────────────────────────────────┐
│  Add de-identified note to          │
│  tests/fixtures/real/note-XXX.json  │
└────────────────┬────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  npm run test:real-notes            │
│  --file=note-XXX                    │
└────────────────┬────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ✅ PASS          ❌ FAIL
         │                │
         │                ▼
         │    ┌──────────────────────┐
         │    │ npm run test:diff -- │
         │    │ note-XXX --verbose   │
         │    └──────────┬───────────┘
         │               │
         │               ▼
         │    ┌──────────────────────┐
         │    │  Identify pattern    │
         │    │  causing failure     │
         │    └──────────┬───────────┘
         │               │
         │               ▼
         │    ┌──────────────────────┐
         │    │  Update parser in    │
         │    │  src/parsers/*.js    │
         │    └──────────┬───────────┘
         │               │
         │               ▼
         │    ┌──────────────────────┐
         │    │  Test again          │
         │    └──────────┬───────────┘
         │               │
         └───────────────┘
                 │
                 ▼
┌─────────────────────────────────────┐
│  Run ALL tests (non-regression):    │
│  npm run test:parser                │
│  npm run test:real-notes            │
│  npm run lint                       │
└────────────────┬────────────────────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
    ✅ ALL PASS      ❌ SOME FAIL
         │                │
         │                ▼
         │    ┌──────────────────────┐
         │    │  Fix regression or   │
         │    │  refine pattern      │
         │    └──────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  git commit -m "feat: improve       │
│  parser for <specific pattern>"    │
└─────────────────────────────────────┘
```

## File Locations Reference

```
cardiology-site/
├── src/parsers/
│   ├── smartParser.js           # Main parser orchestration
│   ├── normalize.js             # Text normalization
│   ├── entityExtraction.js      # Extract vitals, meds, labs, etc.
│   └── synonyms.js              # Section header synonyms
├── tests/
│   ├── fixtures/
│   │   ├── real/
│   │   │   ├── TEMPLATE.json    # Template for new notes
│   │   │   ├── example-note-001.json  # Example fixture
│   │   │   └── note-XXX.json    # Your notes here
│   │   ├── 01-clean-structured.txt   # Existing test fixtures
│   │   └── ...
│   ├── parsing.smart.spec.js    # Smart parser tests
│   └── parsing.real-notes.spec.js  # Real notes tests (NEW)
├── scripts/
│   └── test-diff.js             # Diff utility (NEW)
├── docs/
│   ├── PARSER_TESTING_GUIDE.md  # Comprehensive guide (NEW)
│   └── PARSER_TESTING_QUICKSTART.md  # This file (NEW)
└── package.json                 # Added npm scripts
```

## NPM Commands Summary

```bash
# Test all real clinical notes
npm run test:real-notes

# Test single note
npm run test:real-notes -- --file=note-001

# Verbose output with detailed diffs
npm run test:real-notes -- --verbose

# Compare parser output to expected (diff tool)
npm run test:diff -- note-001
npm run test:diff -- note-001 --verbose

# Run existing smart parser tests
npm run test:parser

# Run everything (before commit)
npm run test:parser && npm run test:real-notes && npm run lint
```

## Next Steps

1. **Add 3-5 representative notes** from your practice
   - Start with common scenarios (chest pain, heart failure, hypertension)
   - Include notes with typical abbreviations you use

2. **Run tests and identify patterns**
   - Use `npm run test:diff` to see exactly what's failing
   - Group similar failures (e.g., "all notes missing gender")

3. **Fix one pattern at a time**
   - Update extraction functions in `src/parsers/entityExtraction.js`
   - Test after each change
   - Ensure non-regression

4. **Gradually add edge cases**
   - Unusual formatting
   - Different specialties (EP, interventional, HF clinic)
   - Notes with missing sections

5. **Track progress**
   ```bash
   npm run test:real-notes -- --stats
   # Week 1: 60% passing (3/5 notes)
   # Week 2: 85% passing (17/20 notes)
   ```

## Getting Help

See the full guide: [docs/PARSER_TESTING_GUIDE.md](PARSER_TESTING_GUIDE.md)

Questions or stuck? File an issue with:

- The fixture file (`tests/fixtures/real/note-XXX.json`)
- Test output (`npm run test:diff -- note-XXX`)
- What pattern you think is failing
