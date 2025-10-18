# Feature Flags System

## Overview

Feature flags allow runtime control of feature availability without code deployment. Flags are stored in `config/features.json` and loaded at application startup.

---

## Configuration File

**Location**: `config/features.json`

**Format**:

```json
{
  "sidebar_sanitize": true,
  "meds_feature": true
}
```

**Rules**:

- Must be valid JSON (no trailing commas, no comments)
- All values must be boolean (`true` or `false`)
- File validated in CI pipeline

---

## Available Feature Flags

### 1. `meds_feature`

**Default**: `true`

**Controls**: Medications page visibility in navigation

**Implementation**:

- File: `src/core/app.js`
- Function: `loadFeatureFlags()`
- Element: `#meds-nav-tab`

**Behavior**:

- `true`: Medications tab visible in header navigation
- `false`: Tab hidden (display: none)

**Code**:

```javascript
if (features.meds_feature === true) {
  const medsNavTab = document.getElementById("meds-nav-tab");
  if (medsNavTab) {
    medsNavTab.style.display = "";
  }
}
```

### 2. `sidebar_sanitize`

**Default**: `true`

**Controls**: Diagnosis sidebar sanitization

**Implementation**:

- File: `src/utils/diagnosisSanitizer.js`
- Function: `getConfig()`
- Applied to: Left sidebar diagnosis list

**Behavior**:

- `true`: Filters non-medical terms from diagnosis list (removes test data, placeholders)
- `false`: Shows raw unfiltered diagnosis list

**Code**:

```javascript
return {
  whitelist: WL,
  blacklist: BL,
  enabled: FEATURES.sidebar_sanitize === true,
};
```

---

## How to Change Flags

### Method 1: Direct File Edit (Local/Server)

```bash
# Edit file directly
nano config/features.json

# Change values
{
  "sidebar_sanitize": false,  # Disable sanitization
  "meds_feature": true        # Keep meds page
}

# Save and exit
# Reload browser - changes take effect immediately
```

### Method 2: Via Git (Recommended for Production)

```bash
# Make changes
git checkout main
nano config/features.json

# Commit
git add config/features.json
git commit -m "feat: disable sidebar_sanitize for testing"

# Deploy
git push origin main

# Changes live after server pulls latest code
```

### Method 3: Hot Patch (Emergency)

```bash
# SSH to production server
ssh user@production-server

# Edit file in place
cd /path/to/app
nano config/features.json

# Save - takes effect on next page load
# No restart required
```

---

## Rollback Procedure

### Quick Rollback (Revert Commit)

```bash
# Find the commit that changed the flag
git log --oneline config/features.json

# Revert it
git revert <commit-hash>
git push origin main

# Changes revert on next deployment
```

### Emergency Rollback (Manual)

```bash
# SSH to server
ssh user@production-server

# Restore previous values
cd /path/to/app
nano config/features.json

# Change back to previous state
{
  "sidebar_sanitize": true,
  "meds_feature": true
}

# Save - instant rollback
```

---

## CI Validation

**Workflow**: `.github/workflows/validate-config.yml`

**Runs on**:

- Push to `main`/`master` (when config/features.json changes)
- Pull requests (when config/features.json changes)

**Validation script**: `scripts/validate-features.js`

**Checks**:

1. ✅ File exists
2. ✅ Valid JSON syntax
3. ✅ JSON is object (not array/primitive)
4. ✅ All values are boolean
5. ⚠️ Warns on unknown flags

**Manual validation**:

```bash
npm run validate:features
```

**Example output**:

```
🔍 Validating config/features.json...
✅ config/features.json is valid
   Flags defined: 2
   - sidebar_sanitize: ✅ enabled
   - meds_feature: ✅ enabled
```

---

## Testing Flags Locally

### Test with flag disabled

```bash
# Backup current config
cp config/features.json config/features.json.backup

# Disable a flag
echo '{"sidebar_sanitize": false, "meds_feature": true}' > config/features.json

# Test in browser
# Reload page to see changes

# Restore backup
mv config/features.json.backup config/features.json
```

### Test all combinations

```bash
# All enabled (default)
{"sidebar_sanitize": true, "meds_feature": true}

# Only sanitization
{"sidebar_sanitize": true, "meds_feature": false}

# Only meds page
{"sidebar_sanitize": false, "meds_feature": true}

# All disabled
{"sidebar_sanitize": false, "meds_feature": false}
```

---

## Adding New Feature Flags

### 1. Add to config/features.json

```json
{
  "sidebar_sanitize": true,
  "meds_feature": true,
  "new_feature": false
}
```

### 2. Update validation script

Edit `scripts/validate-features.js`:

```javascript
const knownFlags = [
  "sidebar_sanitize",
  "meds_feature",
  "new_feature", // Add here
];
```

### 3. Implement flag check in code

```javascript
// Load config
fetch("./config/features.json")
  .then((r) => r.json())
  .then((features) => {
    if (features.new_feature === true) {
      // Enable feature
    }
  });
```

### 4. Document in this file

Add section describing:

- Default value
- What it controls
- Implementation location
- Behavior when enabled/disabled

---

## Best Practices

### ✅ DO

- Always use boolean values (`true`/`false`)
- Validate JSON before committing
- Test both enabled and disabled states
- Document flag purpose and behavior
- Use descriptive flag names
- Default to safe/conservative value

### ❌ DON'T

- Use strings like `"true"` or `"false"` (must be boolean)
- Add trailing commas (invalid JSON)
- Add comments in JSON (not allowed)
- Change multiple flags at once (test incrementally)
- Commit without running `npm run validate:features`

---

## Troubleshooting

### Issue: Changes not taking effect

**Solution**: Hard refresh browser

```
Windows: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

### Issue: CI failing with JSON error

**Solution**: Validate locally first

```bash
npm run validate:features
# Fix any errors shown
git add config/features.json
git commit --amend
```

### Issue: Feature still showing after disabling flag

**Solution**: Check browser cache

```javascript
// In browser console
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### Issue: Don't know current flag state

**Solution**: Check in browser console

```javascript
// View loaded feature flags
fetch("./config/features.json")
  .then((r) => r.json())
  .then(console.log);
```

---

## Production Checklist

Before changing flags in production:

- [ ] Test flag change locally
- [ ] Validate JSON syntax: `npm run validate:features`
- [ ] Document reason for change
- [ ] Have rollback plan ready
- [ ] Monitor after deployment
- [ ] Update team on change

---

## Architecture Benefits

**Why feature flags?**

1. ✅ **Zero downtime rollouts**: Enable features without deploying code
2. ✅ **Instant rollback**: Disable problematic features in seconds
3. ✅ **A/B testing**: Test features with subset of users
4. ✅ **Gradual rollout**: Enable features incrementally
5. ✅ **Safe deployment**: Decouple code deployment from feature activation
6. ✅ **Quick fixes**: Disable broken features while fixing code

**Performance impact**: Negligible

- Single JSON fetch at app load
- Cached for session
- No runtime overhead
