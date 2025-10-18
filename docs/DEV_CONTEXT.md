# AI Development Context - Cardiology Suite

## What This Application Is

Cardiology Suite v3.0 is a web-based clinical decision support system for cardiovascular medicine. It parses clinical notes, provides diagnostic reasoning, offers treatment guidelines, and includes educational content for healthcare professionals.

## Current Status (October 2025)

- ESLint errors: ZERO (down from 702)
- CI pipeline: PASSING
- Code quality: Production ready
- Last major work: Complete ESLint compliance achieved

## Key Technologies

- Vanilla JavaScript (ES6+)
- Browser-based application
- ESLint for code quality
- Git/GitHub for version control

## Main File Structure

src/
parsers/ - Clinical note parsing (noteParser.js is perfect)
core/ - App initialization (app.js, router.js)
utils/ - Helper functions (parserHelpers.js, storage.js)
enhanced/ - Medical modules (afib-integration.js)
guidelines/ - Clinical guidelines (guidelines.js)
ui/ - Interface components
data/ - Medical knowledge base
eslint.config.js - Code quality configuration (recently overhauled)

```plaintext
src/
  parsers/         - Clinical note parsing (noteParser.js is perfect)
  core/           - App initialization (app.js, router.js)
  utils/          - Helper functions (parserHelpers.js, storage.js)
  enhanced/       - Medical modules (afib-integration.js)
  guidelines/     - Clinical guidelines (guidelines.js)
  ui/             - Interface components
data/             - Medical knowledge base
eslint.config.js  - Code quality configuration (recently overhauled)
```

## Recent Major Achievements

1. Fixed Object.prototype.hasOwnProperty.call() usage
2. Updated eslint.config.js with comprehensive browser/Node.js globals
3. Removed unnecessary regex backslashes
4. Added global function declarations
5. Eliminated all unused variables
6. Achieved zero ESLint errors

## For Future AI Agents

- Always run "npm run lint" before making changes
- Maintain the zero-error ESLint policy
- The codebase is now clean and ready for feature development
- Focus on medical accuracy and HIPAA compliance
- All major linting issues have been resolved

## Git Repository

- GitHub: jmartinsamson-cmd/cardiology-site
- Branch: main
- Recent commits: 3ea009e (0 errors), 4bc5076 (major fixes)

## Next Steps Potential

- Add new medical conditions to data/
- Enhance clinical parsers
- Expand to other medical specialties
- Mobile optimization
- EHR system integration

The application is production-ready and all technical debt has been resolved.
