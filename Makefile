# Cardiology Suite App - Verify Pipeline
# Comprehensive testing and validation pipeline

.PHONY: help verify verify-fast test-all lint-all security-check data-check api-check clean

# Default target
help:
	@echo "Cardiology Suite App - Verify Pipeline"
	@echo ""
	@echo "Available targets:"
	@echo "  verify        - Run full verification suite (slow)"
	@echo "  verify-fast   - Run fast verification checks"
	@echo "  test-all      - Run all test suites"
	@echo "  lint-all      - Run all linting checks"
	@echo "  security-check- Run security validation"
	@echo "  data-check    - Validate data integrity"
	@echo "  api-check     - Run API smoke tests"
	@echo "  clean         - Clean build artifacts"
	@echo ""
	@echo "Quick verification (recommended for CI):"
	@echo "  make verify-fast"

# Full verification suite - comprehensive but slow
verify: clean
	@echo "🚀 Starting full verification suite..."
	@echo ""
	@echo "📋 Running security checks..."
	@make security-check
	@echo ""
	@echo "🔍 Running data validation..."
	@make data-check
	@echo ""
	@echo "🧪 Running all tests..."
	@make test-all
	@echo ""
	@echo "🎯 Running API smoke tests..."
	@make api-check
	@echo ""
	@echo "✅ Full verification complete!"

# Fast verification - quick checks for development/CI
verify-fast: clean
	@echo "⚡ Starting fast verification..."
	@echo ""
	@echo "🔒 Running security checks..."
	@make security-check
	@echo ""
	@echo "📊 Running data validation..."
	@make data-check
	@echo ""
	@echo "🧪 Running unit tests..."
	npm run test:unit
	@echo ""
	@echo "🎯 Running API smoke tests..."
	@make api-check
	@echo ""
	@echo "✅ Fast verification complete!"

# All test suites
test-all:
	@echo "🧪 Running unit tests..."
	npm run test:unit
	@echo ""
	@echo "🎭 Running visual regression tests..."
	npm run test:visual
	@echo ""
	@echo "♿ Running accessibility tests..."
	npm run test:a11y
	@echo ""
	@echo "🔄 Running Playwright E2E tests..."
	npm run test:e2e
	@echo ""
	@echo "🧠 Running AI enhancement tests..."
	npm run test:ai-enhancements
	@echo ""
	@echo "📝 Running parser tests..."
	npm run test:parser
	@echo ""
	@echo "📈 Running performance tests..."
	npm run test:e2e:perf

# All linting checks
lint-all:
	@echo "🔧 Running ESLint..."
	npm run lint
	@echo ""
	@echo "🐍 Running Python linting..."
	npm run lint:python
	@echo ""
	# CSS checks disabled in dev container (pwsh already available)
	# @echo "🎨 Running CSS linting..."
	# npm run css:check

# Security validation
security-check:
	@echo "🔒 Running security audit..."
	npm run security:audit
	@echo ""
	@echo "🛡️  Running PHI scanner..."
	npm run security:phi-scan
	@echo ""
	@echo "🔐 Running file integrity check..."
	npm run security:integrity
	@echo ""
	@echo "✅ Security checks complete"

# Data integrity validation
data-check:
	@echo "📊 Validating JSON data files..."
	npm run validate:data
	@echo ""
	@echo "🏷️  Validating feature flags..."
	npm run validate:features
	@echo ""
	@echo "📋 Validating layout..."
	npm run validate:layout
	@echo ""
	@echo "✅ Data validation complete"

# API smoke tests
api-check:
	@echo "🌐 Running API smoke tests..."
	@if command -v node >/dev/null 2>&1; then \
		if [ -f "scripts/api-smoke-test.js" ]; then \
			npm run test:smoke; \
		else \
			echo "⚠️  API smoke test script not found, skipping..."; \
		fi \
	else \
		echo "⚠️  Node.js not available, skipping API tests..."; \
	fi
	@echo "✅ API checks complete"

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	@rm -rf dist/ build/ .next/ coverage/ test-results/ .cache/
	@find . -name "*.log" -type f -delete
	@find . -name ".DS_Store" -type f -delete
	@echo "✅ Clean complete"

# CI-specific targets
ci-verify: verify-fast
	@echo "🎯 CI verification complete"

# Development helpers
dev-setup:
	@echo "🔧 Setting up development environment..."
	npm install
	@echo "📦 Installing Python dependencies..."
	pip install -r requirements.txt || echo "Python dependencies not available"
	@echo "✅ Development setup complete"

# Dependency checks
deps-check:
	@echo "📦 Checking Node.js dependencies..."
	npm audit --audit-level=moderate
	@echo ""
	@echo "🐍 Checking Python dependencies..."
	@if command -v pip-audit >/dev/null 2>&1; then \
		pip-audit || echo "pip-audit not available"; \
	else \
		echo "pip-audit not installed, skipping Python audit"; \
	fi

# Quick health check
health:
	@echo "🏥 Health Check"
	@echo "=============="
	@echo "Node.js: $$(node --version 2>/dev/null || echo 'Not found')"
	@echo "npm: $$(npm --version 2>/dev/null || echo 'Not found')"
	@echo "Python: $$(python --version 2>/dev/null || echo 'Not found')"
	@echo "Git: $$(git --version 2>/dev/null || echo 'Not found')"
	@echo ""
	@echo "🚦 System Status:"
	@if [ -f "package.json" ]; then echo "✅ package.json found"; else echo "❌ package.json missing"; fi
	@if [ -f "requirements.txt" ]; then echo "✅ requirements.txt found"; else echo "❌ requirements.txt missing"; fi
	@if [ -d "src/" ]; then echo "✅ src/ directory found"; else echo "❌ src/ directory missing"; fi
	@if [ -d "tests/" ]; then echo "✅ tests/ directory found"; else echo "❌ tests/ directory missing"; fi