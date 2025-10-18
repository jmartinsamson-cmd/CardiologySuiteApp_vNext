# Visual Snapshot Testing Demo

## Testing the Snapshot Workflow

To verify the visual testing system works correctly, here's how to simulate a UI change and test the diff detection:

### 1. Baseline State (All Tests Pass)

```bash
npm run test:visual
```

Expected output:

```
✓ 10 passed (21.4s)
```

### 2. Simulate UI Change

Make a small CSS change to trigger a visual difference:

**Example: Change sidebar header color**

Edit the CSS (e.g., in your theme or inline styles):

```css
/* Before */
.dx-rail-header {
  background: #2c3e50;
}

/* After - intentional change */
.dx-rail-header {
  background: #3498db;
}
```

### 3. Run Tests Again (Should Fail)

```bash
npm run test:visual
```

Expected output:

```
✗ Diagnosis sidebar visual snapshot
✗ Sidebar header structure
✗ Full page layout with sidebar and main content

3 failed, 7 passed
```

### 4. Review Visual Diffs

```bash
npm run test:visual:report
```

This opens an interactive HTML report showing:

- **Expected** (baseline) vs **Actual** (current)
- **Diff** highlighting changed pixels
- Slider to compare side-by-side

### 5. Approve Changes (Interactive)

```bash
npm run test:visual:approve
```

The script will:

1. Run tests to detect failures
2. List all changed snapshots
3. Ask: "Would you like to open the visual report? (y/n)"
4. Ask: "Do you want to UPDATE all snapshots? (yes/no)"
5. Only update if you type "yes" (full word required)

Output example:

```
🔍 Running visual regression tests...

⚠️  Visual test failures detected!

📊 Visual differences detected in the following snapshots:

  1. test-results/visual-...-sidebar-diagnosis-actual.png
  2. test-results/visual-...-sidebar-header-actual.png
  3. test-results/visual-...-full-page-layout-actual.png

📸 Snapshot changes summary:
  - 3 snapshot(s) have visual differences
  - Diff images saved in: test-results/

❓ Would you like to open the visual report now? (y/n): y

🌐 Opening visual test report...

⚠️  IMPORTANT: Review all visual changes carefully before updating!

Changes could indicate:
  ✓ Intentional UI improvements
  ✗ Unintended regressions
  ✗ Browser/OS rendering differences
  ✗ Timing or animation issues

❓ Do you want to UPDATE all snapshots? (yes/no): yes

🔄 Updating snapshots...

✅ Snapshots updated successfully!

📝 Next steps:
  1. Review the updated snapshots in tests/snapshots/
  2. Commit the changes: git add tests/snapshots/
  3. Include in your commit message why snapshots changed
```

### 6. Verify Tests Pass Again

```bash
npm run test:visual
```

Should now show:

```
✓ 10 passed (21.4s)
```

### 7. Commit Changes

```bash
git add tests/snapshots/visual.spec.ts/
git commit -m "Update snapshots: Changed sidebar header background color

- Changed .dx-rail-header background from #2c3e50 to #3498db
- Updated 3 snapshots: sidebar-diagnosis, sidebar-header, full-page-layout
- Part of visual redesign initiative"
```

## Output Files

When tests fail, Playwright creates:

```
test-results/
└── visual-Diagnosis-sidebar-visual-snapshot/
    ├── sidebar-diagnosis-actual.png       # Current rendering
    ├── sidebar-diagnosis-expected.png     # Baseline
    └── sidebar-diagnosis-diff.png         # Highlighted differences
```

The **diff.png** shows:

- **Red pixels** = Changed from baseline
- **Gray pixels** = Unchanged
- Useful for spotting exactly what changed

## Example Diff Output

When a snapshot test fails, the console shows:

```
1) tests\visual.spec.ts:50:3 › Diagnosis sidebar visual snapshot

  Error: Screenshot comparison failed:

  2547 pixels (ratio 0.12) are different

  Call log:
    - Expect "toHaveScreenshot" with timeout 5000ms
    - waiting for screenshots to match
      baseline: tests/snapshots/.../sidebar-diagnosis.png
      actual:   test-results/.../sidebar-diagnosis-actual.png
      diff:     test-results/.../sidebar-diagnosis-diff.png
```

This tells you:

- **2547 pixels changed** (12% of total)
- Threshold is 20%, so this fails (if configured)
- Paths to actual, baseline, and diff images

## Safety Features

### 1. Explicit Approval Required

The `test:visual:approve` script requires typing "yes" (full word), not just "y". This prevents accidental updates.

### 2. Visual Report Before Approval

The script offers to open the HTML report first, so you can review all changes visually before deciding to update.

### 3. Summary of Changes

Before asking for approval, the script lists:

- Number of failed snapshots
- Paths to diff images
- Reminder to review carefully

### 4. No Auto-Update in CI

The CI pipeline runs `test:visual` (comparison only), never `test:visual:update`. This ensures humans review all visual changes.

## Common Scenarios

### Scenario 1: Intentional UI Redesign

1. Make CSS/HTML changes
2. Run `npm run test:visual` (fails as expected)
3. Run `npm run test:visual:approve`
4. Review diffs carefully
5. Approve updates
6. Commit with descriptive message

### Scenario 2: Unintended Regression

1. Code change breaks layout
2. Run `npm run test:visual` (fails)
3. Run `npm run test:visual:report`
4. See unexpected changes
5. **DO NOT APPROVE** - fix the bug instead
6. Run tests again until they pass

### Scenario 3: Browser Update

1. Browser update changes font rendering
2. Tests fail across all snapshots
3. Review diffs - see minor pixel differences
4. Verify no actual UI bugs
5. Approve updates if changes are acceptable
6. Commit with note about browser version

### Scenario 4: Flaky Test

1. Test fails randomly (timing issue)
2. Run multiple times - sometimes passes, sometimes fails
3. **DO NOT UPDATE SNAPSHOTS**
4. Fix the test (add waits, disable animations)
5. Run until consistently passes

## Tips

### Minimize Snapshot Churn

- Keep snapshots focused (component-level, not full-page)
- Hide dynamic content (timestamps, random IDs)
- Use stable test data

### Review Systematically

- Check each diff individually
- Compare against your actual code changes
- Verify changes are only in areas you modified

### Commit Hygiene

- Separate snapshot updates from code changes
- Use descriptive commit messages
- Link to related issues/PRs

## Rollback

If you accidentally updated snapshots:

```bash
# Restore previous snapshots
git checkout HEAD -- tests/snapshots/

# Re-run tests
npm run test:visual
```

Or if already committed:

```bash
# Revert the snapshot commit
git revert <commit-hash>
```
