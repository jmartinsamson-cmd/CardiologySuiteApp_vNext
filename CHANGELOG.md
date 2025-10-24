# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.8.0] - 2025-10-24

### Added
* **API Reliability (P0)**: Comprehensive smoke test harness with schema validation and JUnit output
* **Health Monitoring**: Enhanced health endpoint with dependency probing for Cosmos DB and Table Storage
* **Input Validation**: Schema-based payload validation for all API endpoints with 400 error responses
* **Operational Tools (P1)**: Azure Storage lifecycle policy for automated blob retention by tags
* **Tag Query Utilities**: Python scripts for querying blobs by index tags and CSV export
* **Filename Normalization**: Safe filename processing tool with checksum verification
* **Verification Pipeline**: Comprehensive Makefile and npm scripts for security, data, and testing validation
* **CI/CD Integration**: GitHub Actions workflow for automated smoke testing on push/PR/nightly schedules
* **Logger Enhancement (P2)**: PHI/PII redaction, configurable log levels, request correlation, structured JSON output
* **Operational Runbook**: Comprehensive documentation added to README with monitoring and troubleshooting guides

### Changed
* Enhanced security measures with PHI redaction in logging
* Improved error handling and validation across API endpoints
* Updated dependency management and security scanning

### Technical Improvements
* Automated blob lifecycle management with retention policies
* Structured logging with request ID correlation
* Comprehensive testing pipeline with smoke, unit, and E2E tests
* Security hardening with input validation and PHI protection

### Infrastructure
* Added Azure Storage lifecycle management
* Implemented automated verification pipeline
* Enhanced CI/CD with comprehensive testing
* Added operational monitoring and health checks

## [0.7.0] - 2025-10-XX

### Added
* AI-enhanced clinical note parsing with GPT-4 integration
* Progressive Web App capabilities
* Comprehensive accessibility compliance (WCAG 2.1 AA)
* Azure OpenAI integration for clinical decision support
* Enhanced parser accuracy with +17% improvement
* Template generation for clinical notes
* Evidence-based clinical decision trees
* Real-time clinical guidance workflows

### Changed
* Migrated to modern JavaScript (ES modules)
* Enhanced security architecture with client-side processing
* Improved performance with optimized bundle sizes
* Updated clinical reference databases

### Technical Improvements
* TypeScript integration for better code quality
* ESLint flat config implementation
* Comprehensive test coverage (unit, E2E, visual, accessibility)
* Lighthouse performance optimization (95+ scores)

### Infrastructure
* Azure Functions API deployment
* GitHub Actions CI/CD pipeline
* Automated testing and quality gates
* Security scanning and dependency auditing