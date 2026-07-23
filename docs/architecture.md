# BudgetBuddy Architecture

## Purpose and scope

BudgetBuddy is a client-rendered personal finance PWA for a public multi-user beta. Vercel serves the static React application; Supabase provides authentication, Postgres/PostgREST, Row Level Security, and the privileged account-deletion Edge Function. No application server runs on Vercel.

This document describes the implemented trust boundaries. It is not a claim of compliance or a substitute for a threat model before materially expanding the product.

## System context

| Component                   | Responsibility                                                                     | Trust level and secrets                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| React/Vite browser app      | Authentication UI, dashboard, validation, exports, PWA state, settings             | Untrusted client; receives only public Supabase, Turnstile, and optional Sentry config  |
| Vercel                      | Static asset delivery, deployment environments, response headers                   | Holds build configuration and optional source-map upload credentials                    |
| Supabase Auth               | Identity, confirmation, recovery, access/refresh tokens, password reauthentication | Hosted identity boundary                                                                |
| Supabase Postgres/PostgREST | Owner-scoped settings, budget preferences, subcategories, and transactions         | RLS is the primary data-authorization boundary                                          |
| `delete-account` function   | Origin validation, password reauthentication, hard deletion through the Admin API  | Privileged server boundary; service-role key is available only in the function runtime  |
| Cloudflare Turnstile        | Bot challenge on authentication flows                                              | Third-party browser script and hosted verification service                              |
| Sentry                      | Optional, production-only sanitized error events and private source maps           | Third-party monitoring; no replay, tracing, default PII, request bodies, or domain data |
| SMTP provider               | Confirmation, recovery, and security email delivery                                | Processes recipient email and authentication-message metadata                           |
| GitHub Actions              | Quality gates, staging validation, scanning, and encrypted backup scheduling       | Uses scoped repository secrets; artifacts must never contain plaintext production data  |

## Runtime data flows

### Authentication

1. The browser loads the static application and sends credentials directly to Supabase Auth over HTTPS.
2. Cloudflare Turnstile produces a challenge token for configured authentication operations. Supabase validates it using the server-side secret configured in the hosted project.
3. Supabase returns a bearer session. The default Supabase browser client persists that session in origin-scoped Web Storage so reloads and PWA restarts remain signed in.
4. The browser attaches the bearer token to PostgREST and Edge Function requests. The user interface is not an authorization boundary.

The persisted-session threat tradeoff and alternatives are recorded in [`security-operations.md`](security-operations.md).

### Owner-scoped financial data

1. The browser queries Supabase directly with the authenticated user’s bearer token.
2. RLS policies on `transactions`, `budget_preferences`, `transaction_subcategories`, and `user_settings` constrain reads and writes to `auth.uid()`.
3. Ownership columns are immutable through policy and database constraints. Transaction creation uses a per-modal UUID and a unique `(user_id, client_request_id)` constraint for retry idempotency.
4. Financial records remain in React memory while loaded. The service worker does not intercept or cache cross-origin Supabase traffic.

### Export

1. The authenticated browser performs fresh, owner-scoped, paginated reads.
2. It creates versioned JSON or RFC-4180 CSV locally and starts a browser download.
3. The application does not upload the generated export to Vercel or retain it server-side. The downloaded file becomes the user’s responsibility and may contain sensitive financial data.

### Account deletion

1. The signed-in user enters an exact email confirmation and current password.
2. The browser calls the authenticated `delete-account` Edge Function from an allowlisted origin.
3. The function validates the bearer session, email, and password, then uses the server-only service-role client to delete that Auth user.
4. Foreign-key cascades remove live owner-scoped records. Provider logs and encrypted backups age out under their separate retention controls; see [`data-retention.md`](data-retention.md).

### PWA and monitoring

- The service worker caches only the app shell and hashed same-origin static assets. Navigation is network-first and falls back to the shell or dedicated offline page.
- Writes are disabled while the browser reports it is offline. There is no background sync or persistent offline financial store.
- A waiting service worker activates only after an explicit update action.
- Sentry initialization is optional and production-only. The client removes request, user, context, tag, message, breadcrumb, and domain-specific exception content before an error event is sent.

## Data model

| Table                       | Ownership             | Important guarantees                                              |
| --------------------------- | --------------------- | ----------------------------------------------------------------- |
| `transactions`              | `user_id` → Auth user | Owner RLS, ownership immutability, idempotent client request ID   |
| `budget_preferences`        | `user_id` → Auth user | One owner preference and constrained target allocation            |
| `transaction_subcategories` | `user_id` → Auth user | Owner RLS; archival preserves historical transaction labels       |
| `user_settings`             | `user_id` → Auth user | Owner RLS; constrained currency, locale, and IANA timezone values |

Database migrations and pgTAP policy tests live under `supabase/`. The typed browser client contract in `src/types/database.ts` must be regenerated or reviewed whenever a migration changes the exposed schema.

## Environment isolation

- Vercel Preview must use only staging Supabase, Turnstile, and monitoring configuration.
- Vercel Production must use only production configuration.
- Local development uses local Supabase or a dedicated non-production project.
- Production data, service-role keys, database URLs, SMTP credentials, and source-map upload credentials must never enter pull-request jobs or browser bundles.
- Hosted origin allowlists must use exact HTTPS origins. Wildcards are not accepted for the deletion function.

## Availability and recovery boundaries

- A Vercel outage can prevent loading the app but does not remove Supabase data.
- A Supabase outage prevents authentication and fresh reads/writes; already-rendered in-memory data remains visible until refresh.
- Inter and Material Symbols are bundled into the application build, avoiding a runtime font-CDN dependency. A failed font asset still falls back to system fonts where configured.
- Frontend rollback uses a previous Vercel deployment. Additive database changes remain compatible during rollback.
- Encrypted logical backups and quarterly restore drills cover database recovery. Auth and hosted-service configuration require separate recovery documentation and validation.

## Deliberate non-goals

- No bank synchronization, receipt ingestion, persistent offline financial storage, or background mutation queue
- No frontend-only permission model
- No service-role credentials in Vercel or the browser
- No session replay or financial analytics telemetry
- No claim that provider configuration is correct until the runtime checks in the production runbook pass
