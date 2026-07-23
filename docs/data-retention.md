# Data Retention and Deletion Baseline

This document is an engineering inventory and proposed operating baseline. It is not a published privacy policy and does not claim compliance with any law. The repository owner must align retention with actual provider contracts, user promises, business needs, and qualified legal advice before launch.

## Data inventory

| Data category                       | Primary location              | Current/product retention behavior                                                    | Required external decision                                               |
| ----------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Email, password verifier, Auth IDs  | Supabase Auth                 | Retained while the account exists; Auth user is hard-deleted after reauthentication   | Auth audit-log retention, session expiry, email suppression requirements |
| Transactions and descriptions       | Supabase Postgres             | Retained while the account exists; foreign-key cascade on Auth user deletion          | Maximum inactive-account period and any legally required preservation    |
| Budget preferences/subcategories    | Supabase Postgres             | Same account lifetime and cascade behavior                                            | Same as account data                                                     |
| Locale, currency, timezone          | Supabase Postgres             | Same account lifetime and cascade behavior                                            | Same as account data                                                     |
| Browser authentication session      | Origin Web Storage            | Supabase client persistence until sign-out, expiry/revocation, or site-data removal   | Hosted session lifetime and revocation policy                            |
| Theme and install-prompt preference | Browser local storage         | Until changed or site data is cleared                                                 | Whether user documentation should describe these essential preferences   |
| PWA shell and hashed static assets  | Browser Cache Storage         | Versioned; old BudgetBuddy caches removed on worker activation                        | Validate actual eviction after every worker change                       |
| JSON/CSV export                     | User-selected device/storage  | Generated locally; not retained by BudgetBuddy after download                         | User warning and secure-device guidance                                  |
| Sanitized error events              | Sentry, when enabled          | Provider-controlled; app sends exception events only                                  | Configure and record the shortest useful provider retention              |
| Hosting and security request logs   | Vercel/providers              | Provider-controlled                                                                   | Verify IP/request metadata, access, region, and retention                |
| Turnstile challenge data            | Cloudflare                    | Provider-controlled                                                                   | Verify published terms, retention, and regional processing               |
| Authentication email metadata       | Supabase/SMTP provider        | Provider-controlled                                                                   | Configure message/log retention and suppression-list behavior            |
| Encrypted logical backups           | GitHub Actions/artifact store | Daily workflow artifacts expire after 30 days; monthly archive is an operating target | Implement and verify any 12-month monthly archive separately             |
| CI, deployment, and security logs   | GitHub/Vercel/Supabase        | Provider/repository-controlled                                                        | Set minimum useful retention and restrict access                         |

The application intentionally does not persist financial records in local storage, IndexedDB, service-worker caches, Sentry, Vercel application storage, or background sync.

## Account deletion behavior

The live deletion path requires an authenticated session, exact email confirmation, and password reauthentication. The Edge Function deletes the Supabase Auth user using a server-only service-role client; foreign-key cascades remove the four owner-scoped live tables.

Deletion is irreversible in the live application. It does not instantly erase:

- Previously downloaded user exports
- Provider security/audit logs
- Authentication-email provider records
- Sanitized error events already accepted by Sentry
- Encrypted backups created before deletion

Those copies expire or are removed under their separate retention controls. User-facing wording must describe this distinction accurately without implying immediate erasure from immutable security logs or backups.

## Backup restoration and deleted accounts

A backup predating an account deletion can contain rows that were later deleted. Before a restored database is opened to users, operators must reconcile every post-backup deletion and other authoritative state change.

Maintain the minimum necessary deletion-reconciliation record in a separate protected system with restricted access and its own retention decision. Do not put plaintext email or financial data in backup filenames, workflow logs, or tickets. The current application does not implement this external reconciliation ledger, so production restoration must remain blocked until operators can prove deleted accounts will not be unintentionally resurrected.

## Retention operations

- Assign an owner for each provider and record the configured retention value and verification date in a private control register.
- Review the inventory quarterly and whenever a vendor, data field, telemetry source, export, or account workflow changes.
- Restrict access to production records, logs, and encrypted artifacts using least privilege and MFA.
- Alert on backup expiry/failure, unexpected log growth, or provider-setting drift.
- Securely destroy temporary plaintext restore files immediately after a drill.
- Test live account deletion and backup-deletion reconciliation in staging before each release that changes identity or ownership behavior.
- Do not retain data indefinitely merely because provider defaults allow it.

## Inactive and abandoned accounts

No automatic inactive-account deletion is currently implemented. Before introducing it, define and publish the inactivity period, advance notice, export opportunity, exceptions, restoration window, and treatment of bounced emails. Implement the policy server-side with audited, idempotent jobs rather than relying on a browser visit.

## Legal hold and disputes

No legal-hold workflow is implemented. Do not silently override a user-facing deletion promise. If a legitimate preservation obligation may apply, obtain qualified legal advice and document the narrowly scoped authority, access, duration, and eventual deletion outside the public repository.
