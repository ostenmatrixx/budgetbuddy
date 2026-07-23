# BudgetBuddy Production Runbook

This runbook covers the staging-to-production process for the Vercel + Supabase deployment. Keep staging and production in separate Supabase projects. Never put a service-role key or SMTP credential in Vercel client environment variables or in this repository.

## Environment ownership

| Setting                         | Preview / staging                 | Production              |
| ------------------------------- | --------------------------------- | ----------------------- |
| `VITE_SUPABASE_URL`             | Staging project URL               | Production project URL  |
| `VITE_SUPABASE_ANON_KEY`        | Staging public key                | Production public key   |
| `VITE_TURNSTILE_SITE_KEY`       | Turnstile staging/test site key   | Production site key     |
| `VITE_SENTRY_DSN`               | Optional staging DSN              | Production browser DSN  |
| Edge Function `ALLOWED_ORIGINS` | Exact preview and staging origins | Exact production origin |

Supabase supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` to deployed Edge Functions. Do not create browser-exposed copies of them.

## One-time hosted service configuration

1. In each Supabase project, set the Auth site URL to that environment's canonical HTTPS origin.
2. Add only exact, trusted recovery/confirmation redirect URLs. Include localhost only in the local project, not production.
3. Enable mandatory email confirmation and secure password changes.
4. Configure a verified-domain SMTP provider. Test signup, confirmation, recovery, and resend messages before launch.
5. Configure Cloudflare Turnstile in Supabase Auth with the secret key. Put only the matching public site key in Vercel.
6. Enable MFA for every Supabase organization administrator, enforce SSL connections, review leaked-password protection, and set conservative Auth email and sign-in rate limits.
7. Configure Vercel Preview variables to staging and Production variables to production. Never allow a Preview deployment to use the production database.
8. If Sentry is enabled, disable default PII and session replay. Confirm that events contain no email, user ID, transaction details, request bodies, or auth headers.

## Database and Edge Function deployment

Before applying the text-limit migration, audit both staging and production for legacy rows that would fail validation:

```sql
select
  count(*) filter (where char_length(description) > 200 or btrim(description) = '') as invalid_descriptions,
  count(*) filter (where char_length(notes) > 2000) as invalid_notes,
  count(*) filter (
    where subcategory is not null
      and (char_length(subcategory) > 60 or btrim(subcategory) = '')
  ) as invalid_transaction_subcategories
from public.transactions;

select count(*) as invalid_subcategory_names
from public.transaction_subcategories
where char_length(name) > 60 or btrim(name) = '';
```

All counts must be zero. If they are not, stop the promotion, export the affected rows, and use an owner-approved remediation plan; never silently truncate financial records in a migration.

Run from a trusted administrator workstation or protected CI environment:

```bash
supabase link --project-ref YOUR_STAGING_PROJECT_REF
supabase db push --linked
supabase secrets set ALLOWED_ORIGINS=https://staging.example.com
supabase functions deploy delete-account --project-ref YOUR_STAGING_PROJECT_REF
supabase test db --linked
```

Use a comma-separated `ALLOWED_ORIGINS` value only when an environment has multiple exact trusted origins. Do not use `*`.

## Automated release gates

- `CI` runs the reproducible Node 24 audit, formatting, lint, unit, production build, mocked-Supabase browser/axe checks, static-only PWA cache check, and Lighthouse thresholds on every pull request.
- `Staging validation` runs nightly and on demand. Configure `SUPABASE_STAGING_DB_URL`, the three `VITE_STAGING_*` values, and dedicated `STAGING_USER_EMAIL` / `STAGING_USER_PASSWORD` repository secrets. Use Cloudflare's non-production Turnstile test key for this isolated staging user.
- `Preview release gate` is a manual pre-promotion check. Pass the exact Vercel Preview URL; configure `VERCEL_AUTOMATION_BYPASS_SECRET` only when Preview Protection is enabled.
- `Encrypted production backup` runs daily using `PRODUCTION_DATABASE_URL` and `BACKUP_ENCRYPTION_PASSPHRASE`. Keep the passphrase offline as well as in the scheduler secret store, and rotate it under a documented recovery procedure.

Require the CI, latest staging validation, and preview release gate checks before promoting a production frontend. GitHub Actions artifacts from the backup workflow contain only encrypted archives and checksums.

## Release order

1. Apply all additive migrations to staging.
2. Deploy `delete-account` to staging and set its origin allowlist.
3. Complete the hosted Auth, SMTP, Turnstile, rate-limit, and redirect configuration.
4. Deploy the frontend to Vercel Preview against staging.
5. Run unit, browser, pgTAP, recovery, export, and deletion smoke tests.
6. Create and verify a production encrypted backup as described in `backup-and-restore.md`.
7. Apply the same migrations and Edge Function to production.
8. Promote the tested frontend build to production.
9. Verify response headers, CSP, sign-in, one owner-scoped transaction, JSON/CSV export, and logout in production.

## Required staging smoke tests

- Signup requires Turnstile, sends confirmation through custom SMTP, and does not create a session before confirmation.
- Resend confirmation and forgot-password requests show non-enumerating success messages.
- A recovery link opens the new-password screen; a 10-character password including leading/trailing spaces is preserved exactly.
- Two test users cannot read, update, or delete one another's four owner-scoped tables.
- Repeating a transaction request ID returns one logical transaction.
- Currency, locale, and timezone settings survive a new session and Manila's date boundary is correct.
- JSON contains schema version 1 and all account-owned rows; CSV escapes quotes/newlines and neutralizes spreadsheet formulas.
- Account deletion fails for a mismatched email or password and succeeds only for the signed-in user. All owned rows cascade-delete.
- Service-worker caches and Sentry events contain no Supabase responses, credentials, emails, or financial values.

## Incident and rollback notes

- Frontend regression: roll Vercel back to the last healthy deployment. Additive database columns remain compatible.
- Edge Function regression: redeploy the last known-good function bundle or remove the account deletion entry point until repaired.
- Suspected key exposure: rotate the affected key immediately, update the owning service, invalidate sessions where appropriate, and review Supabase/Vercel logs. Never paste keys into an issue or chat.
- Data incident: stop writes if needed, preserve audit evidence, and follow the tested restore procedure. Do not restore an unverified or unencrypted artifact.
