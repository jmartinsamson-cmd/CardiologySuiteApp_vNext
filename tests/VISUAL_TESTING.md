# Visual Regression Testing

This project uses Playwright's visual regression testing to catch unintended UI changes.

## Overview

Visual tests capture screenshots of critical UI components (sidebar, note output area) and compare them against baseline snapshots. If pixels differ beyond configured thresholds, tests fail and show visual diffs.

## Running Visual Tests

### Check for visual regressions

```bash
npm run test:visual
```

This compares current UI against baseline snapshots. If tests pass, no visual changes detected.

### View test report with visual diffs

```bash
npm run test:visual:report
```

Opens interactive HTML report showing side-by-side comparisons of failed snapshots.

### Update snapshots (with approval workflow)

```bash
npm run test:visual:approve
```

**Recommended workflow:**

1. Runs visual tests to detect changes
2. Shows list of changed snapshots
3. Opens visual report for review
4. Prompts for approval before updating
5. Only updates if you explicitly confirm

### Update snapshots (direct, no approval)

```bash
npm run test:visual:update
```

⚠️ **Use with caution!** Directly updates all snapshots without review.

## What Gets Tested

### Sidebar Components

- **Diagnosis sidebar** (`sidebar-diagnosis.png`)
  - Full sidebar layout
  - Header with icon
  - Search input
  - Diagnosis list container

- **Sidebar header** (`sidebar-header.png`)
  - Isolated header component
  - Icon and title

- **Search focused state** (`sidebar-diagnosis-search-focused.png`)
  - Sidebar with active search input

### Note Output Area

- **Empty state** (`output-area-empty.png`)
  - Output textarea before any content

- **With content** (`output-area-with-content.png`)
  - Sample formatted clinical note
  - Tests textarea rendering with text

- **Full panel** (`output-panel-full.png`)
  - Output area with surrounding controls
  - Copy/clear buttons if present

### Input Panel

- **Empty input** (`input-panel-empty.png`)
  - Clinical note input textarea

- **Placeholder visible** (`input-panel-placeholder.png`)
  - Shows placeholder text styling

### Button Groups

- **Parse and Clear buttons** (`buttons-parse-clear.png`)
  - Button styling and layout

### Full Page

- **Complete layout** (`full-page-layout.png`)
  - Entire page including sidebar and main content
  - Useful for catching layout shifts

## Snapshot Stability

To ensure stable snapshots:

✅ **DO:**

- Disable animations in tests
- Remove dynamic timestamps
- Clear user input fields
- Use consistent sample data
- Hide elements with random IDs

❌ **DON'T:**

- Include real-time clocks
- Use random test data
- Rely on network-fetched content
- Leave form inputs in random states

## When Snapshots Change

Visual tests fail when:

1. **Intentional UI changes** - You modified styles/layout (✓ expected)
2. **Unintended regressions** - Bug introduced visual changes (✗ fix before updating)
3. **Browser updates** - Font rendering differences (review carefully)
4. **Flaky tests** - Timing issues, animations (fix test, don't update)

## Reviewing Changes

### 1. Run tests to detect failures

```bash
npm run test:visual
```

### 2. Open visual report

```bash
npm run test:visual:report
```

### 3. Review each diff carefully

- **Expected** ✓ slider
  - Shows old vs new side-by-side
  - Highlights pixel differences
- **Actual** tab shows current rendering
- **Diff** tab highlights exact changes

### 4. Approve changes

If changes are intentional:

```bash
npm run test:visual:approve
```

Follow prompts to review and approve.

### 5. Commit updated snapshots

```bash
git add tests/snapshots/
git commit -m "Update visual snapshots: [reason for change]"
```

**Commit message should explain WHY snapshots changed:**

- ✅ "Update snapshots: Changed sidebar header color to match brand"
- ✅ "Update snapshots: Increased note output font size per UX review"
- ❌ "Update snapshots" (not descriptive)

## Configuration

See `tests/playwright.config.ts`:

```typescript
expect: {
  toHaveScreenshot: {
    animations: 'disabled',      // No animation flickering
    maxDiffPixels: 100,          // Allow up to 100 different pixels
    threshold: 0.2               // 20% pixel difference threshold
  }
}
```

### Threshold Tuning

- **Too strict** (< 0.1) = Flaky tests, fails on minor rendering differences
- **Too loose** (> 0.5) = Misses real regressions
- **Current** (0.2) = Balanced for most UI components

Per-test overrides available:

```typescript
await expect(element).toHaveScreenshot("name.png", {
  maxDiffPixels: 50, // Stricter for this specific test
  threshold: 0.1,
});
```

## CI/CD Integration

### In CI pipelines:

1. Run `npm run test:visual` (without update flag)
2. If tests fail, pipeline fails
3. Developers must review and approve changes locally
4. Commit updated snapshots with PR

### Never auto-update snapshots in CI!

```yaml
# ✅ Good
- run: npm run test:visual

# ❌ Bad - hides regressions!
- run: npm run test:visual:update
```

## Troubleshooting

### Flaky tests (sometimes pass, sometimes fail)

- Increase `waitForTimeout` before screenshot
- Add `await page.waitForLoadState('networkidle')`
- Disable specific animations in beforeEach

### Different on Windows vs Mac/Linux

- Font rendering differs across OS
- Consider OS-specific baseline snapshots
- Or increase threshold tolerance

### Tests pass locally but fail in CI

- Different browser versions
- Different screen resolutions
- Check Playwright browser cache

### Snapshot file sizes too large

- Use element snapshots instead of fullPage
- Crop to specific components
- Compress with lossy formats if acceptable

## Files and Directories

```
tests/
├── visual.spec.ts              # Visual test definitions
├── playwright.config.ts        # Playwright configuration
├── snapshots/                  # Baseline snapshots (committed)
│   └── visual.spec.ts/
│       ├── sidebar-diagnosis.png
│       ├── output-area-empty.png
│       └── ...
├── test-results/              # Test artifacts (not committed)
│   ├── *-actual.png           # Failed test screenshots
│   ├── *-diff.png             # Highlighted differences
│   └── *-expected.png         # Baseline for failed test
└── playwright-report/         # HTML report (not committed)
```

## Best Practices

1. **Run visual tests before committing UI changes**

   ```bash
   npm run test:visual
   ```

2. **Review diffs carefully - never blindly approve**

   ```bash
   npm run test:visual:report  # Review first!
   npm run test:visual:approve # Then approve
   ```

3. **Keep snapshots in version control**
   - Commit baseline snapshots: `tests/snapshots/**/*.png`
   - Ignore test artifacts: `test-results/`, `playwright-report/`

4. **Update snapshots with descriptive commits**

   ```bash
   git commit -m "Update snapshots: Redesigned sidebar header icon"
   ```

5. **Don't update snapshots to "fix" failing tests**
   - If test fails unexpectedly, investigate root cause
   - Updating snapshots hides the regression!

6. **Use CI to enforce visual consistency**
   - Block PRs with failing visual tests
   - Require explicit snapshot updates in PR

7. **Periodically review snapshot sizes**
   ```bash
   du -sh tests/snapshots/
   ```

   - Keep under 5MB total if possible
   - Large snapshots slow down git operations

## Examples

### Adding a new visual test

```typescript
test("My new component visual", async ({ page }) => {
  await page.goto("/index.html");
  await page.waitForLoadState("networkidle");

  // Remove dynamic content
  await page.evaluate(() => {
    const timestamp = document.querySelector(".timestamp");
    if (timestamp) timestamp.remove();
  });

  // Take snapshot
  const myComponent = page.locator("#my-component");
  await expect(myComponent).toHaveScreenshot("my-component.png", {
    maxDiffPixels: 100,
    threshold: 0.2,
  });
});
```

### Generating baseline for new test

```bash
npm run test:visual:update
```

### Verifying no regressions

```bash
npm run test:visual
```

Should see:

```
✓ 11 passed (25s)
```

## Getting Help

- **Playwright Visual Docs**: https://playwright.dev/docs/test-snapshots
- **Project Issues**: Check existing visual test issues in repo
- **Debug Mode**: `DEBUG=pw:api npm run test:visual`
