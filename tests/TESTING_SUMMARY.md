# Testing Summary

## Test Suites Overview

This project has comprehensive test coverage across multiple layers:

### 1. Unit Tests (`npm run test:unit`)

- **29 tests** covering parser pipeline
- Tests normalize → detectSections → extractEntities → mapToTemplate
- Fixtures: clean H&P, messy headings, missing plan, inline vitals, alternate synonyms
- **Status**: ✅ 29 passing

### 2. E2E Tests (`npm run test:e2e`)

- **16 tests** covering user workflows with Playwright
- Routes: home, guidelines, notes, medications
- Features: parse button, copy/clear, theme toggle, diagnosis sidebar
- **Status**: ✅ 15 passing, 1 skipped

### 3. Visual Regression Tests (`npm run test:visual`)

- **10 tests** with screenshot comparisons
- Components: sidebar, note output area, input panel, full page layout
- Snapshots: 9 baseline images (724KB total)
- **Status**: ✅ 10 passing

## Quick Reference

| Command                       | Purpose                     | Duration |
| ----------------------------- | --------------------------- | -------- |
| `npm run test:unit`           | Run parser unit tests       | ~2s      |
| `npm run test:e2e`            | Run end-to-end tests        | ~35s     |
| `npm run test:visual`         | Run visual regression tests | ~22s     |
| `npm run test:visual:approve` | Interactive snapshot update | Variable |
| `npm run test:visual:report`  | Open visual diff report     | N/A      |

## Visual Testing Workflow

### Day-to-Day Development

```bash
# Before committing UI changes
npm run test:visual
```

### When Snapshots Fail

```bash
# Review diffs visually
npm run test:visual:report

# Approve changes after review
npm run test:visual:approve
```

### CI/CD Pipeline

```bash
# Never auto-update in CI!
npm run test:visual
```

## Snapshot Inventory

| Snapshot                               | Size  | Component                  |
| -------------------------------------- | ----- | -------------------------- |
| `sidebar-diagnosis.png`                | 77KB  | Full diagnosis sidebar     |
| `sidebar-diagnosis-search-focused.png` | 77KB  | Sidebar with active search |
| `sidebar-header.png`                   | 23KB  | Isolated sidebar header    |
| `output-area-empty.png`                | 4KB   | Empty output textarea      |
| `output-area-with-content.png`         | 15KB  | Output with sample note    |
| `output-panel-full.png`                | 6KB   | Output area with controls  |
| `input-panel-empty.png`                | 89KB  | Empty input panel          |
| `input-panel-placeholder.png`          | 67KB  | Input with placeholder     |
| `full-page-layout.png`                 | 345KB | Complete page layout       |

**Total**: 724KB (well under 5MB guideline)

## Stability Features

### Snapshots Exclude:

- ❌ Timestamps or dates
- ❌ Random IDs
- ❌ Dynamic search results
- ❌ User input (cleared in tests)
- ❌ Animations (disabled)

### Snapshots Include:

- ✅ Static layout and structure
- ✅ Color schemes and styling
- ✅ Typography and spacing
- ✅ Icon rendering
- ✅ Sample/placeholder text

## Thresholds

```typescript
maxDiffPixels: 100; // Up to 100 pixels can differ
threshold: 0.2; // 20% pixel difference allowed
animations: "disabled"; // No animation flicker
```

These settings provide a good balance between:

- Catching real regressions
- Avoiding flaky test failures

## File Locations

```
tests/
├── visual.spec.ts              # Visual test definitions
├── e2e.spec.ts                 # End-to-end tests
├── parser-pipeline.unit.spec.js # Unit tests
├── playwright.config.ts        # Test configuration
├── VISUAL_TESTING.md          # Visual testing guide
├── SNAPSHOT_DEMO.md           # Snapshot workflow demo
├── snapshots/                 # Baseline snapshots (committed)
│   └── visual.spec.ts/
│       └── *.png
├── test-results/              # Test artifacts (ignored)
└── playwright-report/         # HTML report (ignored)
```

## Best Practices Checklist

- [x] Unit tests verify parser logic
- [x] E2E tests verify user workflows
- [x] Visual tests catch UI regressions
- [x] Snapshots are small and stable
- [x] Approval workflow requires review
- [x] Documentation explains processes
- [x] CI enforces visual consistency
- [x] Git ignores test artifacts

## Troubleshooting

### Visual tests fail unexpectedly

1. Run `npm run test:visual:report` to see diffs
2. Check if changes are intentional
3. If unintentional, fix bug and re-run
4. If intentional, approve with `npm run test:visual:approve`

### Tests pass locally but fail in CI

- Browser version differences
- Font rendering differences
- Check Playwright browser cache

### Flaky visual tests

- Increase wait times before screenshots
- Disable more animations
- Clear more dynamic content

## Updating This Document

When adding new tests:

1. Update test counts in overview
2. Add new snapshots to inventory table
3. Update total snapshot size
4. Add new commands to quick reference
