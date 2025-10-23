# Architectural Issues Detected

This document catalogs all architectural and code quality issues found during automated analysis of the CardiologySuiteApp_vNext codebase.

## Summary Statistics

| Category | Count | Severity | Status |
|----------|-------|----------|--------|
| **Hardcoded URLs** | 4 (excluding node_modules) | Medium | Pending Fix |
| **Missing Error Handling** | 4 fetch calls | High | Pending Fix |
| **Console.log Statements** | 125+ | Low | Pending Fix |
| **Memory Leak Risk** | 35 event listeners without cleanup | Medium | Pending Fix |
| **Missing JSDoc** | 6 key parser files | Low | Pending Fix |
| **Circular Dependencies** | 0 | N/A | ✅ Clean |
| **Broken Imports** | 0 | N/A | ✅ Clean |

---

## 1. Hardcoded URLs (4 instances)

### Issue
Localhost URLs are hardcoded in production code, preventing environment-based configuration.

### Locations

#### src/core/app.js:113
```javascript
return "http://localhost:8081";
```
**Context:** `getAISearchBase()` function always returns localhost regardless of environment.

#### services/ai-search/server.js:41-44
```javascript
"http://localhost:8080",
"http://localhost:3000",
"http://localhost:5173",
"http://localhost:5500",  // Five Server
```
**Context:** CORS origins hardcoded for development ports.

### Impact
- Cannot deploy to production without code changes
- No support for staging/production environments
- CORS fails if deployed to different origin

### Recommendation
Create environment-based configuration:
```javascript
// config/environment.js
export const config = {
  aiSearchBase: process.env.AI_SEARCH_BASE || 'http://localhost:8081',
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5500'
  ]
};
```

---

## 2. Missing Error Handling (4 fetch calls)

### Issue
Fetch API calls lack try-catch blocks, leading to unhandled promise rejections on network failures.

### Locations

#### src/core/app.js:119-122 (AI Search Health Check)
```javascript
const r = await fetch(`${base}/health`, { cache: "no-store" });
const j = await r.json();
if (j && j.ok) {
  console.log("✅ AI Search /health:", j);
}
```
**Problem:** No error handling if fetch fails or returns non-200 status.

#### src/core/app.js:136-139 (AI Search Query)
```javascript
const r = await fetch(`${base}/search`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ query, top }),
});
```
**Problem:** No try-catch wrapper, no check for response.ok before parsing JSON.

#### src/core/app.js:463-465 (Load Diagnosis Data)
```javascript
const response = await fetch("./data/cardiology_diagnoses/cardiology.json");
if (!response.ok) {
  throw new Error(`Failed to load diagnosis data: ${response.status}`);
}
```
**Problem:** Has status check but no try-catch to handle network failures.

#### src/core/app.js:710-711 (Load Labs Reference)
```javascript
const response = await fetch("./data/labs_reference/labs_reference.json");
const labData = await response.json();
```
**Problem:** No error handling at all.

### Impact
- Application crashes on network failures
- Poor user experience (no error messages)
- Difficult debugging (unhandled rejections)

### Recommendation
Implement consistent error handling pattern:
```javascript
async function safeFetch(url, options = {}) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Fetch failed for ${url}:`, error);
    throw error; // Re-throw for caller to handle
  }
}
```

---

## 3. Console.log Statements (125+ instances)

### Issue
Excessive console.log calls in production code increase bundle size and expose debugging information.

### Statistics
- **Total console.log statements:** 125 (found via grep)
- **Primary location:** Parser files (`src/parsers/`)

### Example Locations
- `src/parsers/noteParser.js` - debugging parser logic
- `src/parsers/templateRenderer.js` - template rendering diagnostics
- `src/core/app.js` - application lifecycle logs
- `services/ai-search/server.js` - server request logs

### Impact
- **Performance:** Unnecessary console operations slow down parsing
- **Security:** May leak sensitive data to browser console
- **Maintainability:** Clutters console output

### Recommendation
Implement debug flag pattern:
```javascript
// src/utils/logger.js
const DEBUG = import.meta.env.DEV || false;

export function debugLog(...args) {
  if (DEBUG) {
    console.log(...args);
  }
}

export function debugWarn(...args) {
  if (DEBUG) {
    console.warn(...args);
  }
}
```

Then replace all `console.log()` with `debugLog()` for non-critical logs.
Keep critical error logs as `console.error()`.

---

## 4. Memory Leak Risk: Event Listeners (35 instances)

### Issue
Event listeners are attached without corresponding cleanup, causing memory leaks on route changes or component unmounting.

### Statistics
- **addEventListener calls:** 35
- **removeEventListener calls:** 0
- **Imbalance:** 35 listeners without cleanup

### Common Patterns
1. **Route handlers add listeners but never remove them:**
   ```javascript
   document.getElementById('button').addEventListener('click', handler);
   // No cleanup when navigating away
   ```

2. **Global event listeners on window/document:**
   ```javascript
   window.addEventListener('resize', handleResize);
   // Never removed
   ```

### Impact
- Memory leaks on repeated route changes
- Duplicate event handlers after multiple visits to same route
- Degraded performance over time

### Recommendation
Implement cleanup pattern in router:
```javascript
// Store active listeners for cleanup
const activeListeners = new Set();

function addManagedListener(element, event, handler) {
  element.addEventListener(event, handler);
  activeListeners.add({ element, event, handler });
}

function cleanupListeners() {
  for (const { element, event, handler } of activeListeners) {
    element.removeEventListener(event, handler);
  }
  activeListeners.clear();
}

// Call cleanupListeners() before each route change
```

---

## 5. Missing JSDoc/Type Annotations (6 files)

### Issue
Critical parser files lack JSDoc comments and type annotations, making codebase difficult to understand and maintain.

### Files Missing JSDoc

1. **src/parsers/noteParser.js**
   - Main parsing entry point (959 lines)
   - No function signatures documented
   
2. **src/parsers/noteParser_full_async.js**
   - Async parser variant
   - Missing parameter/return types
   
3. **src/parsers/cardiology/index.js**
   - Cardiology-specific logic
   - No documentation of algorithms
   
4. **src/parsers/noteParser.worker.js**
   - Web Worker implementation
   - Missing message protocol documentation
   
5. **src/parsers/parserHeuristics.js**
   - Complex scoring heuristics
   - No explanation of scoring logic
   
6. **src/parsers/templateRenderer.js**
   - Template rendering (3481 lines)
   - Minimal documentation

### Impact
- Difficult for new developers to understand
- Hard to maintain without breaking changes
- No IDE autocompletion/type checking
- Increased risk of bugs

### Recommendation
Add JSDoc comments to all exported functions:
```javascript
/**
 * Parses a clinical note and extracts structured data.
 * @param {string} noteText - Raw clinical note text
 * @param {Object} options - Parsing options
 * @param {boolean} options.async - Use async parser
 * @param {string} options.format - Output format ('CIS', 'SOAP', etc.)
 * @returns {Promise<Object>} Parsed note with sections, vitals, meds, diagnoses
 * @throws {Error} If note text is empty or invalid
 */
export async function parseClinicalNote(noteText, options = {}) {
  // ...
}
```

Consider adding TypeScript for stronger type safety.

---

## 6. Architectural Strengths (No Issues Found)

### ✅ Clean Import Structure
- **No circular dependencies detected**
- All import paths resolve correctly
- Clear dependency hierarchy (5 levels max)

### ✅ Modular Design
- Features isolated in `src/features/*`
- UI components in `src/ui/components/*`
- Clear separation of concerns

### ✅ Parser Pipeline Architecture
- Multi-stage pipeline (normalize → extract → score → format)
- Good separation of entity extraction logic
- Clear data flow

---

## Priority Matrix

| Issue | Severity | Effort | Priority |
|-------|----------|--------|----------|
| Missing Error Handling | High | Low | **P0** |
| Hardcoded URLs | Medium | Low | **P0** |
| Memory Leak Risk | Medium | Medium | **P1** |
| Console.log Statements | Low | Low | **P2** |
| Missing JSDoc | Low | High | **P3** |

---

## Next Steps

1. **Immediate (P0):**
   - Add error handling to all fetch calls
   - Create environment configuration for URLs
   
2. **Short-term (P1):**
   - Implement event listener cleanup pattern
   - Test cleanup on route changes
   
3. **Medium-term (P2):**
   - Replace console.log with debug logger
   - Add development/production mode detection
   
4. **Long-term (P3):**
   - Add JSDoc to all parser functions
   - Consider TypeScript migration for type safety

---

**Generated:** Analysis completed on architecture review
**Analysis Scripts:** `/tmp/find-issues.sh`, `/tmp/check-circular-deps.sh`, `/tmp/check-broken-imports.sh`
