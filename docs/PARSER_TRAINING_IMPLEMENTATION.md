# Parser Training Implementation Summary

## What Was Built

A **file-based parser training system** that lets you teach the parser new clinical note formats by pasting examples into a JavaScript file in VS Code. No UI required.

## Files Created

### 1. `/src/parsers/parserTrainingExamples.js` ⭐ **YOU EDIT THIS FILE**
- Contains `TRAINING_EXAMPLES` array where you paste clinical notes
- Auto-learns section headers from your examples
- Each example has: `label`, `note` (your pasted text), `enabled` flag

### 2. `/src/parsers/hintedParser.js`
- Enhanced parser that uses learned patterns
- Falls back to generic parsing if patterns don't match
- Exposes `window.__testHintedParse__(note, hints)` for console testing

### 3. `/src/parsers/parserHeuristics.js`
- Manages pattern storage and matching logic
- Provides default fallback patterns
- Supports debug mode via `window.__PARSER_DEBUG__`

### 4. `/docs/PARSER_TRAINING_GUIDE.md`
- Complete user guide with examples
- Troubleshooting tips
- Quick start checklist

## How to Use It

### Step 1: Add Training Example

Open `src/parsers/parserTrainingExamples.js` and add:

```javascript
{
  label: 'My Hospital ED Note',
  note: `
History of Present Illness:
65 yo male with chest pain...

Vitals:
BP: 140/85, HR: 92

Assessment:
Chest pain - r/o ACS

Plan:
Admit for observation
  `.trim(),
  enabled: true
}
```

### Step 2: Save File

The parser automatically learns when you save.

### Step 3: Test

In browser console:

```javascript
// See learned patterns
window.getLearnedPatterns()

// Test parsing
window.__testHintedParse__(`your note here...`)

// Enable debug to see matching details
window.__PARSER_DEBUG__ = true
```

## What It Learns

The system automatically detects and categorizes headers:

- **Vitals**: Headers with "vital", "vs", "v/s", "sign"
- **HPI**: Headers with "history", "hpi", "present", "illness"  
- **Assessment**: Headers with "assessment", "impression", "diagnosis"
- **Plan**: Headers with "plan", "recommendation", "management"

## Key Features

✅ **Edit in VS Code** - just paste notes into a JS file  
✅ **Auto-detection** - learns header patterns automatically  
✅ **Version controlled** - training examples are part of your repo  
✅ **No build step** - save and test immediately  
✅ **Debug mode** - see exactly what matched  
✅ **Graceful fallback** - uses generic parser if patterns don't match  

## Integration Points

The trained parser is integrated into:

1. **Template Renderer** (`templateRenderer.js`)  
   - Uses learned patterns when normalizing sections
   
2. **Note Parser Full** (`noteParser_full.js`)  
   - Respects custom header patterns from training
   
3. **Parser Helpers** (`parserHelpers.js`)  
   - Vitals/labs extraction works with any learned format

## Console Commands

```javascript
// View all training examples
window.TRAINING_EXAMPLES

// Get learned patterns
window.getLearnedPatterns()

// Reset cache (after adding new examples)
window.resetLearnedPatterns()

// Test parsing with debug output
window.__PARSER_DEBUG__ = true
window.__testHintedParse__(`note text...`)

// Test parsing with custom hints
const hints = {
  vitals: { aliases: ['V/S:'], regex: /^V\/S\s*:?/i },
  // ...
};
window.parseWithHints(`note text...`, hints)
```

## Example Training Scenarios

### Non-Standard Vitals Header

Your hospital writes "V/S:" instead of "Vitals:":

```javascript
{ label: 'ED Format', note: `V/S:\nBP 120/80\n\nHPI:\n...`, enabled: true }
```

### Combined A/P Section

Your notes use "A/P:" for Assessment and Plan together:

```javascript
{ label: 'Progress Note', note: `HPI:\n...\n\nA/P:\n1. CHF\n2. HTN\n...`, enabled: true }
```

### Alternative Terminology

Specialty-specific terms:

```javascript
{ label: 'Cardiology', note: `Clinical History:\n...\n\nImpression:\n...\n\nRecommendations:\n...`, enabled: true }
```

## Troubleshooting

**Q: Parser doesn't recognize my headers**

A: Ensure headers:
- End with `:` or are short (< 40 chars) and capitalized
- Contain category keywords
- Are on their own line

**Q: Sections getting merged**

A: Make headers more distinctive:
- Add colons consistently
- Use proper capitalization
- Ensure blank lines between sections

**Q: Want to see what's matching**

A: Enable debug mode:
```javascript
window.__PARSER_DEBUG__ = true
// Parse a note and check console
```

## Next Steps

1. Open `src/parsers/parserTrainingExamples.js`
2. Paste 2-3 examples of your typical notes
3. Save the file
4. Test in console with `window.__testHintedParse__(yourNote)`
5. Iterate until patterns work correctly

## Files Modified (Existing)

- `/src/core/app.js` - Added imports for training system
- `/src/parsers/templateRenderer.js` - Fixed vitals/assessment/plan normalization (from earlier fixes)
- `/src/parsers/noteParser_full.js` - Fixed section header regex (from earlier fixes)

## No Changes Needed To

- Your existing parsing logic still works
- Graceful fallback if training examples not provided
- No breaking changes to existing functionality
