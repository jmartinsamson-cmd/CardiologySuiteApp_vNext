# CSS Lockdown Documentation

## 🔒 CSS Protection System

Your CSS file has been **locked down** with a comprehensive protection system to prevent unauthorized changes and maintain code quality.

### Protection Components

#### 1. **Integrity Hash Baseline**

- **File**: `styles/css-integrity.json`
- **Purpose**: SHA256 hash of your clean, linted CSS
- **Function**: Detects any changes to the CSS file

#### 2. **Locked Stylelint Config**

- **File**: `styles/.stylelintrc.lock`
- **Purpose**: Enforced linting rules that must pass
- **Rules**: No duplicates, proper specificity, modern syntax only

#### 3. **Protection Scripts**

- **css-protection-check.ps1**: Quick validation against locked standards
- **css-integrity-check.ps1**: Full integrity and change detection
- **generate-css-hash.ps1**: Creates new baseline when authorized

### Usage Commands

```bash
# Quick CSS validation check
npm run css:protect

# Full integrity check (detects any changes)
npm run css:check

# Generate new baseline (after authorized changes)
npm run css:baseline
```

### Protection Workflow

#### ✅ **Before Making CSS Changes:**

```bash
npm run css:check
```

#### ✅ **After Making CSS Changes:**

```bash
npm run css:protect
# If passes, update baseline:
npm run css:baseline
```

#### ❌ **If Changes Violate Standards:**

- Script will **FAIL** with specific error details
- Must fix linting errors before proceeding
- Use `--Force` flag only in emergencies (not recommended)

### Security Features

1. **Hash Verification**: Detects any unauthorized modifications
2. **Lint Enforcement**: Ensures all changes meet coding standards
3. **Automated Checks**: Can be integrated into CI/CD pipelines
4. **Baseline Management**: Controlled updates to approved changes

### Current Status

- ✅ CSS File: **LOCKED & CLEAN**
- ✅ Baseline Hash: `FFC415F5C424FF7F6D16727C42891C45552A24EACEB89E75AE064C66206041DE`
- ✅ Lint Status: **0 problems found**
- ✅ Protection: **ACTIVE**

### Emergency Override

```bash
# Only use in emergencies - bypasses all checks
pwsh scripts/css-integrity-check.ps1 -Force
```

**⚠️ Warning**: Using `-Force` flag bypasses all protection and is strongly discouraged!
