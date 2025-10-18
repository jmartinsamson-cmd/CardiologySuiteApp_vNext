# SVG ViewBox Sanitizer

## Overview

The SVG ViewBox Sanitizer is a runtime guard that automatically detects and fixes invalid `viewBox` attributes in SVG elements. It prevents console errors like:

```
Error: <svg> attribute viewBox: Expected number, "100%"
```

This is particularly useful for:
- **Browser extensions** that inject SVGs with invalid viewBox attributes
- **Third-party scripts** that dynamically create SVGs
- **Legacy code** that may contain percentage-based viewBox values

## How It Works

### 1. Automatic Sanitization

The sanitizer runs automatically on page load and monitors for dynamically added SVGs:

```javascript
// Auto-initializes on script load
// No manual initialization needed
```

### 2. Sanitization Logic

Invalid viewBox values are converted to valid numeric values:

```
"0 0 100% 4"     → "0 0 100 4"      ✅ Fixed
"0% 0% 100% 100%" → "0 0 100 100"    ✅ Fixed
"0 0 24 24"      → "0 0 24 24"      ✅ Already valid (no change)
```

### 3. MutationObserver

A MutationObserver continuously monitors the DOM for new SVGs:

```javascript
// Watches for:
// - SVG elements added directly to the DOM
// - SVGs added within new container elements
// - SVGs from browser extensions or scripts
```

## Files

### Core Files

| File | Purpose |
|------|---------|
| `src/utils/svgSanitizer.browser.js` | Browser-compatible sanitizer (ES5, global namespace) |
| `src/utils/svgSanitizer.js` | ES6 module version (for build tools/tests) |
| `tests/svg-sanitizer.spec.js` | Comprehensive test suite |

### Integration Points

The sanitizer is loaded early in all HTML files:

```html
<!-- SVG Sanitizer (protect against invalid viewBox from extensions) -->
<script src="src/utils/svgSanitizer.browser.js"></script>
```

**Loaded in:**
- `index.html`
- `guidelines.html`
- `meds.html`

## API Reference

### Global Namespace

All functions are available via `window.SVGSanitizer`:

#### `SVGSanitizer.sanitizeSVGViewBox(svg)`

Sanitizes a single SVG element.

**Parameters:**
- `svg` (SVGElement) - The SVG element to sanitize

**Returns:**
- `boolean` - `true` if sanitization was performed, `false` otherwise

**Example:**
```javascript
const svg = document.querySelector('svg');
const wasFixed = SVGSanitizer.sanitizeSVGViewBox(svg);
console.log('Fixed:', wasFixed);
```

#### `SVGSanitizer.sanitizeAllSVGs(root)`

Sanitizes all SVG elements within a container.

**Parameters:**
- `root` (Document|Element) - Root element to search (defaults to `document`)

**Returns:**
- `number` - Count of SVGs that were sanitized

**Example:**
```javascript
const count = SVGSanitizer.sanitizeAllSVGs();
console.log(`Fixed ${count} SVG(s)`);
```

#### `SVGSanitizer.installSVGSanitizer(root)`

Installs a MutationObserver to watch for dynamically added SVGs.

**Parameters:**
- `root` (Element) - Root element to observe (defaults to `document.body`)

**Returns:**
- `MutationObserver` - The observer instance (call `.disconnect()` to stop)

**Example:**
```javascript
const observer = SVGSanitizer.installSVGSanitizer();
// Later, to stop observing:
observer.disconnect();
```

#### `SVGSanitizer.initSVGSanitizer()`

**Auto-called on script load.** Performs initial sanitization and installs the observer.

## Testing

### Run Tests

```bash
npm test -- svg-sanitizer
```

### Test Coverage

The test suite includes:

1. **Unit Tests**
   - ✅ Sanitize percentage values
   - ✅ Preserve valid numeric values
   - ✅ Handle decimals and negative values
   - ✅ Ignore non-SVG elements

2. **Integration Tests**
   - ✅ Sanitize multiple SVGs
   - ✅ Detect dynamically added SVGs
   - ✅ Handle SVGs in nested containers

3. **Console Error Detection**
   - ✅ Verify no viewBox-related errors after sanitization
   - ✅ Full UI mount without errors

## Examples

### Example 1: Extension-Injected SVG

A browser extension injects an SVG with invalid viewBox:

```html
<!-- Before -->
<svg viewBox="0 0 100% 4">
  <rect width="100%" height="4" fill="red" />
</svg>
```

The sanitizer automatically fixes it:

```html
<!-- After -->
<svg viewBox="0 0 100 4">
  <rect width="100%" height="4" fill="red" />
</svg>
```

Console output:
```
[SVG Sanitizer] Fixed viewBox: "0 0 100% 4" -> "0 0 100 4"
[SVG Sanitizer] Sanitized 1 SVG element(s)
```

### Example 2: Dynamically Created SVG

JavaScript creates an SVG with invalid viewBox:

```javascript
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('viewBox', '0 0 50% 50%');
document.body.appendChild(svg);

// MutationObserver automatically detects and fixes it
// Console: [SVG Sanitizer] Fixed viewBox: "0 0 50% 50%" -> "0 0 50 50"
```

### Example 3: Manual Sanitization

Manually sanitize a specific container:

```javascript
// After loading third-party content
const container = document.getElementById('external-content');
const fixedCount = SVGSanitizer.sanitizeAllSVGs(container);

if (fixedCount > 0) {
  console.log(`Fixed ${fixedCount} SVG(s) from external content`);
}
```

## Performance

- **Negligible overhead**: Only runs when SVGs are detected
- **Efficient regex**: Quick validation checks before parsing
- **Smart observers**: Only monitors when needed
- **No layout impact**: Only modifies invalid viewBox attributes

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Requirements:**
- `MutationObserver` (supported in all modern browsers)
- `SVGSVGElement` (native SVG support)

## Debugging

Enable detailed logging:

```javascript
// Check if sanitizer is active
console.log('SVGSanitizer:', window.SVGSanitizer);

// Manually trigger sanitization
SVGSanitizer.sanitizeAllSVGs();

// Monitor observer status
const observer = SVGSanitizer.installSVGSanitizer();
console.log('Observer active:', observer);
```

## Known Limitations

1. **Assumes 4-value viewBox**: The sanitizer expects `viewBox="minX minY width height"` format
2. **No unit conversion**: Percentages are removed, not converted (e.g., 100% → 100, not calculated)
3. **CSS viewBox not supported**: Only fixes HTML `viewBox` attributes, not CSS properties

## Changelog

### Version 1.0.0 (2025-10-05)

- ✅ Initial release
- ✅ Automatic percentage removal
- ✅ MutationObserver integration
- ✅ Comprehensive test coverage
- ✅ Browser-compatible ES5 version

## License

Part of the Cardiology Suite project. See main LICENSE file.
