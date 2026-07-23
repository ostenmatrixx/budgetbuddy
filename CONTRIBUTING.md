# Contributing to BudgetBuddy

BudgetBuddy welcomes focused, reviewable improvements. Financial and authentication software needs careful handling: use fictional data, preserve owner isolation, and describe operational consequences in every relevant pull request.

## Before starting

1. Search existing issues and open a feature request for changes that affect product scope or architecture.
2. Report vulnerabilities through [`SECURITY.md`](SECURITY.md), not a public issue.
3. Read [`docs/architecture.md`](docs/architecture.md) and the production runbook before changing authentication, persistence, exports, the service worker, monitoring, migrations, or deployment configuration.
4. Do not use production accounts, records, credentials, or database copies for development.

No license is currently included in this repository. The repository owner must make that legal choice before accepting broad external contributions or redistributing the project.

## Local development

Use Node 24 and a dedicated local or staging Supabase project:

```bash
npm ci
cp .env.example .env
npm run dev
```

Only `VITE_*` public browser configuration belongs in the frontend environment. Never commit `.env`, service-role keys, database URLs, SMTP credentials, Turnstile secret keys, Sentry auth tokens, session tokens, or source maps.

## Change requirements

- Keep migrations additive whenever possible. A destructive migration needs a reviewed backup, compatibility, rollback, and data-reconciliation plan.
- Treat client-side authorization as presentation only; enforce ownership with RLS or a server-side authorization boundary.
- Preserve idempotency for transaction creation and exact password handling.
- Do not persist financial data in browser caches, Web Storage, IndexedDB, telemetry, screenshots, or test artifacts.
- Minimize third-party scripts and outbound origins. Document any new processor, CSP source, public key, retention setting, and failure mode.
- Use semantic HTML and maintain keyboard, focus, error-association, live-region, contrast, and touch-target behavior.
- Add tests at the lowest reliable level and include staging coverage for changes that depend on hosted Supabase behavior.
- Update operational documentation and `CHANGELOG.md` when behavior, schemas, vendors, controls, or rollout steps change.

## Verification

Run the local quality gate before opening a pull request:

```bash
npm run check
```

Then run the relevant additional suites:

```bash
npm run test:e2e
npm run test:db
npm audit --audit-level=high
```

Database tests require the local Supabase runtime or a dedicated staging database. Browser tests use mocked Supabase by default; never point pull-request tests at production.

## Pull requests

- Keep each pull request scoped to one outcome.
- Complete the pull-request template, including risk, data impact, exact validation, deployment order, monitoring, and rollback.
- Request review from the Code Owner for security- or operations-sensitive files.
- Resolve CI, CodeQL, and dependency-review findings rather than weakening their policies.
- Rebase or update from `main` before final review when the branch has drifted.
- Use squash merging unless preserving multiple commits materially improves the audit trail.

Repository administrators should enforce these expectations with the rules in [`docs/repository-governance.md`](docs/repository-governance.md).
