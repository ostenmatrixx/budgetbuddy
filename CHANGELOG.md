# Changelog

All notable changes to BudgetBuddy will be documented in this file.

The project follows [Semantic Versioning](https://semver.org/) once releases are tagged and uses the structure from [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Until a first stable release, minor versions may contain breaking changes when they are clearly documented.

## [Unreleased]

### Added

- Transaction versioning, atomic conflict detection, year-bounded dashboard reads, and an owner-scoped lifetime balance RPC
- Database-enforced financial-record length limits and expanded owner/RLS/concurrency pgTAP coverage
- Safety-critical unit coverage thresholds and Chromium, Firefox, and mobile WebKit release smoke tests
- Three-run Lighthouse budgets, staging artifacts, and read-only public deployment health checks
- Self-hosted Inter and Material Symbols font assets with third-party license notices
- Public privacy, terms, and `security.txt` endpoints linked from authentication and account settings
- Repository ownership, structured issue forms, and a production-focused pull-request template
- Pinned CodeQL and dependency-review workflows with least-privilege permissions
- Private vulnerability reporting and contribution policies
- Architecture, repository governance, security operations, incident response, retention, and privacy/terms readiness documentation

### Security

- Automated JavaScript and TypeScript CodeQL analysis on pull requests, `main`, and a weekly schedule
- Pull-request blocking for newly introduced high or critical dependency vulnerabilities
- Optimistic transaction concurrency to prevent stale edits or deletes from overwriting newer data
- A stricter self-hosted-font CSP and evidence-based security review with documented residual risks
