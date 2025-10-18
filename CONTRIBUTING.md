# Contributing to CardiologySuiteApp vNext

Thank you for your interest in contributing to CardiologySuiteApp vNext! This document provides guidelines and instructions for contributing to the project.

## 🤝 Code of Conduct

By participating in this project, you agree to maintain a professional and respectful environment. We welcome contributions from healthcare professionals, developers, and anyone interested in improving clinical decision support tools.

## 🎯 How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear Title**: Descriptive summary of the issue
- **Steps to Reproduce**: Detailed steps to recreate the bug
- **Expected Behavior**: What should happen
- **Actual Behavior**: What actually happens
- **Environment**: Browser, OS, Node version
- **Screenshots**: If applicable
- **Error Messages**: Console logs or error messages

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear title** describing the enhancement
- **Provide detailed description** of the proposed functionality
- **Explain the use case** and why it would be valuable
- **Consider clinical accuracy** and patient safety implications
- **Include mockups** or examples if applicable

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the development setup** instructions below
3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Update documentation** as needed
6. **Submit a pull request** with a clear description

## 🛠️ Development Setup

### Prerequisites

```bash
node >= 16.0.0
npm >= 8.0.0
git
```

### Initial Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/CardiologySuiteApp_vNext.git
cd CardiologySuiteApp_vNext

# Add upstream remote
git remote add upstream https://github.com/jmartinsamson-cmd/CardiologySuiteApp_vNext.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### Development Workflow

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ...

# Run linting
npm run lint:fix

# Run tests
npm run test:unit
npm run test:e2e

# Validate data if you modified JSON files
npm run validate:data

# Commit your changes
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name
```

## 📝 Coding Standards

### JavaScript/TypeScript

- **Use ES6+ modules** with `.js` extensions
- **Follow ESLint rules** (zero errors, zero warnings required)
- **Use meaningful variable names** that reflect clinical terminology when appropriate
- **Add JSDoc comments** for complex functions
- **Prefer functional programming** patterns where appropriate

### File Naming

- **Features**: `src/features/[feature-name]/index.js`
- **Components**: `src/ui/components/[component-name].js`
- **Utils**: `src/utils/[utility-name].js`
- **Tests**: `tests/[feature-name].spec.js` or `[feature-name].test.js`

### Code Organization

```javascript
// ✅ Good: Clear structure with named exports
export function parseClinicalNote(text) {
  const sections = extractSections(text);
  const vitals = parseVitals(sections.vitals);
  return { sections, vitals };
}

// ❌ Bad: Unclear structure
export default function(t) {
  const s = t.split('\n');
  return s.map(x => x.trim());
}
```

### Parser Development

When working with clinical note parsers:

```javascript
// ✅ CORRECT: Use String.raw for regex patterns
const PATTERN = new RegExp(
  String.raw`^(?<name>[A-Za-z][^:=\n]{1,40}?)\s*[:=]\s*(?<value>\d+)`,
  'i'
);

// ✅ CORRECT: Use matchAll with withGlobal helper
for (const match of text.matchAll(withGlobal(PATTERN))) {
  const { name, value } = match.groups;
  // Process match
}

// ❌ WRONG: Infinite loop risk
while ((match = PATTERN.exec(text))) {
  // Don't do this!
}
```

### Clinical Data

When adding or modifying clinical data:

```bash
# Validate data structure
npm run validate:data

# Clean data (dry run first)
npm run clean:data

# Clean data (write changes)
npm run clean:data:write
```

## 🧪 Testing Requirements

### Before Submitting PR

All PRs must pass:

1. **Linting**: `npm run lint` (zero errors, zero warnings)
2. **Unit Tests**: `npm run test:unit` (all passing)
3. **E2E Tests**: `npm run test:e2e` (all passing)
4. **Data Validation**: `npm run validate:data` (if data modified)
5. **Type Checking**: `npm run type-check` (zero errors)

### Writing Tests

```javascript
// Example unit test
describe('Clinical Note Parser', () => {
  it('should extract vital signs correctly', () => {
    const note = 'BP: 120/80, HR: 72, Temp: 98.6';
    const result = parseClinicalNote(note);
    
    expect(result.vitals.bloodPressure).toEqual({ systolic: 120, diastolic: 80 });
    expect(result.vitals.heartRate).toBe(72);
    expect(result.vitals.temperature).toBe(98.6);
  });
});
```

### Visual Regression Tests

If your changes affect UI:

```bash
# Update visual baselines after intentional changes
npm run test:visual:update

# Commit the updated snapshots
git add tests/**/*.png
git commit -m "test: update visual snapshots for [feature]"
```

## 📚 Documentation

### Code Documentation

- Add **JSDoc comments** for public APIs
- Update **inline comments** for complex logic
- Document **clinical reasoning** behind decision support algorithms

```javascript
/**
 * Calculates HEART score for chest pain risk stratification
 * @param {Object} patient - Patient data object
 * @param {number} patient.age - Patient age in years
 * @param {string} patient.history - Cardiac history (none|low|moderate|high)
 * @param {string} patient.ecg - ECG findings
 * @param {number} patient.troponin - Troponin level
 * @returns {Object} HEART score and risk category
 */
export function calculateHeartScore(patient) {
  // Implementation
}
```

### README Updates

If your PR adds new features or changes existing functionality:

- Update `README.md` with new features
- Add usage examples
- Update the table of contents if needed

### Changelog

Add an entry to `CHANGELOG.md` (if exists) following [Keep a Changelog](https://keepachangelog.com/) format:

```markdown
## [Unreleased]

### Added
- New clinical decision tree for heart failure management

### Changed
- Improved parsing accuracy for laboratory values

### Fixed
- Fixed medication dosing calculator for renal impairment
```

## 🏥 Clinical Accuracy

### Clinical Content Guidelines

- **Evidence-Based**: All clinical recommendations must be based on current guidelines
- **Citations**: Include references to clinical guidelines or studies
- **Disclaimers**: Maintain appropriate clinical disclaimers
- **Safety First**: Consider patient safety in all clinical logic

### Clinical Review Process

For PRs involving clinical decision logic:

1. **Provide Evidence**: Include references to clinical guidelines
2. **Explain Rationale**: Document clinical reasoning
3. **Consider Edge Cases**: Think about special populations, contraindications
4. **Request Clinical Review**: Tag clinical advisors for review

## 🔒 Security & Privacy

### PHI Handling

- **Never commit PHI**: No real patient data in code or tests
- **Use mock data**: Create realistic but fake patient data for tests
- **Client-side only**: Keep patient data processing in the browser
- **No logging**: Don't log potentially sensitive information

### Security Best Practices

- **Input validation**: Sanitize all user inputs
- **XSS prevention**: Use proper escaping
- **Dependency security**: Run `npm audit` before submitting
- **Secrets**: Never commit API keys, credentials, or secrets

## 🎨 UI/UX Guidelines

### Design System

- Use components from `src/ui/components/`
- Follow Tailwind CSS conventions
- Maintain consistent spacing using design tokens
- Ensure mobile-responsive design

### Accessibility

- **WCAG 2.1 AA compliance** required
- **Keyboard navigation** must work for all interactive elements
- **Screen reader support** via proper ARIA labels
- **Color contrast** must meet accessibility standards

```bash
# Run accessibility tests
npm run test:a11y
```

## 📋 PR Checklist

Before submitting your PR, ensure:

- [ ] Code follows project style guidelines
- [ ] All tests pass (`npm run test:unit && npm run test:e2e`)
- [ ] Linting passes with zero errors (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Data validation passes if applicable (`npm run validate:data`)
- [ ] Documentation updated if needed
- [ ] Visual regression tests updated if UI changed
- [ ] Accessibility tests pass (`npm run test:a11y`)
- [ ] No console errors or warnings
- [ ] Branch is up to date with main
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains the changes

## 🏷️ Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```bash
feat(parser): add support for medication list extraction

fix(acs-tree): correct TIMI score calculation

docs(readme): update installation instructions

test(visual): update snapshots after button redesign
```

## 🔄 PR Review Process

1. **Automated Checks**: CI/CD pipeline runs all tests
2. **Code Review**: Maintainers review code quality and design
3. **Clinical Review**: If applicable, clinical advisors review accuracy
4. **Feedback**: Address review comments
5. **Approval**: PR approved by maintainer
6. **Merge**: PR merged to main branch

## 🎯 Areas for Contribution

### High Priority

- Additional clinical decision trees (Heart Failure, Arrhythmias, etc.)
- Enhanced AI prompts for clinical analysis
- Mobile app improvements
- Performance optimizations
- Accessibility enhancements

### Medium Priority

- Additional medication database entries
- Clinical guideline updates
- UI/UX improvements
- Documentation improvements
- Test coverage expansion

### Good First Issues

Look for issues labeled `good first issue` or `help wanted` in the GitHub issue tracker.

## 🤔 Questions?

- **GitHub Discussions**: For general questions and discussions
- **GitHub Issues**: For bug reports and feature requests
- **Documentation**: Check `docs/` folder for detailed guides

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- `CONTRIBUTORS.md` file
- Release notes for significant contributions
- Project README acknowledgments

---

Thank you for contributing to CardiologySuiteApp vNext! Your work helps improve clinical decision support for healthcare professionals worldwide. 🏥❤️
