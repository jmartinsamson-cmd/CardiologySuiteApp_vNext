# Changelog

All notable changes to this project will be documented in this file.

## [0.7.0] - 2025-10-05

### Fixed - Parser Vitals/Labs Extraction

**Root Causes Resolved:**

1. **Regex name pattern consuming separators** ([parserHelpers.js:279](cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/src/utils/parserHelpers.js#L279))
   - Character class included `:` and `=`, causing "BNP:" to match as name
   - **Fix**: Changed to `[^:=\n]{1,40}?` to explicitly exclude separator characters
   - Result: All 5 labs (Troponin, BNP, Creatinine, Potassium, Hemoglobin) now extract correctly

2. **Deduplication function not calling keyFn** ([parserHelpers.js:41](cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/src/utils/parserHelpers.js#L41))
   - `dedupeByKey()` treated function parameter as property name
   - **Fix**: Added `typeof keyFn === 'function'` check to invoke function
   - Result: Duplicate lab entries correctly removed

3. **Duplicate lab extraction calls** ([noteParser_full.js:69](cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/src/parsers/noteParser_full.js#L69))
   - `extractLabs()` called twice with section and full text
   - **Fix**: Single call passing sections parameter - `extractLabs(clean, sections)`
   - Result: No duplicate entries in results

### Added

- **Unit tests** (12/12 passing):
  - Comparator values (`<0.5 mg/dL`)
  - Labs without units (`K 4.0`)
  - Dual combo format (`PT/INR: 12.0/1.1 sec`)
  - High/Low flags in various formats (H, L, High, Low, ↑, ↓, *)
  - Reference ranges in brackets/parentheses
  - Admin header filtering (Date, Time, Patient, MRN)

- **ESLint guards**:
  - `no-restricted-syntax` rule forbids unguarded `while(re.exec())` loops
  - Enforces `matchAll(withGlobal(re))` pattern to prevent infinite loops

- **Parser Development Patterns** section in README.md:
  - String.raw usage for regex escaping
  - Name grammar excluding separators
  - Combo-first strategy
  - Allowlist pattern with word boundaries
  - Flag coercion (H/L normalization)

### Performance

- Parse time: **400ms** (under 500ms budget)
- No frames >200ms after warm-up
- No long tasks >100ms
- All performance thresholds enforced in CI via [playwright.yml](.github/workflows/playwright.yml)

---

## [1.0.0] - 2025-01-XX

Initial release with clinical decision trees, note parser, and modern UI components.
