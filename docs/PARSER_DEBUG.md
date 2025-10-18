# Parser Debug Tool

## Overview

Command-line tool for debugging clinical note parsing issues. Useful for reproducing user-reported problems like "no note generated."

**Script**: `scripts/parse.js`

---

## Usage

```bash
node scripts/parse.js <file-path> [--verbose]
```

### Arguments

| Argument          | Description                                   |
| ----------------- | --------------------------------------------- |
| `<file-path>`     | Path to text file containing clinical note    |
| `--verbose`, `-v` | Show detailed section breakdown and full text |
| `--help`, `-h`    | Show help message                             |

### Examples

```bash
# Basic usage
node scripts/parse.js user-note.txt

# Verbose mode (shows full extracted text)
node scripts/parse.js user-note.txt --verbose

# Help
node scripts/parse.js --help
```

---

## Exit Codes

| Code | Meaning                                             |
| ---- | --------------------------------------------------- |
| 0    | Success - Note parsed correctly                     |
| 1    | Failure - Low confidence or missing required fields |
| 2    | Invalid usage or file not found                     |

---

## Output Format

### 1. Input Statistics

```
📝 Input:
   File size: 574 characters
   Lines: 33
   Words: 100
```

### 2. Parse Results

```
🔍 Parse Results:
   Confidence: ✅ 100.0%
   Sections detected: 6
   Warnings: 0
```

**Confidence levels**:

- ✅ >= 80% - High confidence
- ⚠️ 50-79% - Medium confidence
- ❌ < 50% - Low confidence (FAIL)

### 3. Warnings (if any)

```
⚠️  Warnings:
   - Few explicit headers found; using fallback strategies
   - CRITICAL: Both assessment and plan are missing
```

### 4. Detected Sections (verbose mode only)

```
📑 Detected Sections:
   - subjective: 129 chars
   - vitals: 45 chars
   - medications: 68 chars
   - objective: 29 chars
   - assessment: 33 chars
   - plan: 109 chars
```

### 5. Extracted Data

```
📊 Extracted Data:
   Patient:
      Age: 65
      Gender: male
   Vitals: 5 measurements
      bp: "142/88"
      hr: 78
      rr: 16
      temp: 98.6
      spo2: 97
   Medications: 💊 3 items
   Allergies: ⚠️ 1 items
   Diagnoses: 🏥 6 items
   Assessment: ✅ 33 chars
   Plan: ✅ 109 chars
```

**Emojis**:

- 💊 Medications present
- ⚠️ Allergies present
- 🏥 Diagnoses present
- ✅ Field present
- ❌ Field missing
- ○ Empty list

### 6. JSON Output

```json
{
  "confidence": 1.0,
  "warnings": [],
  "sections_detected": ["subjective", "vitals", ...],
  "data": {
    "patient": { "age": 65, "gender": "male" },
    "vitals": { "bp": "142/88", ... },
    ...
  }
}
```

**Note**: Full text shown only in verbose mode; otherwise shows `[N chars]`

### 7. Validation Results

```
🔬 Validation:
   Required fields (assessment or plan): ✅ PASS
   Confidence >= 0.5: ✅ PASS
   Sections detected: ✅ PASS
   Some data extracted: ✅ PASS
```

### 8. Final Status

```
✅ PASS - Note parsed successfully
   Confidence: 100.0%
   Required fields: Present
```

**OR**

```
❌ FAIL: Critical fields missing (assessment/plan)

💡 Possible reasons:
   - Note is too short or incomplete
   - Missing standard section headers (Assessment, Plan)
   - Unstructured text without clear sections

💡 Try adding clear section headers like:
   ASSESSMENT: <clinical impression>
   PLAN: <management plan>
```

---

## Use Cases

### 1. User Reports "No Note Generated"

**Problem**: User pastes note, clicks Parse, nothing happens

**Debug steps**:

1. Ask user to save their note as `user-note.txt`
2. Run parser:
   ```bash
   node scripts/parse.js user-note.txt --verbose
   ```
3. Check output:
   - **Low confidence (<50%)?** → Poor structure, suggest adding headers
   - **Missing assessment/plan?** → Note incomplete, guide user to add sections
   - **Parser crash?** → Check error message, fix bug

### 2. Parser Extracts Wrong Data

**Problem**: Parser misidentifies sections or extracts incorrect values

**Debug steps**:

1. Save problematic note as file
2. Run with verbose mode:
   ```bash
   node scripts/parse.js problem-note.txt --verbose
   ```
3. Check detected sections vs expected
4. Review extracted data vs actual note content
5. Identify pattern causing misparse
6. Add test case and fix parser logic

### 3. Regression Testing

**Problem**: Parser change breaks previously working notes

**Debug steps**:

1. Create test files from known-good notes
2. Run parser on all test files:
   ```bash
   for file in test-notes/*.txt; do
     echo "Testing $file"
     node scripts/parse.js "$file" || echo "FAILED: $file"
   done
   ```
3. Check for failures
4. Compare output before/after change

### 4. Performance Testing

**Problem**: Parser slow on large notes

**Debug steps**:

1. Create large test note
2. Time parser execution:
   ```bash
   time node scripts/parse.js large-note.txt
   ```
3. Check parse time in output (e.g., `parse: conf=1.00 sections=8 warnings=0 (5ms)`)
4. Profile if needed

---

## Common Failure Modes

### Mode 1: Low Confidence

**Symptoms**:

- Confidence < 50%
- Few or no sections detected
- Exit code 1

**Causes**:

- Non-standard section headers
- No headers at all (pure narrative)
- Unusual formatting

**Fix**:

- Add standard headers: `ASSESSMENT:`, `PLAN:`, `HPI:`
- Use structured format
- Follow clinical note conventions

**Example bad note**:

```
Patient has chest pain. Gave aspirin. Will follow up.
```

**Fixed note**:

```
CHIEF COMPLAINT: Chest pain

ASSESSMENT: Chest pain, likely angina

PLAN: Aspirin given, cardiology follow-up
```

### Mode 2: Missing Required Fields

**Symptoms**:

- Assessment missing
- Plan missing
- Exit code 1

**Causes**:

- Note incomplete
- Sections not labeled
- Parser can't identify sections

**Fix**:

- Add `ASSESSMENT:` section
- Add `PLAN:` section
- Both must be present (or at least one)

### Mode 3: Parser Crash

**Symptoms**:

- Error message with stack trace
- Exit code 1

**Causes**:

- Bug in parser code
- Unexpected input format
- Null/undefined access

**Fix**:

- Check error message
- Review stack trace
- Add defensive null checks
- Create test case

---

## Creating Test Files

### Good Test Note

```bash
cat > test-good.txt << 'EOF'
65 yo M with h/o HTN, CAD

CHIEF COMPLAINT:
Chest pain

HPI:
Intermittent chest pressure x 2 days

VITALS:
BP 142/88, HR 78, RR 16, T 98.6F, SpO2 97% RA

MEDICATIONS:
- Aspirin 81mg daily
- Atorvastatin 40mg daily

ALLERGIES:
NKDA

ASSESSMENT:
Chest pain, likely angina vs GERD

PLAN:
1. EKG now
2. Troponins x3
3. F/U cardiology
EOF

node scripts/parse.js test-good.txt
# Expected: ✅ PASS, confidence 100%
```

### Bad Test Note

```bash
cat > test-bad.txt << 'EOF'
Patient has pain.
Did some tests.
EOF

node scripts/parse.js test-bad.txt
# Expected: ❌ FAIL, confidence 0%
```

---

## Integration with Issue Reporting

### GitHub Issue Template

When user reports parsing issue:

````markdown
## Parsing Issue

**Describe the problem**:
Note doesn't generate/parses incorrectly

**Steps to reproduce**:

1. Paste note (see below)
2. Click Parse
3. Observe result

**Expected behavior**:
Should extract assessment and plan

**Actual behavior**:
Nothing generated

**Note content** (paste here):
[User pastes their note]

---

**Debug output** (run by maintainer):

\```bash

# Save note as issue-123.txt

node scripts/parse.js issue-123.txt --verbose
\```

**Results**:

- Confidence: X%
- Sections detected: N
- Assessment: MISSING
- Plan: MISSING

**Root cause**:
[Diagnosis from debug output]

**Fix**:
[Proposed solution]
````

---

## Troubleshooting

### Script won't run

```bash
node scripts/parse.js test.txt
# Error: Cannot find module '../src/parsers/smartParser.js'
```

**Solution**: Run from project root

```bash
cd /path/to/cardiology-site
node scripts/parse.js test.txt
```

### File not found

```bash
node scripts/parse.js note.txt
# Error: File not found: note.txt
```

**Solution**: Use absolute or relative path

```bash
node scripts/parse.js ./notes/note.txt
# Or
node scripts/parse.js /full/path/to/note.txt
```

### Verbose mode not working

```bash
node scripts/parse.js test.txt -v
# Doesn't show detailed output
```

**Solution**: Put flag after filename

```bash
node scripts/parse.js test.txt --verbose
```

---

## Related Files

- `scripts/parse.js` - Main debug script
- `src/parsers/smartParser.js` - Parser implementation
- `tests/parsing.smart.spec.js` - Parser unit tests
- `tests/parsing.real-notes.spec.js` - Real note tests

---

## Quick Reference

| Command                           | Purpose                          |
| --------------------------------- | -------------------------------- |
| `node scripts/parse.js <file>`    | Parse note, show summary         |
| `node scripts/parse.js <file> -v` | Parse with full details          |
| `node scripts/parse.js --help`    | Show help                        |
| `echo $?`                         | Check exit code (0=pass, 1=fail) |

**Success criteria**:

- ✅ Confidence >= 50%
- ✅ Assessment OR Plan present
- ✅ Exit code 0

**Failure triggers**:

- ❌ Confidence < 50%
- ❌ Assessment AND Plan both missing
- ❌ Exit code 1
