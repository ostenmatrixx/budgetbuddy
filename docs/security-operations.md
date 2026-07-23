# Security Operations

This document records security decisions and hosted controls that cannot be enforced solely by application code. Mark each external control as verified for staging and production before public launch.

## Browser session-storage threat tradeoff

The current `createClient` call uses Supabase’s browser defaults, including persistent auth sessions in origin-scoped Web Storage. This preserves sign-in across refreshes and installed-PWA restarts, which is valuable for a consumer application, but bearer tokens accessible to JavaScript can be stolen by a successful same-origin XSS, malicious browser extension, compromised third-party script, or local user of an unlocked shared device.

This is an explicit beta tradeoff, not a claim that Web Storage is a secure vault. Required compensating controls are:

- Keep a strict script CSP with no `unsafe-eval` and only the reviewed Turnstile third-party origin.
- Do not use raw HTML injection, string-to-code APIs, or user-controlled navigation/script URLs.
- Minimize third-party JavaScript; disable session replay and strip monitoring events.
- Keep Supabase access tokens short-lived and refresh-token rotation/reuse detection enabled where available.
- Enforce RLS and ownership immutability so a stolen user token cannot become an administrator token.
- Provide explicit sign-out and advise users on shared devices to sign out and close the browser.
- Never store financial records in Web Storage, IndexedDB, the service-worker cache, or background sync.
- Treat any XSS or exposed session as a credential incident and revoke sessions when supported.

Revisit the decision before handling regulated bank connections or higher-risk data. Alternatives have material tradeoffs:

- In-memory sessions reduce persistence but log users out after refresh and do not eliminate active-page XSS risk.
- An HttpOnly-cookie backend-for-frontend can hide session tokens from JavaScript but adds server infrastructure, CSRF protection, cookie-domain design, and a new privileged boundary.

Any storage-mode change requires authentication, recovery, multi-tab, PWA, CSRF, and session-revocation tests plus an updated threat model.

## Security and availability monitoring

Monitoring must not collect email, user identifiers, transaction details, amounts, descriptions, request bodies, bearer tokens, database URLs, or exported files.

| Signal                         | Source                  | Alert condition to configure                                                  | Response owner |
| ------------------------------ | ----------------------- | ----------------------------------------------------------------------------- | -------------- |
| Public app availability        | Independent uptime tool | Two consecutive failures from more than one region                            | On-call owner  |
| Frontend error rate            | Sentry                  | New unhandled error or sustained increase over the reviewed baseline          | App owner      |
| Deployment and header check    | Vercel / release gate   | Failed deployment, missing required header, CSP regression, wrong environment | Release owner  |
| Auth and database health       | Supabase dashboard      | Elevated errors/latency, exhausted quota, unusual sign-in or recovery rate    | Data owner     |
| Edge Function health           | Supabase logs/metrics   | Repeated 5xx, latency spike, or deletion failures without logging inputs      | Data owner     |
| Staging synthetic journey      | GitHub Actions          | Nightly Auth/RLS/CRUD test failure                                            | App owner      |
| Backup freshness and integrity | GitHub Actions/storage  | Missed schedule, empty encrypted artifact, checksum failure, restore failure  | Data owner     |
| Dependency and code findings   | GitHub                  | Any high/critical advisory or new actionable CodeQL result                    | Security owner |
| Provider security notice       | Vendor status/email     | Incident affecting an in-use region, service, or subprocess                   | Incident lead  |

Before launch, assign named primary and backup responders outside this public file, connect alerts to a tested private channel, and define escalation when an alert is unacknowledged. Test every alert path quarterly and after changing providers. A successful nightly check is not a substitute for independent availability monitoring.

Use a synthetic staging account with fictional data. Production health checks should be non-mutating unless a dedicated synthetic account and cleanup plan are approved. Never place credentials in workflow output.

## Hosted-service configuration checklist

### GitHub

- Apply the branch, Actions, scanning, and private-reporting settings in `repository-governance.md`.
- Scope staging and production secrets through separate Environments; require approval for production.
- Confirm Actions logs and artifacts have suitable retention and no plaintext backups.

### Vercel and DNS

- Require MFA for administrators and use least-privilege project roles.
- Scope Preview environment variables to staging and Production variables to production; inspect a built bundle to confirm only public keys are present.
- Protect Preview deployments when they expose realistic staging data, while preserving the release gate’s approved bypass mechanism.
- Verify response headers at the deployed origin after every configuration change.
- Configure the canonical custom domain, HTTPS, and DNS change access. Do not enable long-lived HSTS until all required subdomains, rollback behavior, and ownership are understood and tested.
- Enable deployment-failure and domain/TLS-expiry alerts.

### Supabase

- Keep staging and production in separate organizations/projects where practical and require administrator MFA.
- Enable SSL enforcement and review network restrictions, database roles, API exposure, RLS, backups, and quota alerts.
- Configure exact Auth site/redirect allowlists, mandatory email confirmation, secure password change, conservative rate limits, leaked-password protection where available, and short-lived sessions appropriate to the product.
- Configure the Turnstile secret, SMTP credentials, and Edge Function `ALLOWED_ORIGINS` only in server-side secret stores.
- Verify no table in an exposed schema lacks an intentional RLS decision.
- Test session revocation, key rotation, Edge Function deployment rollback, and the quarterly restore procedure.

### Cloudflare Turnstile

- Use separate staging/test and production widgets and secrets.
- Restrict production widget hostnames to exact owned domains.
- Protect dashboard access with MFA and rotate the secret after suspected exposure.
- Document provider retention and regional processing for the privacy review.

### Sentry

- Keep the DSN optional and production-only; keep source-map upload credentials out of `VITE_*` variables.
- Disable replay, tracing, default PII, request bodies, headers, breadcrumbs, user context, and automatic financial-domain fields.
- Restrict project access, require MFA, configure the shortest useful event retention, and test a sanitized synthetic exception.
- Upload hidden source maps privately and confirm the build removes maps from `dist` after upload.
- Configure new-issue and error-spike alerts without attaching sensitive payloads.

### SMTP provider

- Verify the sending domain and configure SPF, DKIM, and DMARC with a staged rollout appropriate to the domain.
- Use a dedicated restricted credential, require admin MFA, and configure bounce/complaint monitoring.
- Keep email templates non-enumerating and free of financial data.
- Document provider retention, logs, subprocessors, and incident notification terms.

### External uptime and status communication

- Monitor the canonical app origin from at least two regions and include TLS-expiry checks.
- Publish a status page only after deciding whether provider names and incident details create additional security risk.
- Keep the incident-response contact path available when the application itself is unavailable.

## Third-party inventory control

The authoritative launch-time processor checklist is `privacy-and-terms-checklist.md`. Any pull request that adds an external script, API, hosted service, font, analytics tool, or data transfer must update:

1. The inventory and purpose
2. Data categories and retention
3. CSP and origin allowlists
4. Credentials and administrator ownership
5. Failure, exit, deletion, and incident-notification procedures
6. User-facing privacy/terms materials after appropriate legal review
