# CI Pipeline Documentation

## Overview

Comprehensive CI pipeline that validates code quality, runs tests, and checks performance budgets on every push and pull request.

**Workflow**: `.github/workflows/ci.yml`

---

## Pipeline Stages

### 1. **Setup** 📥

```yaml
- Checkout code (actions/checkout@v4)
- Setup Node.js 22 with npm cache
- Install dependencies (npm ci)
```

**Duration**: ~30-60s (with cache)

**Caching**: npm dependencies cached by `setup-node` action

---

### 2. **Validation** ✅

```bash
npm run validate:features
```

**Purpose**: Ensure `config/features.json` is valid JSON

**Checks**:

- File exists
- Valid JSON syntax
- All values are boolean
- No unknown flags

**Fails if**: Invalid JSON, non-boolean values

**Output**:

```
✅ config/features.json is valid
   Flags defined: 2
   - sidebar_sanitize: ✅ enabled
   - meds_feature: ✅ enabled
```

---

### 3. **Linting** 🔍

```bash
npm run lint
```

**Purpose**: Enforce code style and catch potential bugs

**Tool**: ESLint with medical coding standards

**Checks**:

- Code style consistency
- Unused variables
- Potential bugs
- Best practice violations

**Fails if**: Any ESLint errors

**Fix locally**:

```bash
npm run lint:fix
```

---

### 4. **Type Checking** 🔎

```bash
npm run type-check
```

**Purpose**: Validate TypeScript types without emitting files

**Tool**: TypeScript compiler (tsc)

**Checks**:

- Type safety
- Interface compliance
- Missing type definitions

**Fails if**: Type errors found

**Fix locally**:

```bash
npm run type-check
# Review errors and fix type issues
```

---

### 5. **Unit Tests** 🧪

```bash
npm run test:unit      # Parser pipeline tests
npm run test:parser    # Smart parser tests
```

**Purpose**: Validate core parsing logic

**Test files**:

- `tests/parser-pipeline.unit.spec.js`
- `tests/parsing.smart.spec.js`

**Coverage**:

- normalize() function
- detectSections() function
- extractEntities() function
- Full pipeline integration
- Confidence scoring

**Fails if**: Any test fails

**Output**:

```
📊 Test Results: 29 passed, 0 failed
✅ All tests passed!
```

---

### 6. **E2E Tests** 🎭

```bash
npx playwright install chromium --with-deps
npm run test:e2e
```

**Purpose**: Test complete user workflows

**Tool**: Playwright (headless Chromium)

**Test file**: `tests/e2e.spec.ts`

**Coverage**:

- Page loads
- User interactions
- DOM manipulation
- Form submissions
- Navigation

**Artifacts on failure**:

- Playwright HTML report (7 day retention)
- Screenshots (7 day retention)
- Videos (7 day retention)

**Fails if**: Any E2E test fails

**Fix locally**:

```bash
npm run test:e2e
# Review test-results/ folder for screenshots/videos
```

---

### 7. **Performance** 📊

```bash
npm run size
```

**Purpose**: Enforce bundle size budgets

**Tool**: size-limit

**Checks**:

- Individual file sizes (Brotli compressed)
- Total bundle size
- Load time on slow 3G

**Budgets**: See `.size-limit.json`

**Fails if**: Any file exceeds budget

**Current status**:

```
Total Initial JS: 41.94 KB (limit: 200 KB) ✅ 79% under
```

---

## Fail Fast Strategy

**Configuration**:

```yaml
strategy:
  fail-fast: true
```

**Behavior**:

- Pipeline stops at first failure
- No wasted CI time on known-broken builds
- Clear error message from failing stage

**Benefits**:

- ⚡ Faster feedback (stops at first error)
- 💰 Lower CI costs (doesn't run remaining steps)
- 🎯 Clear failure point (single error to fix)

---

## Concurrency Control

**Configuration**:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Behavior**:

- Cancels previous runs when new commit pushed
- Saves CI resources
- Always tests latest commit

**Example**:

1. Push commit A → CI starts
2. Push commit B → CI for A cancelled, CI for B starts
3. Only latest commit tested

---

## Error Annotations

**On failure**, CI adds helpful annotations:

```
::error:: CI Pipeline failed. Check the logs above for details.
::notice:: Common fixes:
::notice:: - Lint errors: Run 'npm run lint:fix' locally
::notice:: - Type errors: Run 'npm run type-check' locally
::notice:: - Test failures: Run 'npm run test:unit' locally
::notice:: - E2E failures: Check test-results artifacts
::notice:: - Bundle size: Check .size-limit.json budgets
```

**Annotations appear**:

- GitHub Actions summary
- Pull request checks
- Commit status

---

## Job Summary

Generated on every run (success or failure):

```markdown
## CI Pipeline Results

| Stage         | Status  |
| ------------- | ------- |
| Install       | ✅ Pass |
| Feature Flags | ✅ Pass |
| Lint          | ✅ Pass |
| Type Check    | ✅ Pass |
| Unit Tests    | ✅ Pass |
| E2E Tests     | ✅ Pass |
| Bundle Size   | ✅ Pass |

**Commit:** `abc123...`
**Branch:** `main`
```

---

## Triggering the Pipeline

### Automatic Triggers

**On push to**:

- `main`
- `master`
- `develop`

**On pull request to**:

- `main`
- `master`
- `develop`

### Manual Trigger

1. Go to Actions tab on GitHub
2. Select "CI Pipeline"
3. Click "Run workflow"
4. Select branch
5. Click "Run workflow"

---

## Local Testing

Run complete pipeline locally before pushing:

```bash
# Full pipeline
npm run validate:features && \
npm run lint && \
npm run type-check && \
npm run test:unit && \
npm run test:parser && \
npm run test:e2e && \
npm run size

# Individual stages
npm run validate:features  # Feature flags
npm run lint               # Linting
npm run type-check         # Type checking
npm run test:unit          # Unit tests
npm run test:e2e           # E2E tests
npm run size               # Bundle size
```

---

## Debugging Failures

### Lint Failures

```bash
# See errors
npm run lint

# Auto-fix
npm run lint:fix

# Commit fixes
git add .
git commit -m "fix: lint errors"
```

### Type Check Failures

```bash
# See errors
npm run type-check

# Fix manually (no auto-fix for types)
# Edit files to fix type issues

# Re-check
npm run type-check
```

### Unit Test Failures

```bash
# Run tests locally
npm run test:unit

# Check specific test
node tests/parser-pipeline.unit.spec.js

# Fix failing tests
# Edit test files or source code

# Re-run
npm run test:unit
```

### E2E Test Failures

```bash
# Run E2E locally (headed mode for debugging)
npx playwright test --headed

# Run specific test
npx playwright test tests/e2e.spec.ts --headed

# Debug mode (step through)
npx playwright test --debug

# Check artifacts
ls test-results/  # Screenshots/videos
```

### Bundle Size Failures

```bash
# Check current sizes
npm run size

# See why a file is large
npm run size:why

# Fix: reduce dependencies, code split, lazy load
# Update budgets in .size-limit.json if necessary

# Re-check
npm run size
```

---

## Performance

### Typical Durations

| Stage       | Duration    | Cached      |
| ----------- | ----------- | ----------- |
| Setup       | 30s         | 15s         |
| Validation  | 2s          | 2s          |
| Lint        | 5s          | 5s          |
| Type Check  | 10s         | 10s         |
| Unit Tests  | 3s          | 3s          |
| E2E Setup   | 45s         | 20s         |
| E2E Tests   | 30s         | 30s         |
| Bundle Size | 5s          | 5s          |
| **Total**   | **~2.5min** | **~1.5min** |

### Optimization

**Caching**:

- ✅ npm dependencies cached
- ✅ Playwright browsers cached
- ✅ Node.js binaries cached

**Fail-fast**:

- ✅ Stops at first error
- ✅ Saves ~1-2 minutes on failures

**Concurrency**:

- ✅ Cancels old runs
- ✅ Tests only latest commit

---

## Best Practices

### Before Pushing

```bash
# Always run locally first
npm run lint
npm run type-check
npm run test:unit

# Optional: run E2E (slower)
npm run test:e2e

# Optional: check bundle size
npm run size
```

### Branch Strategy

- ✅ Create feature branches
- ✅ Push to feature branch (CI runs)
- ✅ Fix any CI errors
- ✅ Create PR to main (CI runs again)
- ✅ Merge only if CI passes

### Fixing CI Failures

1. **Read error message** - CI provides clear errors
2. **Check annotations** - Look at GitHub annotations
3. **Test locally** - Run failing command locally
4. **Fix issue** - Edit code to fix
5. **Verify locally** - Run command again
6. **Push fix** - Commit and push
7. **Verify CI** - Check CI passes

---

## Maintenance

### Adding New Tests

1. Create test file in `tests/`
2. Add npm script to `package.json`
3. Add stage to `.github/workflows/ci.yml`
4. Test locally
5. Push and verify CI

### Updating Dependencies

```bash
# Update dependencies
npm update

# Run full CI locally
npm run lint && npm run type-check && npm run test:unit

# If passes, push
git add package.json package-lock.json
git commit -m "chore: update dependencies"
git push
```

### Modifying Pipeline

1. Edit `.github/workflows/ci.yml`
2. Test workflow syntax: https://rhysd.github.io/actionlint/
3. Push to feature branch
4. Verify workflow runs correctly
5. Merge to main

---

## Troubleshooting

### CI passes locally but fails on GitHub

**Cause**: Environment differences

**Solutions**:

- Check Node.js version matches (22)
- Verify npm ci vs npm install
- Check for platform-specific code
- Review environment variables

### CI is slow

**Cause**: Cold cache or heavy tests

**Solutions**:

- Check cache is enabled (it is)
- Review E2E test suite (reduce if too many)
- Consider parallelizing tests
- Use `fail-fast: true` (already enabled)

### Flaky E2E tests

**Cause**: Timing issues, race conditions

**Solutions**:

- Add explicit waits in tests
- Use `waitForSelector` instead of `sleep`
- Increase timeout for slow operations
- Check for async/await issues

---

## Related Files

- `.github/workflows/ci.yml` - CI pipeline definition
- `.github/workflows/validate-config.yml` - Feature flag validation
- `.github/workflows/size-limit.yml` - Size budget enforcement
- `package.json` - npm scripts
- `.size-limit.json` - Bundle size budgets
- `tests/` - Test files
- `.eslintrc.json` - ESLint configuration
- `tsconfig.json` - TypeScript configuration

---

## Quick Reference

| Command                     | Purpose                    |
| --------------------------- | -------------------------- |
| `npm run validate:features` | Validate feature flags     |
| `npm run lint`              | Run ESLint                 |
| `npm run lint:fix`          | Auto-fix lint errors       |
| `npm run type-check`        | Check TypeScript types     |
| `npm run test:unit`         | Run unit tests             |
| `npm run test:parser`       | Run parser tests           |
| `npm run test:e2e`          | Run E2E tests              |
| `npm run size`              | Check bundle sizes         |
| `npm run size:why`          | Analyze bundle composition |
