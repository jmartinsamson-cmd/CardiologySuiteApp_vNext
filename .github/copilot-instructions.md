# Copilot Instructions - Modern Cardiac Suite (concise)

Brief: privacy-first clinical decision support app. ES modules, minimal core, feature-based UI.

Quick architecture & important files

Key conventions (short, actionable)

```javascript
// src/features/my-feature/index.js
export function renderMyFeature() {
  return renderMyFeatureView(canvas);
}

// src/core/router.js - add route
[
  "my-feature",
  () =>
    import("../features/my-feature/index.js").then((m) => m.renderMyFeature()),
];
```

```javascript
// In features: call parser globals
const parsed = window.parseClinicalNote(noteText);
const rendered = window.templateRenderer(parsed, { format: "CIS" });
```

```javascript
// ✅ CORRECT - Safe with withGlobal helper
const pattern = new RegExp(
  String.raw`^(?<name>[A-Za-z][^:=\n]{1,40}?)\s*[:=]\s*(?<value>\d+)`,
  "i"
);
for (const m of text.matchAll(withGlobal(pattern))) {
  /* ... */
}

// ❌ WRONG - Infinite loop risk without global flag
while ((m = pattern.exec(text))) {
  /* ... */
}
```

```javascript
// Both work - adapter functions handle compatibility
createButton({ text: "Save", variant: "primary", onClick: handler });
renderButton("Save", "primary", handler); // legacy
```

Essential developer commands (from `package.json`)

Integration & runtime notes

How to add a feature (example)

1. Create `src/features/my-feature/index.js` export `renderMyFeature`.
2. Implement UI in `src/features/my-feature/view.js` using `src/ui/components/*`.
3. Add a route in `src/core/router.js` mapping to the new render function.

Files to inspect first when troubleshooting

Common fixes & gotchas

Agent task checklist (for automated coding agents)
When adding a feature:

1. Create `src/features/[name]/index.js` with export function `render[Name]`
2. Create `src/features/[name]/view.js` with UI implementation using `src/ui/components/*`
3. Add route mapping in `src/core/router.js` routes Map
4. Run `npm run lint:fix` to auto-fix style issues
5. Run `npm run validate:data` if touching JSON files in `data/`
6. Test route by navigating to `#/[name]` in browser
7. Run `npm run test:e2e` to verify no regressions

When modifying parsers:

1. Edit `src/parsers/noteParser.js` or `noteParser_full.js`
2. Use `String.raw` for all regex patterns
3. Replace `while(re.exec())` with `matchAll(withGlobal(re))`
4. Run `npm run test:unit` and `npm run test:parser` to validate
5. Test with `npm run parse` or `npm run parse:samples` for real note examples
6. Check `scripts/parse-samples.js` for sample inputs

When updating clinical data:

1. Edit JSON files in `data/` (e.g., `data/cardiac_procedures.json`)
2. Run `npm run validate:data` to check schema compliance
3. Run `npm run validate:features` if editing `config/features.json`
4. Commit validated JSON — CI will fail on invalid data

If anything is unclear or you want more examples (parsers, regex helpers, or feature wiring), tell me which area to expand.
