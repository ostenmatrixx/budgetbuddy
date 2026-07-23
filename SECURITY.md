# Security Policy

BudgetBuddy processes authentication information and user-entered financial records. Please report suspected vulnerabilities privately so they can be investigated before public disclosure.

## Supported versions

Before the first tagged public release, security fixes target the latest production deployment and the current `main` branch. After versioned releases begin, the latest released minor line will receive security fixes; older deployments should be upgraded.

| Version                            | Security fixes |
| ---------------------------------- | -------------- |
| Latest production deployment       | Yes            |
| Current unreleased `main`          | Yes            |
| Superseded deployments or versions | No             |

## Report a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/ostenmatrixx/budget-tracker/security/advisories/new). Repository administrators must enable **Settings → Security → Private vulnerability reporting** before public launch.

Do not open a public issue, pull request, discussion, or paste containing vulnerability details. Include only the minimum evidence needed:

- A clear description and affected component
- Reproduction steps using your own account and fictional data
- Expected impact and prerequisites
- A suggested mitigation, if known
- A contact method and whether you plan to disclose the issue later

Never include passwords, session tokens, Supabase keys, database URLs, SMTP credentials, real financial records, or another person’s data. If a secret was exposed, identify its type and location without copying its value.

The project targets an initial acknowledgement within three business days and an initial severity assessment within seven business days. These are operational targets, not guaranteed resolution times. Remediation and disclosure timing depend on severity, exploitability, affected providers, and safe deployment requirements.

## Testing boundaries

Good-faith research must:

- Use accounts and data you control
- Stop if you encounter another person’s data and report the boundary immediately
- Avoid denial-of-service, automated credential attacks, social engineering, spam, destructive testing, and persistence
- Avoid testing Supabase, Vercel, Cloudflare, Sentry, email providers, or other third-party infrastructure outside their published programs
- Minimize data access and delete locally retained evidence after the report is resolved

There is no bug bounty or formal safe-harbor program unless one is explicitly published by the repository owner.

## Security design notes

- Supabase Row Level Security is the authorization boundary for account-owned tables. Frontend checks are user experience controls only.
- The browser receives only Supabase’s public key, the public Turnstile site key, and an optional public Sentry DSN. Service-role, SMTP, database, and source-map upload credentials remain server-side.
- The service worker caches only the same-origin application shell and versioned static assets, not Supabase responses or financial records.
- Optional Sentry monitoring is production-only and configured to omit default PII, replay, request data, user identifiers, breadcrumbs, and application fields.
- The current Supabase browser client persists its auth session in Web Storage by default. The accepted threat tradeoff and required controls are documented in [`docs/security-operations.md`](docs/security-operations.md).

See [`docs/incident-response.md`](docs/incident-response.md) for the operator response process.
