# Performance Test Suite

## Overview

Automated Playwright tests to verify the parser performs without UI freezes or jank.

---

## Test File

**[tests/perf-no-freeze.spec.ts](perf-no-freeze.spec.ts)**

---

## What It Tests

### 1. **No Duplicate Identifier Errors**
- Verifies no console errors: `Identifier 'X' has already been declared`
- Confirms zero duplicate `<script src="noteParser_full_async.js">` tags
- **Pass Criteria:** 0 duplicate scripts, 0 identifier errors

### 2. **No Invalid SVG viewBox Attributes**
- Scans all SVG elements for `%` in viewBox attribute
- **Pass Criteria:** 0 SVGs with percentage values

### 3. **No Frames Exceed 200ms**
- Monitors frame duration via PerformanceObserver and RAF
- Records all frames >200ms during parse operation
- **Pass Criteria:** Max frame duration <200ms

### 4. **Console Timing Markers Present**
- Verifies 7+ `⏱️ Parse:` timing markers in console
- Confirms: Preprocess, SplitIntoSections, ParseHPI, ParseAssessment, ParsePlan, Normalize, Total
- **Pass Criteria:** ≥7 timing markers, including "Total"

### 5. **Parse Completes in <500ms**
- Measures wall-clock time from Parse button click to output
- **Pass Criteria:** <500ms for typical note (~1500 chars)

### 6. **JankMonitor Reports Zero Long Tasks**
- Starts JankMonitor before parse
- Stops after parse and checks stats
- **Pass Criteria:** `longTaskCount: 0`, `maxJankDuration <200ms`

---

## Running the Tests

### Prerequisites

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers (if not already installed):**
   ```bash
   npx playwright install
   ```

### Run Performance Tests

```bash
# Run all performance tests
npm run check:perf

# Or directly with Playwright
npm run test:e2e:perf

# Run with UI mode (interactive)
npx playwright test tests/perf-no-freeze.spec.ts --ui

# Run specific test
npx playwright test tests/perf-no-freeze.spec.ts --grep "should parse note without exceeding"

# Run with headed browser (see what's happening)
npx playwright test tests/perf-no-freeze.spec.ts --headed

# Generate HTML report
npx playwright test tests/perf-no-freeze.spec.ts --reporter=html
npx playwright show-report
```

---

## Test Configuration

From [playwright.config.ts](playwright.config.ts):

```typescript
{
  timeout: 15_000,        // 15s per test
  webServer: {
    command: "npx http-server .. -p 8080",
    url: "http://127.0.0.1:8080",
    reuseExistingServer: true
  },
  use: {
    baseURL: "http://127.0.0.1:8080",
    actionTimeout: 10000,
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  }
}
```

---

## Sample Output

### ✅ Passing Test

```
Running 6 tests using 1 worker

  ✓ should load page without duplicate identifier errors (1.2s)
  ✓ should have no SVGs with percentage in viewBox (0.8s)
  ✓ should parse note without exceeding 200ms frame duration (2.1s)
    ✅ No frames exceeded 200ms
  ✓ should show parse timing markers in console (1.9s)
    Found 7 timing markers:
      ⏱️ Parse: Preprocess: 3.45ms
      ⏱️ Parse: SplitIntoSections: 12.67ms
      ⏱️ Parse: ParseHPI: 18.92ms
      ⏱️ Parse: ParseAssessment: 24.33ms
      ⏱️ Parse: ParsePlan: 6.78ms
      ⏱️ Parse: Normalize: 5.12ms
      ⏱️ Parse: Total: 71.27ms
  ✓ should complete parse in under 500ms for typical note (0.9s)
    Parse completed in 127ms
  ✓ should have JankMonitor report zero long tasks (1.8s)
    JankMonitor stats: { longTaskCount: 0, maxJankDuration: 0, threshold: 50 }

  6 passed (9.5s)
```

### ❌ Failing Test (Example)

```
  ✗ should parse note without exceeding 200ms frame duration (2.3s)

    ⚠️  Found 2 long frame(s)
       Longest frame: 287.45ms
       - RAF frame: 287.45ms (frame)
       - ParseAssessment: 215.67ms (measure)

    Error: expect(received).toBeLessThan(expected)

    Expected: < 200
    Received: 287.45

      at tests/perf-no-freeze.spec.ts:152:24
```

---

## Debugging Failed Tests

### 1. **Check Screenshots**
Failed tests automatically capture screenshots:
```bash
ls test-results/
```

### 2. **Watch Video**
Failed tests record video:
```bash
ls test-results/*/video.webm
```

### 3. **Run with Console Logging**
```bash
DEBUG=pw:api npx playwright test tests/perf-no-freeze.spec.ts
```

### 4. **Run in Headed Mode**
```bash
npx playwright test tests/perf-no-freeze.spec.ts --headed --project=chromium
```

### 5. **Interactive UI Mode**
```bash
npx playwright test tests/perf-no-freeze.spec.ts --ui
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Performance Tests

on: [push, pull_request]

jobs:
  perf-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright Browsers
        run: npx playwright install --with-deps chromium

      - name: Run performance tests
        run: npm run check:perf

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Acceptance Criteria

All tests must pass for code to be merged:

| Test | Criteria | Status |
|------|----------|--------|
| No duplicate identifiers | 0 console errors | ✅ |
| No bad viewBoxes | 0 SVGs with `%` | ✅ |
| No long frames | Max <200ms | ✅ |
| Timing markers | ≥7 markers | ✅ |
| Parse speed | <500ms | ✅ |
| JankMonitor | 0 long tasks | ✅ |

---

## Troubleshooting

### Test hangs or times out

**Issue:** Test waits indefinitely for parse to complete

**Solution:**
1. Check if Parse button selector is correct
2. Verify output element selector
3. Increase timeout in test (currently 10s)
4. Check console for JavaScript errors

### PerformanceObserver not available

**Issue:** `PerformanceObserver` warnings in console

**Solution:**
- Normal for some browsers
- Fallback RAF monitoring will still work
- Test will pass as long as frames are <200ms

### False positive long frames

**Issue:** Random long frames >200ms

**Solution:**
1. Run test multiple times to confirm
2. Check if other processes are consuming CPU
3. Consider increasing threshold for CI environments
4. Use `--repeat-each=3` to run tests multiple times

```bash
npx playwright test tests/perf-no-freeze.spec.ts --repeat-each=3
```

---

## Related Files

- [index.html](../index.html) - Main application page
- [noteParser_full_async.js](../src/parsers/noteParser_full_async.js) - Async parser with yield points
- [scheduler.js](../src/utils/scheduler.js) - Scheduler utilities
- [jankMonitor.js](../src/utils/jankMonitor.js) - Runtime jank monitoring
- [playwright.config.ts](playwright.config.ts) - Playwright configuration

---

## Maintenance

### Updating Thresholds

If legitimate performance changes require threshold adjustments:

```typescript
// In perf-no-freeze.spec.ts
const MAX_FRAME_DURATION = 200; // Increase if needed

// In test
expect(duration).toBeLessThan(500); // Adjust parse time limit
```

### Adding New Tests

Follow this pattern:

```typescript
test('should [behavior]', async ({ page }) => {
  // Setup
  await page.goto('http://localhost:8080/index.html');

  // Action
  await page.evaluate(() => {
    // Perform action
  });

  // Assert
  expect(result).toBe(expected);
});
```

---

## Performance Regression Detection

Run before/after comparisons:

```bash
# Baseline (main branch)
git checkout main
npm run check:perf > baseline.txt

# New code
git checkout feature-branch
npm run check:perf > feature.txt

# Compare
diff baseline.txt feature.txt
```

Look for:
- Increased parse times
- New long frames
- Missing timing markers
- Higher JankMonitor counts

---

## Support

If tests fail unexpectedly:
1. Check recent code changes to parser
2. Verify all yield points are present
3. Confirm scheduler is loaded correctly
4. Test manually in browser DevTools
5. Review console for new errors

For issues, create a GitHub issue with:
- Test output
- Screenshots/video
- Browser version
- OS and environment details
