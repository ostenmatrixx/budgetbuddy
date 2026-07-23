# Production Security Review

**Review date:** 2026-07-23

**Scope:** Current BudgetBuddy working tree; React/Vite browser application, Vercel configuration, PWA worker, Supabase migrations/RLS tests, account-deletion Edge Function, monitoring, exports, and GitHub security automation.

## Executive summary

No known critical- or high-severity finding was identified in this repository review. `npm audit --audit-level=high` reported zero known dependency vulnerabilities on the reviewed lockfile. The source scan found no use of `dangerouslySetInnerHTML`, direct HTML insertion, `eval`, `new Function`, string timers, untrusted `postMessage` receivers, or user-controlled navigation sinks.

That result is not a certification, penetration test, or legal-compliance assessment. Production safety still depends on deploying the checked-in migrations, enabling and testing RLS, configuring separate staging/production providers, protecting administrators and secrets, setting rate limits and redirect/origin allowlists, and operating monitoring, backup, incident, deletion, and privacy processes.

The principal residual risks are medium or low: JavaScript-accessible persisted Supabase sessions, a style CSP that still allows inline styles, privileged third-party Turnstile JavaScript, environment-specific `connect-src` wildcards, and hosted controls that code cannot enforce.

## Method

The review used:

- Pattern searches for DOM/React HTML injection, dynamic code execution, unsafe event attributes, navigation/redirects, cross-window messaging, browser storage, dynamic scripts, secrets, and credentialed network calls
- Manual trust-boundary review of Auth, PostgREST access, RLS, Edge Function privilege, exports, PWA caching, CSP, source maps, and monitoring scrubbing
- Review of pgTAP coverage for anonymous denial, cross-owner isolation, ownership immutability, constraints, idempotency, concurrency, RPC isolation, and cascade deletion
- `npm audit --audit-level=high`

Not performed: an external penetration test, browser-extension threat testing, provider-console inspection, production runtime-header verification, email-delivery testing, cryptographic review, historical-secret scan of every Git object, or legal/privacy analysis. These remain rollout gates.

## Current security controls

| Control                         | Repository evidence                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Server-side owner authorization | Transactions enable RLS and use `auth.uid()` for owner CRUD in [`20260528000000_create_transactions.sql:28`](../supabase/migrations/20260528000000_create_transactions.sql#L28) and [`:40-63`](../supabase/migrations/20260528000000_create_transactions.sql#L40). Equivalent policies protect budget preferences, subcategories, and settings.                                                                                        |
| Adversarial RLS tests           | Cross-owner invisibility and ownership-transfer denial are exercised in [`rls_policies.test.sql:191-250`](../supabase/tests/rls_policies.test.sql#L191); cascade deletion is checked at [`:271-292`](../supabase/tests/rls_policies.test.sql#L271).                                                                                                                                                                                    |
| Retry and update correctness    | A unique owner/request index prevents duplicate transaction creates in [`20260722000000_add_transaction_idempotency.sql:8-13`](../supabase/migrations/20260722000000_add_transaction_idempotency.sql#L8). Versioned updates and an owner-derived balance RPC are defined in [`20260723000000_add_transaction_concurrency_and_balance.sql:1-53`](../supabase/migrations/20260723000000_add_transaction_concurrency_and_balance.sql#L1). |
| Privileged deletion boundary    | The Edge Function allowlists origins, requires POST and a bearer token, validates bounded input, reauthenticates the exact user, and only then invokes Admin deletion at [`delete-account/index.ts:40-128`](../supabase/functions/delete-account/index.ts#L40).                                                                                                                                                                        |
| Browser protections             | Vercel config enforces a script allowlist, framing denial, `nosniff`, restrictive referrer behavior, permissions restrictions, and HTTPS upgrades in [`vercel.json:17-38`](../vercel.json#L17).                                                                                                                                                                                                                                        |
| Financial-data cache exclusion  | The worker rejects non-GET and cross-origin requests and caches only an explicit shell or hashed static paths in [`sw.js:18-30`](../public/sw.js#L18) and [`:95-148`](../public/sw.js#L95). Supabase traffic is cross-origin and bypasses the worker.                                                                                                                                                                                  |
| Privacy-minimal monitoring      | Sentry is production/DSN gated; default PII, tracing, BrowserSession, breadcrumbs, request, user, context, tags, message, and domain exception values are removed in [`monitoring.ts:4-45`](../src/lib/monitoring.ts#L4). Hidden source maps are deleted after private upload in [`vite.config.ts:8-28`](../vite.config.ts#L8).                                                                                                        |
| Export formula defense          | CSV fields are RFC-4180 escaped and formula-leading text is prefixed before download in [`export.ts:37-65`](../src/lib/export.ts#L37) and [`:91-100`](../src/lib/export.ts#L91).                                                                                                                                                                                                                                                       |
| Password integrity              | New passwords require ten characters and password values are preserved without trimming in [`auth.ts:21-52`](../src/lib/auth.ts#L21) and [`:66-81`](../src/lib/auth.ts#L66).                                                                                                                                                                                                                                                           |
| Bounded user-authored text      | Database checks enforce description, notes, and subcategory limits in [`20260723001000_add_financial_text_length_limits.sql`](../supabase/migrations/20260723001000_add_financial_text_length_limits.sql), with matching client constants and pgTAP boundary tests.                                                                                                                                                                    |
| Supply-chain gates              | CodeQL runs security-and-quality queries with pinned official actions in [`codeql.yml`](../.github/workflows/codeql.yml); dependency review blocks high/critical additions using a pinned official action in [`dependency-review.yml`](../.github/workflows/dependency-review.yml).                                                                                                                                                    |

## Residual findings

### BB-SEC-001 — JavaScript-accessible persistent Auth sessions

- **Severity:** Medium
- **Location:** [`src/lib/supabaseClient.ts:16-18`](../src/lib/supabaseClient.ts#L16), [`src/App.tsx:38-64`](../src/App.tsx#L38)
- **Evidence:** The browser client is created with Supabase defaults and later restores the session with `getSession()`. Supabase’s browser default persists the bearer session in origin Web Storage.
- **Impact:** A successful same-origin XSS, compromised allowed third-party script, malicious extension, or user on an unlocked shared device could obtain a user’s session. RLS limits the token to that account, but the attacker could read or mutate that user’s budget data.
- **Recommended fix:** Before higher-risk integrations such as bank sync, decide whether to retain this consumer-PWA tradeoff, use in-memory sessions, or introduce an HttpOnly-cookie backend-for-frontend with a complete CSRF design. Test recovery, refresh, multi-tab, revocation, and installed-PWA behavior for any change.
- **Current mitigation:** Strict script CSP, React escaping, no raw HTML sinks found, minimal third-party scripts, short-lived/rotated hosted sessions where configured, RLS, explicit sign-out, and no financial records in Web Storage. The decision is documented in [`security-operations.md`](security-operations.md).
- **False-positive note:** Web Storage persistence is a known Supabase browser behavior, not an accidental hard-coded token. Its severity depends on hosted session settings and the browser threat model.

### BB-SEC-002 — Style CSP permits inline style attributes

- **Severity:** Low
- **Location:** [`vercel.json:20-21`](../vercel.json#L20), [`AnnualFlowBarChart.tsx:83`](../src/components/AnnualFlowBarChart.tsx#L83), [`Dashboard.tsx:383`](../src/components/Dashboard.tsx#L383)
- **Evidence:** `style-src 'self' 'unsafe-inline'` is enabled. React uses inline style attributes for calculated chart width and a constant icon font-variation setting.
- **Impact:** This weakens CSP’s defense against an otherwise reachable style-injection flaw. It does not enable inline JavaScript because `script-src` remains strict, but malicious CSS can obscure controls or support user-interface deception.
- **Recommended fix:** Replace the icon style with a stylesheet class and render the dynamic bar with an SVG presentation attribute or another reviewed mechanism that does not require inline CSS. Test a `style-src 'self'` policy in report-only mode, then enforce it.
- **Current mitigation:** No attacker-controlled style sink was identified; the values are calculated or constant, scripts disallow `unsafe-inline`/`unsafe-eval`, framing is denied, and React escapes normal content.
- **False-positive note:** The current inline values are not themselves vulnerable. The finding concerns defense-in-depth policy breadth.

### BB-SEC-003 — Turnstile executes privileged third-party JavaScript

- **Severity:** Medium
- **Location:** [`src/components/Turnstile.tsx:24-59`](../src/components/Turnstile.tsx#L24), [`vercel.json:20-21`](../vercel.json#L20)
- **Evidence:** The application dynamically loads Cloudflare’s Turnstile API from a constant HTTPS URL. CSP grants that origin script and frame privileges. The provider script is not SRI-pinned because Turnstile is a dynamically served verification integration.
- **Impact:** A provider compromise, account/widget misconfiguration, or availability failure can affect authentication flows; third-party JavaScript executes with the application origin’s DOM privileges.
- **Recommended fix:** Keep Turnstile as the only required third-party runtime script, restrict production widget hostnames, protect the Cloudflare account with MFA, use separate staging/production keys, monitor provider notices, and review data processing/retention. Reassess alternative abuse controls if risk or availability becomes unacceptable.
- **Current mitigation:** Exact constant script URL, narrow CSP origins, no tag manager or replay tool, token invalidation on error/expiry, and server-side verification when configured in Supabase.
- **False-positive note:** SRI is generally incompatible with the provider’s dynamically served API; omitting SRI is an accepted integration constraint, not evidence that arbitrary script URLs are allowed.

### BB-SEC-004 — Critical Auth and deletion controls depend on hosted configuration

- **Severity:** Medium
- **Location:** [`LoginScreen.tsx:16`](../src/components/LoginScreen.tsx#L16), [`:80-105`](../src/components/LoginScreen.tsx#L80), [`delete-account/index.ts:9-17`](../supabase/functions/delete-account/index.ts#L9), [`:77-122`](../supabase/functions/delete-account/index.ts#L77)
- **Evidence:** The frontend requires a challenge only when a public site key is present. Supabase must separately hold the Turnstile secret and enforce Auth rate limits. The deletion function reads its exact origin allowlist and privileged keys from runtime secrets; `captchaToken` is structurally optional because enforcement belongs to hosted Auth configuration.
- **Impact:** A production environment with missing Turnstile, permissive redirects/rate limits, wrong Preview variables, weak admin protection, or an undeployed origin allowlist would not match the repository’s intended security posture. Missing deletion secrets fail closed but make deletion unavailable.
- **Recommended fix:** Treat the hosted-service checklist and staging smoke tests as release blockers. Capture private dated evidence of Supabase Auth/Turnstile/rate-limit/redirect settings, exact Edge Function origins, environment separation, administrator MFA, SMTP, Sentry scrubbing, and runtime headers.
- **Current mitigation:** Missing frontend Turnstile is visible in configuration, deletion defaults to localhost-only origins, bearer validation and password reauthentication remain mandatory, and deployment steps are documented in [`production-runbook.md`](production-runbook.md) and [`security-operations.md`](security-operations.md).
- **False-positive note:** Repository review cannot observe hosted provider settings; a correctly configured production project may already satisfy every requirement.

### BB-SEC-005 — CSP network allowlist uses provider wildcards

- **Severity:** Low
- **Location:** [`vercel.json:20-21`](../vercel.json#L20)
- **Evidence:** `connect-src` permits any `*.supabase.co` project and regional Sentry ingestion domains because one static Vercel file serves multiple environments.
- **Impact:** If attacker-controlled code were already executing, the broader network allowlist could offer an allowed exfiltration destination. It does not create script execution on its own and browser bearer tokens are still scoped to the configured Supabase project.
- **Recommended fix:** Generate environment-specific CSP headers with the exact Supabase project and Sentry ingestion origins, or separate environment deployment configuration, then verify Preview and Production independently.
- **Current mitigation:** `script-src` is restricted, no raw injection sink was identified, Turnstile is the only allowed third-party script, and monitoring payloads are scrubbed.
- **False-positive note:** Wildcards are an operational convenience rather than evidence of a current data leak.

### BB-SEC-006 — User-authored database text had no server-side length limit

- **Severity:** Medium before remediation
- **Status:** Remediated in this review; the migration must still pass staging and production preflight validation.
- **Location:** [`20260723001000_add_financial_text_length_limits.sql`](../supabase/migrations/20260723001000_add_financial_text_length_limits.sql), [`transaction.ts`](../src/types/transaction.ts), and [`rls_policies.test.sql`](../supabase/tests/rls_policies.test.sql)
- **Evidence:** Database checks now enforce nonblank descriptions of 1–200 characters, notes up to 2,000 characters, and nonblank transaction/subcategory labels up to 60 characters. Shared UI/storage validation uses the same constants, and pgTAP includes exact-boundary and rejection cases.
- **Remaining action:** Run the documented legacy-data audit before migration, execute the 60-assertion pgTAP suite in staging, and consider account-level quotas or abuse response before unrestricted signup.

### BB-SEC-007 — Retention, deletion reconciliation, and incident duties remain operator controls

- **Severity:** Low operational risk; may become higher depending on launch promises and jurisdiction
- **Location:** [`docs/data-retention.md`](data-retention.md), [`docs/incident-response.md`](incident-response.md), [`docs/privacy-and-terms-checklist.md`](privacy-and-terms-checklist.md)
- **Evidence:** Live account deletion cascades owner data, but provider logs and older encrypted backups expire separately. Restoring a pre-deletion backup requires a protected external reconciliation record, which the browser application does not implement. Provider retention, subprocessors, legal text, incident contacts, and notification decisions must be configured outside this repository.
- **Impact:** An ungoverned restore could resurrect deleted records, or public promises could diverge from actual provider behavior.
- **Recommended fix:** Establish a protected deletion-reconciliation process, verify provider retention values, complete qualified privacy/terms review, assign responders, and test restore-plus-reconciliation before accepting public data.
- **Current mitigation:** Hard deletion is reauthenticated, backups are encrypted, retention gaps are documented rather than hidden, and quarterly restore drills are required.
- **False-positive note:** This is an operational launch risk, not a discovered code-execution vulnerability or a conclusion that any law has been violated.

## Required production acceptance evidence

Do not treat this review as a production approval until operators have:

1. Applied migrations and passed pgTAP against separate staging and production-compatible schemas.
2. Passed two-user Auth/RLS/CRUD, recovery, export, deletion, duplicate-request, conflict, offline, accessibility, and PWA-cache checks in staging.
3. Verified the deployed CSP and all security headers at the exact Preview and Production origins.
4. Inspected browser Cache Storage, network requests, a sanitized Sentry event, and public build artifacts for financial data, tokens, and source maps.
5. Enabled GitHub branch rules, private vulnerability reporting, CodeQL, dependency review, secret scanning, push protection, and administrator MFA.
6. Verified encrypted backup freshness and completed an isolated restore plus post-backup deletion-reconciliation drill.
7. Configured and tested private alerting, incident contacts, provider access, SMTP, Turnstile, redirect allowlists, rate limits, and separate environment secrets.
8. Published owner-approved privacy and terms documents that accurately match the implemented and hosted data flows after appropriate professional review.
