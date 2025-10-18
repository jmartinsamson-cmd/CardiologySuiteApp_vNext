# Parser Testing Guide: Real Clinical Notes

## Overview

This guide explains how to use real de-identified clinical notes to improve parser accuracy through systematic testing and validation.

## Directory Structure

```
tests/
├── fixtures/                    # Test fixtures
│   ├── 01-clean-structured.txt  # Existing: Well-formatted notes
│   ├── ...
│   ├── real/                    # NEW: Your real clinical notes
│   │   ├── note-001.txt        # Raw de-identified note text
│   │   ├── note-001.expected.json  # Expected parser output
│   │   ├── note-002.txt
│   │   ├── note-002.expected.json
│   │   └── ...
│   └── real/                    # Alternative: Combined format
│       ├── note-001.json        # Contains both input and expected
│       └── ...
├── parsing.smart.spec.js        # Existing: Smart parser tests
└── parsing.real-notes.spec.js   # NEW: Real clinical note tests
```

## Step 1: Adding New Clinical Notes

### Option A: Separate Files (Recommended for readability)

**Create the raw note:**

```bash
# tests/fixtures/real/note-001.txt
```

```
HISTORY OF PRESENT ILLNESS:
68yo M h/o CAD s/p PCI 2020, DM2, HTN presents with 3 days progressive DOE...

PHYSICAL EXAMINATION:
BP 145/88  HR 92  RR 18  O2sat 94% RA
Gen: NAD, comfortable
CV: RRR, 2/6 systolic murmur at apex
...
```

**Create the expected output:**

```bash
# tests/fixtures/real/note-001.expected.json
```

```json
{
  "patient": {
    "age": 68,
    "gender": "male",
    "mrn": null,
    "dob": null
  },
  "vitals": {
    "bp": "145/88",
    "hr": 92,
    "rr": 18,
    "spo2": 94,
    "temp": null
  },
  "subjective": "68yo M h/o CAD s/p PCI 2020, DM2, HTN presents with 3 days progressive DOE...",
  "objective": "BP 145/88  HR 92  RR 18  O2sat 94% RA\nGen: NAD, comfortable\nCV: RRR, 2/6 systolic murmur at apex...",
  "assessment": "1. Heart failure with reduced ejection fraction...",
  "plan": "1. Increase furosemide to 40mg BID...",
  "diagnoses": ["CAD", "Heart failure", "Diabetes", "Hypertension"],
  "medications": ["Furosemide", "Metoprolol", "Lisinopril"],
  "allergies": ["NKDA"]
}
```

### Option B: Combined Format (Easier to manage)

```bash
# tests/fixtures/real/note-001.json
```

```json
{
  "id": "note-001",
  "description": "HFrEF follow-up with med abbreviations",
  "input": "HISTORY OF PRESENT ILLNESS:\n68yo M h/o CAD s/p PCI 2020...",
  "expected": {
    "patient": { "age": 68, "gender": "male" },
    "vitals": { "bp": "145/88", "hr": 92 },
    "subjective": "68yo M h/o CAD...",
    "diagnoses": ["CAD", "Heart failure"]
  },
  "mustHave": {
    "vitals.bp": "145/88",
    "vitals.hr": 92,
    "patient.age": 68,
    "diagnoses": ["CAD", "Heart failure"]
  },
  "shouldNotHave": {
    "diagnoses": ["Cancer", "HIV"]
  }
}
```

## Step 2: Running Tests

### Quick Test (Single Note)

```bash
# Test a specific note and see detailed output
npm run test:parser -- --file=real/note-001
```

### Batch Test (All Real Notes)

```bash
# Run all real note fixtures
npm run test:real-notes
```

### Watch Mode (Development)

```bash
# Auto-rerun tests when parser changes
npm run test:real-notes -- --watch
```

## Step 3: Analyzing Failures

### Understanding Test Output

```
❌ note-001: HFrEF follow-up with med abbreviations
   Expected vitals.hr to be 92, got 88
   Missing diagnoses: ["Heart failure"]
   Unexpected diagnoses: ["Congestive heart failure exacerbation"]

   DIFF:
   - vitals.hr: 92 (expected)
   + vitals.hr: 88 (actual)

   - diagnoses: ["Heart failure"]
   + diagnoses: ["Congestive heart failure exacerbation"]
```

### Common Failure Categories

1. **Header Not Recognized**
   - Parser didn't identify section headers
   - Fix: Add synonym to `src/parsers/synonyms.js`

2. **Vitals Misparsed**
   - Format not recognized (e.g., "T: 98.6" vs "Temp 98.6")
   - Fix: Update regex in `src/parsers/entityExtraction.js`

3. **Diagnosis Missed**
   - Not detected in assessment section
   - Fix: Add pattern to `extractDiagnoses()` function

4. **Medication Format**
   - Abbreviations not expanded (e.g., "ASA" → "Aspirin")
   - Fix: Add to medication dictionary

## Step 4: Improving Parser Based on Failures

### Safe Improvement Workflow

1. **Identify Pattern**

   ```bash
   # Run all tests to see patterns
   npm run test:real-notes -- --verbose

   # Look for repeated failures:
   # - 5 notes fail to parse "Temp: 98.6F" format
   # - 3 notes miss "HPI:" as subjective header
   ```

2. **Write Regression Test First**

   ```javascript
   // Add to tests/parsing.real-notes.spec.js
   test('Handles "Temp: 98.6F" format', () => {
     const text = "Vitals: BP 120/80, Temp: 98.6F";
     const result = parseNote(text);
     assert(result.data.vitals.temp === 98.6, "temp extracted");
   });
   ```

3. **Run Test (Should Fail)**

   ```bash
   npm run test:real-notes
   # ❌ Handles "Temp: 98.6F" format
   ```

4. **Fix Parser**

   ```javascript
   // src/parsers/entityExtraction.js
   export function extractVitals(text) {
     // OLD:
     // const tempMatch = text.match(/Temp\s+(\d+\.?\d*)/i);

     // NEW: Allow colon separator
     const tempMatch = text.match(/Temp:?\s+(\d+\.?\d*)/i);
     // ...
   }
   ```

5. **Run Test (Should Pass)**

   ```bash
   npm run test:real-notes
   # ✅ Handles "Temp: 98.6F" format
   ```

6. **Run ALL Tests (Non-Regression)**

   ```bash
   npm run test:parser  # Smart parser tests
   npm run test:real-notes  # Real notes
   npm run lint  # Code quality
   ```

7. **Commit Only If All Pass**
   ```bash
   git add src/parsers/entityExtraction.js tests/parsing.real-notes.spec.js
   git commit -m "fix: parse 'Temp: 98.6F' format with colon separator"
   ```

## Step 5: Validation Utilities

### Diff Tool (Manual Inspection)

```bash
# Compare parser output to expected for a specific note
npm run test:diff -- real/note-001

# Output:
# ✅ patient.age: 68 (exact match)
# ✅ vitals.bp: "145/88" (exact match)
# ⚠️  vitals.hr: 88 vs 92 (close but not exact)
# ❌ diagnoses: missing ["Heart failure"]
```

### Batch Validation Report

```bash
# Generate CSV report of all notes
npm run test:report

# Output: tests/results/report-2025-01-15.csv
# note_id, confidence, missing_fields, extra_fields, accuracy_score
# note-001, 0.82, "diagnoses", "", 0.85
# note-002, 0.95, "", "", 0.98
```

## Expected Output Schema

Every `*.expected.json` file should follow this schema:

```typescript
interface ExpectedOutput {
  patient: {
    age: number | null;
    gender: "male" | "female" | "other" | null;
    mrn?: string | null;
    dob?: string | null; // ISO format YYYY-MM-DD
  };
  vitals: {
    bp?: string; // "120/80"
    hr?: number; // beats per minute
    rr?: number; // breaths per minute
    temp?: number; // Fahrenheit
    spo2?: number; // percentage
    weight?: number; // kg or lb (specify in note)
  };
  subjective: string; // HPI content
  objective: string; // Physical exam, vitals narrative
  assessment: string; // Diagnoses, impression
  plan: string; // Management plan
  diagnoses: string[]; // List of conditions
  medications: string[]; // List of meds (generic names preferred)
  allergies: string[]; // Allergies or ["NKDA"]
  labs?: {
    // Optional lab results
    troponin?: number;
    bnp?: number;
    hgb?: number;
    // ...
  };
}
```

## Best Practices

### 1. Start Small

- Add 3-5 notes representing common scenarios
- Run tests, fix obvious issues
- Gradually add edge cases

### 2. Categorize Notes

```
tests/fixtures/real/
├── common/          # Typical well-formatted notes
├── edge-cases/      # Unusual formatting, abbreviations
├── errors/          # Notes with missing sections
└── specialties/     # EP, interventional, HF clinic
```

### 3. Document Failures

```json
{
  "id": "note-015",
  "description": "EP note with pacemaker settings",
  "known_issues": [
    "Parser doesn't extract device settings",
    "Pacemaker mode (DDD) not recognized"
  ],
  "skip_for_now": true
}
```

### 4. Measure Progress

```bash
# Track improvement over time
npm run test:real-notes -- --stats

# Output:
# Baseline (Jan 1):  65% accuracy, 12/20 notes passing
# After fixes (Jan 8): 85% accuracy, 17/20 notes passing
```

## Anti-Patterns (Do NOT Do This)

❌ **Overfitting**: Making parser pass one note but breaking others

```javascript
// BAD: Too specific to one note's format
if (text.includes("68yo M h/o CAD")) {
  patient.age = 68;
}
```

✅ **Good**: Generalized pattern matching

```javascript
// GOOD: Handles various age formats
const ageMatch = text.match(/(\d{2,3})\s*y\.?o\.?/i);
if (ageMatch) patient.age = parseInt(ageMatch[1]);
```

❌ **Changing Expected Output**: Adjusting expected output to match wrong parser behavior

```json
// BAD: Parser extracts "88" but note says "92", so changing expected to "88"
"vitals": { "hr": 88 }  // Wrong! Fix parser instead
```

❌ **Skipping Regression Tests**: Fixing one note but breaking existing tests

## Summary: Your Workflow

1. **Add note**: Place `.txt` file in `tests/fixtures/real/`
2. **Create expected output**: Either separate `.expected.json` or combined `.json`
3. **Run test**: `npm run test:real-notes`
4. **Analyze failures**: Review diff output
5. **Fix parser**: Update `src/parsers/*.js` with generalized patterns
6. **Verify non-regression**: Run ALL test suites
7. **Commit**: Only if all tests pass

## Quick Reference Commands

```bash
# Add new fixture
echo "Your note text" > tests/fixtures/real/note-XXX.txt
code tests/fixtures/real/note-XXX.expected.json  # Create expected output

# Test single note
npm run test:parser -- --file=real/note-XXX

# Test all real notes
npm run test:real-notes

# Generate diff report
npm run test:diff -- real/note-XXX

# Full validation (before commit)
npm run test:parser && npm run test:real-notes && npm run lint
```

## Getting Help

If parser improvements are difficult to implement safely:

1. File issue with `[parser-improvement]` tag
2. Include the problematic note (de-identified)
3. Show expected vs actual output
4. Describe the pattern that's failing

Example issue:

```markdown
## Parser Issue: Medication abbreviations not expanded

**Fixture**: tests/fixtures/real/note-042.txt

**Expected**: medications: ["Aspirin", "Metoprolol"]
**Actual**: medications: ["ASA", "Metoprolol"]

**Pattern**: Common abbreviations like "ASA", "HCTZ", "MVI" not being expanded.

**Proposed Fix**: Add abbreviation dictionary to entityExtraction.js
```
