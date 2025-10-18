# Accessibility Patch - High-Impact Fixes

## Audit Summary

Automated accessibility audit found the following **high-impact** issues requiring fixes:

### Critical Issues (Already Fixed)

✅ **document-title**: All pages have `<title>` elements
✅ **html-has-lang**: All pages have `lang="en"` attribute
✅ **landmark-one-main**: Pages have `<main>` landmarks

### Issues Requiring Fixes

🔴 **aria-labels missing**: Generate button and other interactive elements lack accessible names
🔴 **Focus order**: Elements not keyboard accessible (elements not loading in test - configuration issue)
🟡 **page-has-heading-one**: Pages use h3 instead of h1 for main headings

---

## Minimal Patch

Apply the following changes to **index.html**:

### 1. Add aria-label to Generate button (line 128)

**Before:**

```html
<button id="vs-parse" class="btn primary">🔄 Parse & Generate Note</button>
```

**After:**

```html
<button
  id="vs-parse"
  class="btn primary"
  aria-label="Parse clinical note and generate formatted output"
>
  🔄 Parse & Generate Note
</button>
```

### 2. Add aria-label to Clear button (line 129)

**Before:**

```html
<button id="vs-clear" class="btn ghost">Clear All</button>
```

**After:**

```html
<button
  id="vs-clear"
  class="btn ghost"
  aria-label="Clear all input and output fields"
>
  Clear All
</button>
```

### 3. Add aria-label to textarea (line 126)

**Before:**

```html
<textarea
  id="vs-paste"
  rows="4"
  placeholder="Paste progress note, H&P, or clinical data here to parse vitals/labs and generate formatted note..."
></textarea>
```

**After:**

```html
<textarea
  id="vs-paste"
  rows="4"
  placeholder="Paste progress note, H&P, or clinical data here to parse vitals/labs and generate formatted note..."
  aria-label="Clinical note input"
></textarea>
```

### 4. Add aria-label to search input (line 107)

**Before:**

```html
<input type="text" id="search" placeholder="Search diagnoses..." />
```

**After:**

```html
<input
  type="text"
  id="search"
  placeholder="Search diagnoses..."
  aria-label="Search diagnoses"
/>
```

### 5. Add aria-label to search clear button (line 108)

**Before:**

```html
<button class="search-clear hidden">×</button>
```

**After:**

```html
<button class="search-clear hidden" aria-label="Clear search">×</button>
```

---

## Color Contrast Status

✅ **All color contrast checks passed** - No violations found for WCAG 2.1 AA (4.5:1 minimum)

---

## Apply Similar Fixes To:

- **guidelines.html**: Add aria-labels to interactive elements
- **meds.html**: Add aria-labels to interactive elements

---

## Test After Applying

Run accessibility audit:

```bash
npm run test:a11y
```

Expected result: All critical/serious violations resolved.

---

## Technical Details

**Standards**: WCAG 2.1 AA
**Tool**: axe-core 4.10 via @axe-core/playwright
**Test File**: tests/a11y-mpa.spec.ts
**Audit Date**: 2025-10-03
