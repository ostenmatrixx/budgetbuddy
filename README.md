<p align="center">
  <a href="public/favicon.svg">
    <img src="public/favicon.svg" alt="BudgetBuddy wallet icon" width="112" height="112" />
  </a>
</p>

<h1 align="center">BudgetBuddy</h1>

---

<p align="center">
  <strong>A privacy-conscious personal finance PWA for clear, contextual money decisions.</strong>
</p>

<p align="center">
  <a href="CHANGELOG.md"><img alt="Version 0.1.0" src="https://img.shields.io/badge/version-v0.1.0-EA6A5E" /></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-7C6EE6" /></a>
  <a href="https://github.com/ostenmatrixx/budgetbuddy/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/ostenmatrixx/budgetbuddy?label=last%20commit&amp;color=4FA78F" /></a>
  <a href="https://github.com/ostenmatrixx/budgetbuddy/issues"><img alt="Open issues" src="https://img.shields.io/github/issues/ostenmatrixx/budgetbuddy?color=E4A84B" /></a>
  <a href="https://github.com/ostenmatrixx/budgetbuddy/actions/workflows/ci.yml"><img alt="CI status" src="https://github.com/ostenmatrixx/budgetbuddy/actions/workflows/ci.yml/badge.svg" /></a>
  <a href="https://github.com/ostenmatrixx/budgetbuddy/actions/workflows/codeql.yml"><img alt="CodeQL status" src="https://github.com/ostenmatrixx/budgetbuddy/actions/workflows/codeql.yml/badge.svg" /></a>
</p>

<p align="center">
  <a href="#tech-stack"><img alt="React 19" src="https://img.shields.io/badge/React-19-149ECA?logo=react&amp;logoColor=white" /></a>
  <a href="#tech-stack"><img alt="TypeScript 5.9" src="https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&amp;logoColor=white" /></a>
  <a href="#tech-stack"><img alt="Vite 7" src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&amp;logoColor=white" /></a>
  <a href="#tech-stack"><img alt="Tailwind CSS 3" src="https://img.shields.io/badge/Tailwind_CSS-3-06B6D4?logo=tailwindcss&amp;logoColor=white" /></a>
  <a href="#tech-stack"><img alt="Supabase Postgres" src="https://img.shields.io/badge/Supabase-Postgres-3FCF8E?logo=supabase&amp;logoColor=white" /></a>
  <a href="#what-it-does"><img alt="Installable PWA" src="https://img.shields.io/badge/PWA-installable-5A0FC8?logo=pwa&amp;logoColor=white" /></a>
  <a href="#local-development"><img alt="Node.js 24" src="https://img.shields.io/badge/Node.js-24-339933?logo=nodedotjs&amp;logoColor=white" /></a>
  <a href="#quality-gates"><img alt="Vitest tests" src="https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&amp;logoColor=white" /></a>
  <a href="#quality-gates"><img alt="Playwright browser tests" src="https://img.shields.io/badge/E2E-Playwright-2EAD33?logo=playwright&amp;logoColor=white" /></a>
</p>

<p align="center">
  <a href="#what-it-does">Features</a> ·
  <a href="#tech-stack">Tech stack</a> ·
  <a href="#local-development">Quick start</a> ·
  <a href="#architecture">Architecture</a> ·
  <a href="#security-privacy-and-operations">Security</a> ·
  <a href="CONTRIBUTING.md">Contributing</a>
</p>

## Showcase

<p align="center">
  <a href="portfolio-screenshots/00-budgetbuddy-showcase.png">
    <img src="portfolio-screenshots/00-budgetbuddy-showcase.png" alt="BudgetBuddy editorial showcase with the monthly dashboard, balance, budget allocation, and recent activity" />
  </a>
</p>

BudgetBuddy brings income, essentials, savings, and everyday spending into one calm place. It combines a responsive React dashboard with Supabase authentication and owner-scoped Postgres data, and is engineered for a public multi-user beta on Vercel.

## What it does

- Tracks income, bills, savings, and non-essential spending with custom subcategories
- Shows monthly summaries, category charts, a calendar, a daily log, and annual reports
- Adds all-history activity search, monthly decision support, confirmed recurring items, and linked savings goals
- Supports editable budget allocations, with 50/30/20 defaults
- Formats dates and money from each account's currency, locale, and timezone settings
- Handles confirmation, recovery, password changes, and password-reauthenticated account deletion
- Exports fresh owner-scoped data as versioned JSON or spreadsheet-safe RFC-4180 CSV
- Uses an install-first landing page and opens the account dashboard only in standalone PWA mode
- Keeps financial records out of browser caches and background sync
- Preserves loaded data when offline, blocks writes, and provides explicit update and retry actions

## Production engineering

- Supabase Row Level Security across all four owner-scoped tables, backed by 60 pgTAP assertions
- Idempotent transaction creation and optimistic concurrency protection for edits and deletes
- Year-bounded dashboard reads, paginated exports, and an owner-derived lifetime balance RPC
- Accessible native-dialog infrastructure, keyboard flows, live status announcements, and axe checks
- Privacy-minimal, production-only Sentry errors with private source maps and no session replay
- Strict Vercel security headers, self-hosted fonts, explicit service-worker caching rules, and public security contact metadata
- Reproducible Node 24 builds, dependency auditing, coverage thresholds, three-browser Playwright smoke tests, and Lighthouse budgets
- CodeQL, dependency review, Dependabot, encrypted-backup automation, staging validation, and read-only production health checks

The codebase provides production-grade controls, but a real launch still requires the hosted configuration and staging evidence in the [production runbook](docs/production-runbook.md). Repository automation cannot prove that external Supabase, Vercel, SMTP, Turnstile, Sentry, DNS, or administrator settings are correct.

## Tech stack

| Area                       | Technologies                                                                 |
| -------------------------- | ---------------------------------------------------------------------------- |
| Frontend                   | React 19, TypeScript 5.9, Tailwind CSS 3, Vite 7                             |
| Authentication and data    | Supabase Auth, PostgreSQL, PostgREST, Row Level Security                     |
| Server-side operations     | Supabase Edge Functions                                                      |
| PWA                        | Web App Manifest, Service Worker API, install and offline lifecycle handling |
| Security and observability | Cloudflare Turnstile, Sentry, Vercel CSP and security headers                |
| Testing                    | Vitest, Testing Library, Playwright, axe-core, pgTAP, Lighthouse             |
| Delivery and maintenance   | Vercel, GitHub Actions, CodeQL, Dependabot, Node.js 24                       |

## Architecture

BudgetBuddy has no custom application server on Vercel. The installed React PWA talks directly to Supabase Auth and PostgREST; database Row Level Security is the owner-authorization boundary.

```mermaid
flowchart LR
    subgraph delivery["Delivery and external services"]
        vercel["Vercel<br/>Static app and security headers"]
        turnstile["Cloudflare Turnstile<br/>Bot challenge"]
        sentry["Sentry<br/>Sanitized production errors"]
    end

    subgraph device["Browser / installed PWA"]
        sw["Service worker<br/>App shell and static assets only"]
        app["React + TypeScript PWA<br/>Dashboard, validation, and exports"]
        memory[("Loaded financial data<br/>In memory only")]
        session[("Supabase session<br/>Origin-scoped storage")]

        sw -->|"Cached shell"| app
        app <--> memory
        app <--> session
    end

    subgraph backend["Supabase backend"]
        auth["Supabase Auth<br/>Identity and sessions"]
        api["PostgREST API"]
        rls["Row Level Security<br/>Owner policies"]
        rpc["Database RPCs<br/>Balance, search, schedules, and goals"]
        db[("Owner-scoped PostgreSQL")]
        edge["delete-account Edge Function<br/>Origin check and reauthentication"]
        admin["Auth Admin API"]

        api --> rls --> db
        api --> rpc --> db
        edge --> admin
        admin -->|"Foreign-key cascades"| db
    end

    vercel -->|"HTTPS app shell"| app
    vercel -->|"Static assets"| sw
    turnstile -->|"Challenge token"| app
    app -->|"Credentials and session refresh"| auth
    app <-->|"Bearer-token CRUD"| api
    app -->|"Authenticated deletion request"| edge
    app -.-> sentry
```

The client owns presentation, validation, local export generation, and the PWA lifecycle. Supabase owns identity and durable financial state. Sessions persist in origin-scoped browser storage, but financial records do not: the service worker caches only the same-origin app shell and static assets, loaded records stay in React memory when offline, and writes are blocked.

The authenticated `delete-account` Edge Function is the only privileged runtime. Its service-role key stays server-side, while optional Sentry monitoring receives only privacy-minimal error events.

See [Architecture](docs/architecture.md) and the [Security review](docs/security-review.md) for trust boundaries and documented residual risks.

## Local development

Use Node 24 and npm:

```bash
npm ci
cp .env.example .env
npm run dev
```

Required public browser configuration:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-or-publishable-key
VITE_TURNSTILE_SITE_KEY=your-public-cloudflare-turnstile-site-key
VITE_SENTRY_DSN=your-optional-public-sentry-dsn
```

Never expose a Supabase service-role key, database URL, Sentry upload token, SMTP credential, or Turnstile secret through a `VITE_*` variable.

## Quality gates

```bash
npm run check          # formatting, lint, coverage, type-safe production build
npm run test:unit      # Vitest suite
npm run test:coverage  # safety-critical coverage, minimum 70%
npm run test:e2e       # Chromium, Firefox, and mobile WebKit
npm run test:db        # local Supabase pgTAP policy suite (requires Docker)
npm audit --audit-level=high
```

Pull requests run the deterministic browser suite against mocked Supabase. Authenticated CRUD and RLS validation use an isolated staging Supabase project before release; production credentials and data must never enter pull-request jobs.

## Supabase and deployment

The checked-in migrations create `transactions`, `budget_preferences`, `transaction_subcategories`, and `user_settings`, their constraints and owner policies, request idempotency, transaction versions, and the balance RPC.

Deploy additively in this order:

1. Back up production and validate an encrypted restore drill.
2. Apply migrations and deploy the Edge Function to staging.
3. Configure staging Auth, SMTP, Turnstile, redirects, origins, rate limits, and monitoring.
4. Deploy the frontend and pass staging Auth/RLS/CRUD, export, deletion, accessibility, PWA, CSP, and cache checks.
5. Promote the database, function, hosted configuration, and frontend to production in that order.
6. Verify public headers and health endpoints, then retain the release evidence.

Use separate Supabase projects and Vercel variables for Preview and Production. Full commands, rollback boundaries, and operator checks are in the [production runbook](docs/production-runbook.md).

## Security, privacy, and operations

- Report vulnerabilities through [GitHub private security advisories](https://github.com/ostenmatrixx/budgetbuddy/security/advisories/new); see [SECURITY.md](SECURITY.md).
- Review the [incident response](docs/incident-response.md), [data retention](docs/data-retention.md), and [backup and restore](docs/backup-and-restore.md) procedures before launch.
- Replace the included privacy and terms templates with owner-approved text that accurately reflects configured providers and applicable law.
- Enable protected branches, required checks, private vulnerability reporting, secret scanning, push protection, and administrator MFA in hosted consoles.

## Scope

Receipt scanning, CSV import, bank synchronization, device push notifications, automatic recurring
transaction creation, persistent offline financial storage, and background mutation queues are
intentionally deferred until the production-beta foundation has been deployed and observed under
real use.

Contributions are welcome through the process in [CONTRIBUTING.md](CONTRIBUTING.md).

## License

BudgetBuddy is available under the [MIT License](LICENSE).
