# Security Configuration for Cardiology Suite v3.0

## Branch Protection Rules (to be configured in GitHub repository settings)

### Main branch should be protected with the following rules

## Required Status Checks

- security-audit
- code-quality
- dependency-check
- medical-compliance
- file-integrity

## Restrictions

- Require pull request reviews before merging (minimum 1 reviewer)
- Dismiss stale pull request approvals when new commits are pushed
- Require status checks to pass before merging
- Require branches to be up to date before merging
- Restrict pushes to main branch (only allow via PR)

## Required Reviewers

- Repository owner must approve changes to critical files
- Medical professional review required for clinical data changes

## File Protection Patterns

CRITICAL_PATHS=(
"package.json"
"package-lock.json"
"eslint.config.js"
"src/core/"
"data/cardiac_procedures.json"
"data/enhanced/"
"data/guidelines/"
".github/workflows/"
)

## Security Headers (for deployment)

SECURITY_HEADERS:
Content-Security-Policy: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
X-Content-Type-Options: "nosniff"
X-Frame-Options: "DENY"
X-XSS-Protection: "1; mode=block"
Referrer-Policy: "strict-origin-when-cross-origin"
Permissions-Policy: "geolocation=(), microphone=(), camera=()"

## Dependency Security Rules

ALLOWED_DEPENDENCY_CHANGES:

- Security patches (patch version updates)
- Approved minor version updates with review
- Major version updates require maintainer approval

FORBIDDEN_DEPENDENCIES:

- Packages with known security vulnerabilities
- Unmaintained packages (no updates > 2 years)
- Packages with excessive permissions
- Non-medical domain packages without justification
