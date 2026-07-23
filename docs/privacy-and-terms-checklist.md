# Privacy and Terms Launch Checklist

This is a product and engineering checklist, not legal advice and not a privacy policy or terms of service. Do not publish it as a claim of compliance. The owner should obtain qualified review for the launch jurisdictions and ensure the final documents match actual code, provider settings, and operations.

## Current third-party service inventory

Verify contracts, regions, security settings, retention, deletion, incident terms, and subprocessors for every enabled service.

| Service                        | Purpose                                  | Data that may be processed                                                       | Launch review                                                                            |
| ------------------------------ | ---------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Supabase                       | Auth, database, PostgREST, Edge Function | Email, Auth/session metadata, user IDs, settings, budget and transaction records | Project region, DPA/terms, Auth logs, backups, RLS, deletion, support, subprocessors     |
| Vercel                         | Static hosting and deployments           | IP/request metadata, browser/device headers, deployment logs, public application | Log retention, regions, access, Preview isolation, incident terms, subprocessors         |
| Cloudflare Turnstile           | Authentication abuse prevention          | Challenge, IP/browser/network signals, site/action metadata                      | Hostname restrictions, privacy terms, retention, regions, accessibility, fallback        |
| Sentry, optional               | Sanitized error monitoring               | Generic exception/stack/build metadata after client scrubbing                    | No PII/replay/tracing, retention, access, source maps, sampling, deletion, subprocessors |
| Verified SMTP provider         | Confirmation and recovery email          | Recipient email, delivery/security metadata, message template                    | SPF/DKIM/DMARC, logs, suppression lists, retention, access, incident terms               |
| GitHub and GitHub Actions      | Source, CI, security scans, backups      | Code, workflow metadata, encrypted backup artifacts, scoped secrets              | Access, Actions retention, encryption, secret scanning, subprocessors, incident terms    |
| Independent uptime/status tool | Availability and TLS monitoring          | Public URL, response metadata, incident history                                  | Select provider; exclude authenticated/financial payloads and define retention           |

Inter and Material Symbols are bundled npm dependencies, not runtime font services. Maintain their license notices in `THIRD_PARTY_NOTICES.md` and verify the production page makes no font-CDN request.

Remove a service from the published list when it is genuinely disabled and no longer processes retained data. Add any analytics, support, status, domain, email, or monitoring provider before enabling it.

## Privacy notice content

- [ ] Identify the accountable operator and working privacy/security contact.
- [ ] Describe collected data by category: identity, authentication/security metadata, regional settings, budget preferences, subcategories, transactions, support messages, and optional sanitized errors.
- [ ] Explain purposes separately: provide the service, secure accounts, prevent abuse, recover accounts, operate backups, diagnose failures, and communicate essential service messages.
- [ ] Determine an appropriate legal basis for each purpose with qualified counsel; do not copy another product’s wording.
- [ ] Explain direct collection from the user and automatic collection by hosting, Auth, Turnstile, SMTP, monitoring, and uptime providers.
- [ ] List actual processors/subprocessors or provide an accurate maintained link, including international transfer mechanisms when relevant.
- [ ] State retention periods or decision criteria consistent with `data-retention.md`, including delayed backup/log expiry after account deletion.
- [ ] Explain JSON/CSV export, account deletion, correction through the product, and a verified request channel for rights not implemented in-app.
- [ ] Explain browser Web Storage for the Auth session, local preferences, and the PWA app-shell cache. Do not describe financial data as available offline.
- [ ] Explain optional Sentry behavior and confirm no session replay or behavioral advertising analytics are enabled.
- [ ] Address children/age eligibility based on launch jurisdictions and actual product controls.
- [ ] State security limitations honestly: encryption and controls reduce risk but no service can guarantee absolute security.
- [ ] Define material-change notice and effective-date/version history.

## Terms of service content

- [ ] Identify the operator, effective date, eligibility, and how the user accepts the terms.
- [ ] Describe BudgetBuddy as a budgeting and record-keeping tool, not banking, investment, tax, accounting, or other professional advice.
- [ ] State user responsibility for account credentials, accurate inputs, secure exports, and authorized use.
- [ ] Prohibit abuse, unlawful access, automated credential attacks, service disruption, malware, and attempts to access another account.
- [ ] Describe service availability, beta changes, maintenance, third-party dependencies, exports, and irreversible account deletion accurately.
- [ ] Define acceptable suspension/termination behavior and what happens to data, backups, and exports.
- [ ] Resolve repository and product intellectual-property/licensing terms; no open-source license is currently included.
- [ ] Have qualified counsel review warranty, liability, indemnity, dispute, governing-law, and venue language for the actual operator and jurisdictions.
- [ ] Provide support and security reporting paths that remain available during an outage.

## Product and consent checks

- [ ] Link the final privacy notice and terms before account creation and from Account Settings/footer.
- [ ] Record policy versions and acceptance only if counsel determines affirmative acceptance is required; minimize the stored evidence.
- [ ] Keep authentication and deletion usable when optional monitoring is disabled.
- [ ] Ensure Turnstile has an accessible failure/retry path and does not become an undisclosed advertising tracker.
- [ ] Present export and deletion consequences in plain language, with exact email/password confirmation for destructive action.
- [ ] Warn that downloaded exports contain sensitive data and are outside BudgetBuddy’s control.
- [ ] Confirm support processes authenticate requesters without asking them to email passwords, tokens, or full financial exports.

## Pre-publication evidence

- [ ] Capture dated screenshots or exports of provider retention, PII/replay, MFA, hostname, redirect, rate-limit, and environment-separation settings in a private control register.
- [ ] Run a data-flow review against the production bundle, network inspector, service-worker caches, Sentry test event, Vercel headers, and Supabase logs.
- [ ] Reconcile the published processor list with CSP origins, DNS, environment variables, package dependencies, and billing accounts.
- [ ] Test export, correction, password recovery, sign-out, session revocation, and account deletion with staging users.
- [ ] Approve an incident contact and deletion/rights request procedure before collecting public-user data.
- [ ] Set a quarterly review date and an owner for updating user-facing documents when implementation or vendors change.
