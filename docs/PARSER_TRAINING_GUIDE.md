# Parser Training System - File-Based Learning

## Overview

This system allows you to teach the parser new clinical note formats by simply pasting examples into a JavaScript file. No UI required - just edit the file in VS Code and save.

## How to Train the Parser

### 1. Open the Training File

Open `/src/parsers/parserTrainingExamples.js` in VS Code.

### 2. Add Your Clinical Note Examples

Add new entries to the `TRAINING_EXAMPLES` array:

```javascript
const TRAINING_EXAMPLES = [
  {
    label: 'My ED Note Format',
    note: `
HPI:
Patient is a 65 yo male with chest pain...

Vitals:
BP 140/85, HR 92, RR 18, T 98.6F, SpO2 97%

Assessment:
1. Chest pain - r/o ACS
2. HTN

Plan:
- Serial troponins
- EKG q4h
    `.trim(),
    enabled: true
  },
  
  // Add more examples here
];
```

### 3. Save the File

That's it! The parser automatically learns from your examples when you save the file.

## What the Parser Learns

The system automatically detects:

- **Section Headers**: Identifies lines ending with `:` or short title-cased lines
- **Header Variations**: Learns that "HPI", "History", and "Present Illness" all mean the same thing
- **Section Categories**: Categorizes headers into:
  - **Vitals**: Contains keywords like "vital", "vs", "sign"
  - **HPI**: Contains "history", "hpi", "present", "illness"
  - **Assessment**: Contains "assessment", "impression", "diagnosis"
  - **Plan**: Contains "plan", "recommendation", "management"

## Testing Your Training

### Console Testing

Open browser DevTools console and run:

```javascript
// Check what patterns were learned
window.getLearnedPatterns()

// Test parsing a note with learned patterns
window.__testHintedParse__(`
HPI:
Patient presents with...

Assessment:
1. CHF
`)
```

### Enable Debug Mode

See exactly which patterns match:

```javascript
window.__PARSER_DEBUG__ = true
// Now parse a note and watch the console
```

## Example Training Scenarios

### Scenario 1: Non-Standard Vitals Header

Your hospital uses "V/S:" instead of "Vitals:":

```javascript
{
  label: 'Our Hospital Format',
  note: `
V/S:
BP 120/80, P 75

HPI:
...
  `.trim(),
  enabled: true
}
```

### Scenario 2: Combined Assessment/Plan

Your notes use "A/P:" for combined Assessment and Plan:

```javascript
{
  label: 'Combined A/P Format',
  note: `
HPI:
...

A/P:
1. CHF - diurese
2. HTN - continue meds
  `.trim(),
  enabled: true
}
```

### Scenario 3: Alternative Terminology

Your specialty uses different terms:

```javascript
{
  label: 'Cardiology Consult',
  note: `
Reason for Consultation:
Chest pain evaluation

Clinical History:
65 yo male...

Impression:
Unstable angina

Recommendations:
- Cath lab
- ASA, heparin
  `.trim(),
  enabled: true
}
```

## Disabling Examples

Set `enabled: false` to keep an example without using it:

```javascript
{
  label: 'Old Format',
  note: `...`,
  enabled: false  // Won't be used for learning
}
```

## Advanced: Manual Pattern Override

If auto-detection isn't working, you can manually specify patterns in `hintedParser.js`:

```javascript
const manualHints = {
  vitals: {
    aliases: ['V/S:', 'Vital Signs:', 'VS:'],
    regex: /^(?:V\/S|Vital\s*Signs?|VS)\s*:?/i
  },
  // ... other sections
};

// Use in parsing
parseWithHints(noteText, manualHints);
```

## Troubleshooting

### Parser Not Learning Headers

**Problem**: Added examples but parser doesn't recognize headers

**Solution**: 
- Ensure headers end with `:` or are short (< 40 chars) and title-cased
- Check that headers contain category keywords (e.g., "vital", "hpi", "assessment", "plan")
- Enable debug mode to see what's being detected: `window.__PARSER_DEBUG__ = true`

### Sections Being Merged

**Problem**: Multiple sections combined into one

**Solution**:
- Ensure each section header is on its own line
- Make headers distinctive (add colons, capitalize properly)
- Add more examples showing the correct format

### Content Truncated

**Problem**: Section content cuts off early

**Solution**:
- The parser stops at the next recognized header
- Make sure your next header is clearly formatted
- Check that content isn't matching header patterns accidentally

## File Locations

- **Training Examples**: `/src/parsers/parserTrainingExamples.js` (edit this)
- **Hinted Parser Logic**: `/src/parsers/hintedParser.js` (advanced users only)
- **Parser Helpers**: `/src/utils/parserHelpers.js` (core vitals/labs extraction)

## Quick Start Checklist

- [ ] Open `src/parsers/parserTrainingExamples.js`
- [ ] Paste your clinical note into the `note` field
- [ ] Give it a descriptive `label`
- [ ] Set `enabled: true`
- [ ] Save the file
- [ ] Test with `window.__testHintedParse__(yourNote)`
- [ ] Adjust examples if needed

## Benefits of This Approach

✅ **No UI required** - just edit a file in VS Code  
✅ **Version controlled** - training examples are part of your codebase  
✅ **No server needed** - everything runs client-side  
✅ **Fast iteration** - save file and test immediately  
✅ **Shareable** - commit training examples to git for your team  
✅ **Transparent** - see exactly what the parser learned in the console
