# Copilot Instructions - Modern Cardiac Suite (concise)

Brief: privacy-first clinical decision support app. ES modules, minimal core, feature-based UI.

Quick architecture & important files
- Core & router: `src/core/app.js`, `src/core/router.js` (hash-based, lazy imports for features)
- Features: each feature in `src/features/[name]/` with `index.js` (export render) and `view.js`
- Parsers: `src/parsers/noteParser.js`, `src/parsers/noteParser_full.js`, `src/parsers/templateRenderer.js` (parsers attach globals to `window`)
- UI: `src/ui/components/` + adapter exports to support legacy calls
- Data & flags: `data/` JSON files and `config/features.json` (validated by `scripts/validate-features.js`)

Key conventions (short, actionable)
- Feature entry: export a named render function (e.g., `renderNoteTools`) from `src/features/*/index.js` and wire it in `router.js`.
  ```javascript
  // src/features/my-feature/index.js
  export function renderMyFeature() { return renderMyFeatureView(canvas); }
  
  // src/core/router.js - add route
  ['my-feature', () => import('../features/my-feature/index.js').then(m => m.renderMyFeature())]
  ```

- Parser globals: use `window.parseClinicalNote` and `window.templateRenderer` — features call these globals directly.
  ```javascript
  // In features: call parser globals
  const parsed = window.parseClinicalNote(noteText);
  const rendered = window.templateRenderer(parsed, { format: 'CIS' });
  ```

- Regex in parsers: prefer `String.raw` for patterns and `text.matchAll(withGlobal(re))` instead of `while(re.exec())`.
  ```javascript
  // ✅ CORRECT - Safe with withGlobal helper
  const pattern = new RegExp(String.raw`^(?<name>[A-Za-z][^:=\n]{1,40}?)\s*[:=]\s*(?<value>\d+)`, 'i');
  for (const m of text.matchAll(withGlobal(pattern))) { /* ... */ }
  
  // ❌ WRONG - Infinite loop risk without global flag
  while ((m = pattern.exec(text))) { /* ... */ }
  ```

- UI adapters: components expose modern object-style API (e.g. `createButton({text,variant,onClick})`) and legacy shims exist.
  ```javascript
  // Both work - adapter functions handle compatibility
  createButton({ text: "Save", variant: "primary", onClick: handler });
  renderButton("Save", "primary", handler);  // legacy
  ```

Essential developer commands (from `package.json`)
- Dev server: `npm run dev` (vite) or fallback `npm start` (python -m http.server 8080)
- Search service: `npm run start:search` (runs `services/ai-search/server.js`)
- Data & validation: `npm run validate:data`, `npm run validate:features`
- Tests: unit/parsing via `npm run test:unit`, Playwright e2e/visual under `npm run test:e2e` / `test:visual`
- Lint: `npm run lint` and `npm run lint:fix`
- Visual regression: `npm run test:visual` (compare screenshots), `npm run test:visual:update` (update baselines)
- Accessibility: `npm run test:a11y` (axe-core checks)
- Security: `npm run security:check` (audit + lint + data validation)
- Build CSS: `npm run build:css` (production) or `npm run watch:css` (dev mode)

Integration & runtime notes
- No PHI sent externally; most processing client-side. Check `services/ai-search/` for server-side AI glue if testing enhancements.
- Service worker: `sw.js` registers PWA offline features; inspect registration in `src/core/app.js`.
- Feature flags in `config/features.json` are read at runtime — toggling the file requires no build and is validated by CI.
- Module type: `package.json` has `"type": "module"` — all `.js` files are ES modules. Use `.cjs` for CommonJS.
- MCP integration: `mcp/ai-search-mcp-server.mjs` provides Model Context Protocol server for AI search features.

How to add a feature (example)
1. Create `src/features/my-feature/index.js` export `renderMyFeature`.
2. Implement UI in `src/features/my-feature/view.js` using `src/ui/components/*`.
3. Add a route in `src/core/router.js` mapping to the new render function.

Files to inspect first when troubleshooting
- `src/core/router.js`, `src/parsers/*`, `src/features/note-tools/*`, `config/features.json`, `services/ai-search/server.js`, `sw.js`.

Common fixes & gotchas
- **ES module errors**: Ensure `package.json` has `"type": "module"` and imports use `.js` extensions.
- **CORS issues**: When running `npm run api` (json-server), add `--host 0.0.0.0` if accessing from containers.
- **Parser not found**: Check `window.parseClinicalNote` exists — parsers attach globals in `src/parsers/noteParser.js`.
- **Feature not routing**: Verify route added to `src/core/router.js` routes Map and feature exports correct function name.
- **CSS not updating**: Run `npm run build:css` or `npm run watch:css` to regenerate Tailwind output.
- **PowerShell scripts (Windows)**: CSS integrity scripts use `pwsh` — ensure PowerShell 7+ installed or skip with `--skip-css-check`.
- **Playwright tests failing**: Update snapshots with `npm run test:visual:update` after intentional UI changes.

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
