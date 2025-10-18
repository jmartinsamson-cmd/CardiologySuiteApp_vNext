# 🔧 Debug & Testing Guide - Note Generation Flow

## Overview

This guide covers the comprehensive debugging and testing instrumentation added to the Cardiology Suite note parsing system.

---

## A. Call Graph & Breakpoint Logging

### What It Does

Traces the complete execution flow from button click through parsing to final output, showing:

- Function call hierarchy
- Data types at each stage
- Execution timing
- Data shape changes

### Usage

```javascript
// Automatic tracing when clicking "Parse & Generate Note" button
// View in browser console

// Manual tracing
window.trace("My Label", myData, { showSample: true, maxKeys: 10 });

// View call graph
window.CallGraph.print();
```

### Output Example

```
🔍 TRACE [2025-10-03T...] INPUT: processNote
  Type: string
  String Length: 450
  String Preview: Chief Complaint: Chest pain...

📞 CALL: processNote
📞 CALL: detectHPIOnlyInput
✅ RETURN: detectHPIOnlyInput (2ms)
📞 CALL: parseNote
✅ RETURN: parseNote (45ms)
📞 CALL: normalizeSections
✅ RETURN: normalizeSections (12ms)

📊 CALL GRAPH
  ✅ processNote (185ms)
    ✅ detectHPIOnlyInput (2ms)
    ✅ parseNote (45ms)
    ✅ normalizeSections (12ms)
    ✅ updateUI (8ms)
```

---

## B. DOM Selector Verification

### What It Does

Verifies all DOM elements exist and are properly wired to JavaScript event handlers.

### Usage

```javascript
// Verify all selectors
window.debug.verify();
// or
window.verifySelectors();
```

### Output Example

```
🔎 DOM Selector Verification
✅ vs-paste: FOUND TEXTAREA
✅ vs-parse: FOUND BUTTON
✅ rendered-output: FOUND TEXTAREA
✅ template-renderer-panel: FOUND SECTION
✅ All selectors valid
```

### Selector Map

| ID                   | Selector                   | Purpose               |
| -------------------- | -------------------------- | --------------------- |
| `vs-paste`           | `textarea#vs-paste`        | Clinical note input   |
| `vs-parse`           | `button#vs-parse`          | Parse button          |
| `vs-clear`           | `button#vs-clear`          | Clear input button    |
| `rendered-output`    | `textarea#rendered-output` | Generated note output |
| `template-select`    | `select#template-select`   | Template dropdown     |
| `smartphrase-toggle` | `input#smartphrase-toggle` | SmartPhrase checkbox  |

---

## C. Fault-Proof Error Instrumentation

### What It Does

Catches and logs all errors (synchronous and asynchronous) with detailed context.

### Features

1. **Global Error Handler**
   - Catches all uncaught exceptions
   - Shows user-friendly error messages
   - Logs full stack trace to console

2. **Promise Rejection Handler**
   - Catches unhandled promise rejections
   - Prevents silent failures

3. **Safe Parse Wrapper**
   - Wraps each parser stage in try/catch
   - Provides detailed error context

### Usage

```javascript
// Automatically enabled on page load

// Manual usage for custom code
window.safeParse("myStage", myFunction, inputData);
```

### Error Output Example

```
💥 GLOBAL ERROR:
  message: Cannot read property 'sections' of undefined
  source: templateRenderer.js
  line: 1668
  error: Error: Cannot read property...

❌ Failed stage: parseClinicalNote
  error: Parser stage "parseClinicalNote" failed
  inputSample: Chief Complaint: Chest pain...
```

---

## D. Schema Guards on Parser Outputs

### What It Does

Validates data structure at each parser stage to catch missing or malformed data early.

### Usage

```javascript
// Validate data has required keys
window.validateSchema("stageName", data, ["requiredKey1", "requiredKey2"]);

// Allow null values
window.validateSchema("stageName", data, [], { allowNull: true });

// Allow empty objects
window.validateSchema("stageName", data, [], { allowEmpty: true });
```

### Schema Definitions

```javascript
window.ParserSchemas = {
  PARSED_NOTE: {
    required: ["sections", "fullText"],
    optional: ["vitals", "labs", "medications"],
  },

  NORMALIZED_SECTIONS: {
    required: [],
    optional: ["HPI", "ASSESSMENT", "PLAN"],
  },
};
```

### Validation Output

```
✅ Schema valid for stage: parseClinicalNote { keys: 8 }

❌ [normalizeSections] Schema validation failed:
  missingKeys: ['sections']
  actualKeys: ['fullText', 'vitals']
  dataSample: {"fullText":"...","vitals":...}
```

---

## E. Minimal Smoke Tests

### What It Does

Tests core parsing functions with minimal input to ensure basic functionality works.

### Running Tests

**Option 1: Browser Test Runner**

```
Open: tests/test-runner.html in browser
Click: "Run Tests" button
```

**Option 2: Console**

```javascript
// Load test file in browser, then:
window.runSmokeTests();
```

### Test Coverage

1. ✅ Parser functions are available
2. ✅ parseClinicalNoteFull returns valid structure
3. ✅ Parsed data contains expected sections
4. ✅ TemplateRenderer is initialized
5. ✅ TemplateRenderer can process HPI
6. ✅ TemplateRenderer can normalize sections
7. ✅ TemplateRenderer can render CIS template
8. ✅ Rendered output includes key sections
9. ✅ Full end-to-end processing
10. ✅ Error handling: null input
11. ✅ Error handling: empty string

### Sample Test Output

```
🧪 Running Smoke Tests for Note Parsing

✅ PASS: Parser functions are available
✅ PASS: parseClinicalNoteFull returns valid structure
✅ PASS: Parsed data contains expected sections
✅ PASS: TemplateRenderer is initialized
✅ PASS: TemplateRenderer can normalize sections
✅ PASS: Rendered output includes key sections
✅ PASS: Full end-to-end processing

Results: 7 passed, 0 failed
🎉 All tests passed!
```

---

## F. Async Timing & Route Readiness

### What It Does

Ensures DOM elements are ready before attaching event handlers, preventing timing issues.

### Usage

```javascript
// Wait for DOM ready
await window.domReady();

// Wait for specific element
const button = await window.waitForElement("#vs-parse", 5000);

// Wait for all critical elements
const ready = await window.waitForCriticalElements();

// Attach handlers after everything is ready
await window.ensureHandlersReady(() => {
  document.getElementById("vs-parse").addEventListener("click", handleClick);
});
```

### Example Integration

```javascript
// In templateRenderer.js constructor
async init() {
  await window.domReady();
  await window.waitForCriticalElements();

  this.createUI();
  this.bindEvents();
  this.loadSettings();
}
```

---

## Quick Debugging Checklist

When the "Parse & Generate Note" button doesn't work:

### 1. Check Console for Errors

```javascript
// Open DevTools (F12) → Console
// Look for red error messages
```

### 2. Verify Elements Exist

```javascript
window.debug.verify();
```

### 3. Check Parser Availability

```javascript
console.log("parseClinicalNoteFull:", typeof window.parseClinicalNoteFull);
console.log("templateRenderer:", window.templateRenderer);
```

### 4. Trace Full Flow

```javascript
// Paste text and click button
// Watch console for call graph output
window.CallGraph.print();
```

### 5. Run Smoke Tests

```javascript
window.runSmokeTests();
```

### 6. Check Data Shapes

```javascript
// After clicking parse button, check:
console.log("Parsed data:", window.templateRenderer.parsedData);
console.log("Normalized:", window.templateRenderer.normalizedSections);
```

---

## Common Issues & Solutions

### Issue: "Parser returned null/undefined"

**Solution:** Check that noteParser_full.js loaded correctly

```javascript
console.log(typeof window.parseClinicalNoteFull);
// Should be "function"
```

### Issue: "rendered-output textarea not found"

**Solution:** Verify element exists

```javascript
console.log(document.getElementById("rendered-output"));
// Should return <textarea> element
```

### Issue: Button click does nothing

**Solution:** Check event listener attached

```javascript
const btn = document.getElementById("vs-parse");
console.log(btn);
console.log(window.templateRenderer);
// Both should be non-null
```

### Issue: Data shape mismatch

**Solution:** Use comparison tool

```javascript
const expected = { sections: {}, fullText: "" };
const actual = window.templateRenderer.parsedData;
window.debug.compare(expected, actual, "Parsed Data");
```

---

## Debug Utilities Reference

All utilities available via `window.debug.*`:

| Utility                             | Purpose              |
| ----------------------------------- | -------------------- |
| `debug.trace(label, data)`          | Trace data shape     |
| `debug.callGraph.print()`           | Print execution tree |
| `debug.verify()`                    | Verify DOM selectors |
| `debug.validate(stage, data, keys)` | Validate schema      |
| `debug.compare(expected, actual)`   | Compare shapes       |
| `debug.safeParse(name, fn, input)`  | Safe wrapper         |
| `debug.domReady()`                  | Wait for DOM         |
| `debug.waitForElement(sel)`         | Wait for element     |
| `debug.waitForCriticalElements()`   | Wait for all         |
| `debug.ensureHandlersReady(fn)`     | Attach safely        |

---

## Files Added/Modified

### New Files

- `src/utils/debugInstrumentation.js` - All debug utilities
- `tests/smoke-parsing.spec.js` - Test suite
- `tests/test-runner.html` - Browser test runner
- `DEBUG_GUIDE.md` - This file

### Modified Files

- `index.html` - Added debug script load
- `src/parsers/templateRenderer.js` - Added instrumentation to processNote()

---

## Next Steps

1. **Refresh browser** (Ctrl+Shift+R / Cmd+Shift+R)
2. **Open DevTools** (F12)
3. **Click "Parse & Generate Note"**
4. **Watch console output** for detailed trace
5. **If issues persist, run:** `window.debug.verify()`
6. **Run smoke tests:** Open `tests/test-runner.html`

---

## Support

For issues or questions, check:

1. Browser console for error messages
2. Call graph output: `window.CallGraph.print()`
3. DOM verification: `window.debug.verify()`
4. Smoke test results: `window.runSmokeTests()`
