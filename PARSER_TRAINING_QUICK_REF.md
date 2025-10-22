# Parser Training - Quick Reference

## 🎯 Goal
Teach the parser your hospital's clinical note formats by pasting examples into a file.

## 📝 How To Train (3 Steps)

### 1. Open File
`src/parsers/parserTrainingExamples.js`

### 2. Add Your Note
```javascript
{
  label: 'My Hospital ED Note',
  note: `
Paste your entire clinical note here...
  `.trim(),
  enabled: true
}
```

### 3. Save
Done! Parser auto-learns on save.

## 🧪 Test in Console

```javascript
// See what was learned
window.getLearnedPatterns()

// Test parsing
window.__testHintedParse__(`your note...`)

// Debug mode
window.__PARSER_DEBUG__ = true
```

## 📋 What It Learns

Automatically detects headers containing:
- **Vitals**: vital, vs, v/s, sign
- **HPI**: history, hpi, present, illness  
- **Assessment**: assessment, impression, diagnosis
- **Plan**: plan, recommendation, management

## ✅ Tips

- Headers should end with `:` or be short & capitalized
- Put each header on its own line
- Add 2-3 example notes from your typical format
- Disable examples with `enabled: false`

## 🔍 Example Formats

**Standard:**
```
History of Present Illness:
...

Vitals:
BP: 120/80

Assessment:
1. CHF
```

**Abbreviated:**
```
HPI:
...

VS:
BP 120/80, P 75

A/P:
1. CHF - diurese
```

**Alternative:**
```
Clinical History:
...

V/S:
BP 120/80

Impression:
CHF exacerbation

Recommendations:
- Lasix
```

## 📚 Full Docs
See `/docs/PARSER_TRAINING_GUIDE.md` for complete documentation.
