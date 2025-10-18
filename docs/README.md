# Cardiology Suite v3.0

## Advanced Clinical Decision Support & Documentation Tools

## 📋 Project Status (October 2025)

- ✅ **ESLint Compliance**: 0 errors, 0 warnings (100% clean codebase)
- ✅ **CI Pipeline**: Passing all linting checks
- ✅ **AI Enhancements v2.0**: Enhanced parsing accuracy (+17%), clinical safety checks, evidence-based recommendations
- 🔄 **Active Development**: Ready for feature enhancements
- 📚 **AI Agent Context**: See [AI_PROJECT_CONTEXT.md](./AI_PROJECT_CONTEXT.md) for complete development history
- 🤖 **AI Intelligence**: See [AI_ENHANCEMENTS.md](./AI_ENHANCEMENTS.md) for backend improvements

## 🚀 **Quick Start**

### **Live Application Routes:**

- **`#/notes`** - Enhanced clinical note parsing with AI-powered template generation
- **`#/trees/acs`** - Complete ACS decision tree with guided pathways
- **`#/home`** - Dashboard with quick access to all clinical tools
- **`#/afib`** - Advanced atrial fibrillation management protocols
- **`#/dashboard`** - Clinical metrics and workflow overview
- **`#/search`** - Global search across clinical features and guidelines

## 🏥 **Clinical Features**

### **Clinical Decision Trees**

- **Acute Coronary Syndrome (ACS)**: Evidence-based decision pathways for chest pain evaluation and management
- **Interactive Stepper Interface**: Guided clinical decision-making with contextual recommendations
- **State Management**: Complex clinical scenarios with branching pathways

### **Enhanced Note Parser**

- **4-Step Workflow**: Paste → Parse → Review → Export clinical documentation
- **AI-Powered Analysis**: Intelligent extraction of clinical data from free-text notes
- **Multiple Export Formats**: Text, structured data, clinical summaries
- **Template Generation**: Automated clinical note structuring

### **Modern UI Components**

- **Responsive Design**: Mobile-first layout adapting to all device sizes
- **Theme System**: Light and dark modes with clinical status indicators
- **Accessibility**: Full keyboard navigation and screen reader support
- **Progressive Web App**: Offline capabilities and mobile installation

## 🏗️ **Architecture**

### **Modern Modular Structure**

cardiology-site/
├── src/
│ ├── core/ # Application core (42 lines - 99% reduction!)
│ │ ├── app.js # Modern bootstrap application
│ │ └── router.js # Hash-based routing with navigation
│ ├── features/ # Clinical feature modules
│ │ ├── decision-trees/ # Clinical decision support
│ │ │ └── acs/ # ACS pathway implementation
│ │ └── note-tools/ # Note parsing and management
│ ├── ui/ # Modern component library
│ │ ├── components/ # Reusable UI components (button, card, metric)
│ │ ├── patterns/ # Complex UI patterns (stepper, export)
│ │ └── shell/ # Application shell layout
│ ├── parsers/ # Clinical note processing
│ │ ├── noteParser.js # Core parsing engine
│ │ ├── noteParser_full.js # Full template-aware parser
│ │ └── templateRenderer.js # Clinical template generation
│ └── utils/ # Utility functions
├── styles/ # Modern CSS system
│ ├── tokens.css # Design system tokens
│ ├── globals.css # Global styles & themes
│ └── legacy/ # Archived legacy styles
├── data/ # Clinical data and guidelines
│ ├── cardiac_procedures.json
│ ├── enhanced/ # AFib and enhanced features
│ ├── guidelines/ # Clinical guidelines
│ └── meds/ # Medication databases
└── docs/ # Comprehensive documentation
├── legacy-migration.md # Migration process documentation
├── uat.md # User acceptance testing
└── release-notes-v1.0.0.md

```plaintext
cardiology-site/
├── src/
│   ├── core/                    # Application core (42 lines - 99% reduction!)
│   │   ├── app.js              # Modern bootstrap application
│   │   └── router.js           # Hash-based routing with navigation
│   ├── features/               # Clinical feature modules
│   │   ├── decision-trees/     # Clinical decision support
│   │   │   └── acs/           # ACS pathway implementation
│   │   └── note-tools/        # Note parsing and management
│   ├── ui/                    # Modern component library
│   │   ├── components/        # Reusable UI components (button, card, metric)
│   │   ├── patterns/          # Complex UI patterns (stepper, export)
│   │   └── shell/            # Application shell layout
│   ├── parsers/               # Clinical note processing
│   │   ├── noteParser.js      # Core parsing engine
│   │   ├── noteParser_full.js # Full template-aware parser
│   │   └── templateRenderer.js # Clinical template generation
│   └── utils/                 # Utility functions
├── styles/                    # Modern CSS system
│   ├── tokens.css            # Design system tokens
│   ├── globals.css           # Global styles & themes
│   └── legacy/              # Archived legacy styles
├── data/                     # Clinical data and guidelines
│   ├── cardiac_procedures.json
│   ├── enhanced/            # AFib and enhanced features
│   ├── guidelines/          # Clinical guidelines
│   └── meds/               # Medication databases
└── docs/                    # Comprehensive documentation
    ├── legacy-migration.md  # Migration process documentation
    ├── uat.md              # User acceptance testing
    └── release-notes-v1.0.0.md
```

### **Performance Metrics**

- **Core App Size**: 6,555 lines → 42 lines (99.2% reduction)
- **Load Time**: <500ms initial render
- **Memory Usage**: 60% reduction in DOM complexity
- **Modern Standards**: ES6 modules, CSS custom properties, PWA ready

## 🔧 **Development**

### **Prerequisites**

```bash
node >= 16.0.0
npm >= 8.0.0
```

### **Installation**

```bash
git clone https://github.com/jmartinsamson-cmd/cardiology-site.git
cd cardiology-site
npm install
```

### **Development Server**

```bash
# Start local development server
npm run dev
# or
python3 -m http.server 8080
```

### **Available Scripts**

```bash
npm run lint          # ESLint code quality checks
npm run lint:fix      # Auto-fix linting issues
npm run check:perf    # Performance tests (<500ms parse, <200ms frames)
npm run find:unused   # Detect unused code with knip
npm run validate:data # Validate clinical data integrity
npm run type-check    # TypeScript type checking
```

### **Parser Development Patterns**

When working with clinical text parsers ([parserHelpers.js](cardiology-site-7813ad486aa6cffa44584bb9e254c91b82c4595a/src/utils/parserHelpers.js)):

**String.raw Usage**: Always use `String.raw` template literals for regex patterns to preserve backslashes (`\s`, `\d`).

```javascript
const PATTERN = new RegExp(String.raw`^(?<name>[A-Za-z][^:=\n]{1,40}?)\s*[:=]\s*(?<value>\d+)`, 'i');
```

**Name Grammar**: Exclude separator chars (`:`, `=`) from name character classes to prevent greedy consumption:

- ✅ `[A-Za-z][^:=\n]{1,40}?` - Excludes separators, lazy quantifier
- ❌ `[A-Za-z0-9\s.:]+` - Includes colon, will match "BNP:" as name

**Combo-First Strategy**: Test combo format (AST/ALT) before single format to avoid false matches.

**Allowlist Pattern**: Use word-boundary regex (`\b`) for lab name filtering:

```javascript
const LAB_ALLOW_RE = /\b(troponin|bnp|creatinine|...)\b/i;
```

**Flag Coercion**: Normalize flags (H, High, ↑, *) → `(H)`, (L, Low, ↓) → `(L)` for consistency.

**Avoid Infinite Loops**: NEVER use `while(re.exec())` without global flag. Use `matchAll(withGlobal(re))`:
```javascript
// ❌ WRONG - Infinite loop if regex lacks 'g' flag
while ((m = re.exec(text))) { ... }

// ✅ CORRECT - Safe with withGlobal helper
for (const m of text.matchAll(withGlobal(re))) { ... }
```

ESLint enforces this via `no-restricted-syntax` rule.

## 🧪 **Testing**

### **Manual Testing Routes**

1. Navigate to `#/notes` - Test note parsing workflow
2. Navigate to `#/trees/acs` - Test ACS decision tree
3. Test copy-to-clipboard functionality
4. Toggle theme and verify persistence
5. Check browser console for errors
6. Verify service worker registration

### **Automated Testing**

```bash
npm run test          # Run test suite
npm run test:coverage # Generate coverage report
```

## 🏥 **Clinical Disclaimer**

⚠️ **IMPORTANT MEDICAL DISCLAIMER**:

The Modern Cardiac Suite is a **clinical decision support tool** designed to assist healthcare professionals in clinical decision-making. It is **NOT intended as a substitute for clinical judgment, medical training, or professional medical advice**.

- **No PHI Storage**: No patient health information (PHI) is stored locally or transmitted
- **Educational Purpose**: This tool is for educational and clinical support purposes only
- **Professional Responsibility**: Healthcare professionals remain fully responsible for all clinical decisions
- **Accuracy**: While based on current guidelines, users must verify all clinical recommendations

## 📱 **Browser Compatibility**

- **Chrome** 90+ ✅
- **Firefox** 88+ ✅
- **Safari** 14+ ✅
- **Edge** 90+ ✅

### **Progressive Web App Features**

- Offline functionality via service worker
- Mobile app installation capability
- Push notifications (future feature)
- Background sync (future feature)

## 🎛️ **Feature Flags**

Control feature availability without redeploying code using `config/features.json`.

### **Available Flags**

```json
{
  "sidebar_sanitize": true, // Enable diagnosis sidebar sanitization
  "meds_feature": true // Show medications page in navigation
}
```

### **How to Toggle Features**

**Option 1: Direct File Edit (Instant)**

```bash
# Edit config/features.json
{
  "sidebar_sanitize": false,  // Disable sanitization
  "meds_feature": false       // Hide medications page
}

# Reload browser - changes take effect immediately
# No build, no deployment required
```

**Option 2: Via Git (Production Environments)**

```bash
# Flip a flag
git checkout main
nano config/features.json  # Change flag value
git add config/features.json
git commit -m "feat: disable sidebar_sanitize"
git push origin main

# Changes live after next pull/sync on server
# No code rebuild required
```

### **Rollback Without Redeployment**

**Emergency Rollback:**

```bash
# Revert the flag change only
git revert <commit-hash>  # Reverts flag change
git push origin main

# Or manually fix in place:
nano config/features.json  # Restore previous value
git add config/features.json
git commit -m "fix: rollback sidebar_sanitize flag"
git push origin main
```

**Benefits:**

- ✅ Instant feature toggle (no build step)
- ✅ Independent of code changes
- ✅ Safe rollback in seconds
- ✅ Can disable features if issues arise
- ✅ A/B testing without code changes

### **Flag Behavior**

| Flag               | Default | Effect When `true`                          | Effect When `false`      |
| ------------------ | ------- | ------------------------------------------- | ------------------------ |
| `meds_feature`     | `true`  | Medications tab visible in nav              | Tab hidden from nav      |
| `sidebar_sanitize` | `true`  | Diagnosis sidebar filters non-medical terms | Raw diagnosis list shown |

### **CI Validation**

Feature flags are validated in CI:

```bash
npm run validate:features  # Checks features.json is valid JSON
```

If `features.json` is invalid, CI fails with clear error message.

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/clinical-enhancement`)
3. Commit changes (`git commit -m 'Add new clinical pathway'`)
4. Push to branch (`git push origin feature/clinical-enhancement`)
5. Open a Pull Request

### **Code Quality Standards**

- ESLint configuration with medical coding standards
- Comprehensive clinical accuracy testing
- Documentation for all clinical decision logic
- Accessibility compliance (WCAG 2.1 AA)

## 📚 **Documentation**

- **[Migration Guide](./docs/legacy-migration.md)** - Complete migration process documentation
- **[User Acceptance Testing](./docs/uat.md)** - Comprehensive test cases and procedures
- **[Release Notes](./docs/release-notes-v1.0.0.md)** - Detailed changelog and feature descriptions
- **[API Documentation](./docs/api.md)** - Component and parser API reference

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

For technical support or clinical questions:

- **Issues**: [GitHub Issues](https://github.com/jmartinsamson-cmd/cardiology-site/issues)
- **Discussions**: [GitHub Discussions](https://github.com/jmartinsamson-cmd/cardiology-site/discussions)
- **Email**: Clinical team support available

---

**Built with ❤️ for healthcare professionals**  
**Version**: v1.0.0 | **Build Date**: October 2, 2025 | **Status**: Production Ready 🚢
