# Debug Mode

## Overview

The application includes comprehensive error handling and debug instrumentation that's **gated behind localStorage**.

### Production (Default)

- ✅ Error handlers **always active** (`window.onerror`, `unhandledrejection`)
- ❌ Verbose trace logs **disabled**
- ❌ Call graph logging **disabled**
- ❌ DOM verification logs **disabled**

### Debug Mode (Opt-in)

- ✅ Error handlers **active**
- ✅ Verbose trace logs **enabled**
- ✅ Call graph logging **enabled**
- ✅ DOM verification logs **enabled**

---

## Enable Debug Mode

```javascript
// In browser console:
localStorage.setItem("DEBUG", "true");
// Reload page to see verbose logs

// Or use shorthand:
window.debug.enable();
```

## Disable Debug Mode

```javascript
// In browser console:
localStorage.removeItem("DEBUG");
// Reload page

// Or use shorthand:
window.debug.disable();
```

## Check Debug Status

```javascript
window.debug.status();
// Output: Debug mode: ✅ ENABLED or ❌ DISABLED
```

---

## Available Debug Utilities

When debug mode is enabled, use these utilities:

### `window.trace(label, data, options)`

Inspect data shape at any point in code

```javascript
const parsed = parseNote(text);
trace("After parsing", parsed);
```

### `window.debug.callGraph`

Track function call hierarchy

```javascript
CallGraph.start("parseNote", input);
const result = parseNote(input);
CallGraph.end(result);
CallGraph.print(); // Show full call tree
```

### `window.debug.safeParse(stageName, fn, input)`

Wrap parser stages with error boundaries

```javascript
const normalized = safeParse("normalize", normalizeData, rawData);
```

### `window.debug.validate(stageName, data, requiredKeys)`

Validate data schemas at stage boundaries

```javascript
validateSchema("ParsedNote", result, ["sections", "fullText"]);
```

### `window.debug.compare(expected, actual, label)`

Compare expected vs actual data shapes

```javascript
compareShapes(expectedShape, actualOutput, "Parser Output");
```

### `window.debug.verify()`

Verify all critical DOM elements exist

```javascript
verifySelectors(); // Lists all elements and their status
```

---

## Global Error Handlers

These are **always active** regardless of debug mode:

### `window.onerror`

Catches synchronous errors

- Logs error details to console
- Shows user-friendly message via templateRenderer
- Includes verbose details only in debug mode

### `window.addEventListener('unhandledrejection')`

Catches unhandled promise rejections

- Logs rejection reason to console
- Shows user-friendly message via templateRenderer
- Includes verbose details only in debug mode

---

## Usage in Parser Stages

Example of instrumented parser flow:

```javascript
// Production: Silent unless errors occur
// Debug mode: Verbose logs at each stage

function processNote(text) {
  trace("Input text", text);

  const parsed = safeParse("parse", parseNote, text);
  trace("Parsed note", parsed);
  validateSchema("ParsedNote", parsed, ["sections", "fullText"]);

  const normalized = safeParse("normalize", normalizeData, parsed);
  trace("Normalized data", normalized);

  const rendered = safeParse("render", renderTemplate, normalized);
  trace("Rendered output", rendered);

  return rendered;
}
```

**Production behavior**: No trace logs, only errors logged
**Debug mode behavior**: Full trace logs at each stage

---

## Performance Impact

- **Production**: Negligible (only `isDebugMode()` checks)
- **Debug mode**: Minimal (console.log overhead only)

All debug utilities are lightweight and safe to leave in production code.

---

## Best Practices

1. **Never commit with DEBUG enabled**

   ```bash
   # Before committing, verify:
   localStorage.getItem('DEBUG') === null
   ```

2. **Use trace() for data inspection**
   - Trace inputs/outputs at stage boundaries
   - Helps identify data shape mismatches

3. **Use safeParse() for error boundaries**
   - Wraps parser stages with try/catch
   - Provides clear error messages with context

4. **Always check error console first**
   - Global handlers catch all errors
   - Stack traces always available

---

## Quick Reference

| Action             | Command                                      |
| ------------------ | -------------------------------------------- |
| Enable debug mode  | `window.debug.enable()`                      |
| Disable debug mode | `window.debug.disable()`                     |
| Check status       | `window.debug.status()`                      |
| Trace data         | `window.trace('label', data)`                |
| Safe parse         | `window.debug.safeParse('stage', fn, input)` |
| Validate schema    | `window.debug.validate('stage', data, keys)` |
| Verify DOM         | `window.debug.verify()`                      |
| Print call graph   | `window.debug.callGraph.print()`             |
