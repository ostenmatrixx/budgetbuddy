# Incident Response Plan

This operational plan covers suspected confidentiality, integrity, availability, authentication, supply-chain, and privacy incidents affecting BudgetBuddy. It does not determine legal notification duties. The incident lead must obtain qualified legal and regulatory advice based on affected people and jurisdictions.

## Preparation

Before launch, maintain a private responder roster with a primary and backup for incident lead, engineering, Supabase/data, communications, and legal/privacy review. Keep provider support contacts, project identifiers, recovery codes, rotation procedures, and an out-of-band communication channel in an access-controlled system—not in this repository.

Quarterly, verify alert delivery, administrator MFA, private vulnerability reporting, session/key revocation steps, backup freshness, and access to a clean recovery workstation. Run at least one tabletop exercise and one restore drill per year.

## Severity guide

| Severity | Examples                                                                                         | Initial posture                               |
| -------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| SEV-0    | Active cross-account access, service-role/database credential theft, destructive compromise      | Immediate containment and continuous response |
| SEV-1    | Confirmed user-data exposure, auth bypass, malicious production deployment, unavailable deletion | Respond immediately; consider stopping writes |
| SEV-2    | Limited security weakness with no confirmed access, sustained outage, failed backup schedule     | Same-day triage and owner assignment          |
| SEV-3    | Low-impact weakness, isolated provider degradation, policy or monitoring gap                     | Track and remediate through normal priority   |

Severity may increase as evidence changes. Do not delay containment while trying to calculate an exact record count.

## Response process

### 1. Receive and stabilize

- Open a private incident record with a timestamp, reporter, affected environments, and a randomly assigned incident ID.
- Assign an incident lead and one person to maintain the event timeline.
- Move discussion to the private out-of-band channel if GitHub, email, or the production identity system may be compromised.
- Preserve relevant provider event IDs, deployment IDs, audit logs, workflow runs, and timestamps without copying secrets or full financial records.

### 2. Triage

Determine:

- Whether the event is ongoing and which trust boundary failed
- Environments, releases, accounts, tables, functions, providers, and time windows affected
- Whether confidentiality, integrity, availability, authentication, or deletion obligations are involved
- Whether an attacker gained a user token, administrator access, service-role access, database access, or source-map/build access
- The smallest safe containment action and its user impact

Use queries against isolated log copies or provider consoles. Never restore production into a developer machine or paste query output into a public issue.

### 3. Contain

Choose reversible, scoped controls when possible:

- Roll back or disable the affected frontend entry point
- Restrict exact origins, revoke sessions, rotate keys, or disable a compromised integration
- Pause account creation, writes, exports, or deletion only when the risk of leaving them enabled is greater and an incident owner records the decision
- Block a malicious dependency or workflow and invalidate its credentials
- Preserve encrypted backups before risky remediation, without overwriting healthy artifacts

Deleting a leaked secret from Git history is not containment. Rotate or revoke it first at its source.

### 4. Eradicate and recover

- Fix the root cause with peer review and a regression test.
- Rebuild from a reviewed commit and trusted dependency lockfile.
- Apply additive database fixes; avoid an untested destructive rollback.
- Restore only into an isolated environment first, verify checksums, then run RLS, Auth, export, deletion, and row-count checks.
- Reconcile transactions, account deletions, and other state changes that occurred after the restored backup before reopening service.
- Verify headers, CSP, service-worker caches, Sentry scrubbing, and exact environment configuration after deployment.
- Increase observation until error, Auth, database, Edge Function, and availability signals return to a reviewed baseline.

### 5. Communicate

- Give responders factual, timestamped updates that distinguish confirmed facts from hypotheses.
- Coordinate user, provider, insurer, law-enforcement, or regulator communication with qualified counsel when applicable.
- Do not speculate about attribution or affected record counts.
- Do not include passwords, tokens, financial details, or exploit instructions in broad communications.
- Keep an external status update available if the app is down, while avoiding details that enable exploitation.

### 6. Close and learn

Within a reasonable period after stabilization, produce a blameless private review covering timeline, scope, root cause, detection, containment, user impact, data reconciliation, and control failures. Create owners and dates for every corrective action. Add a sanitized public summary only when it is safe and appropriate.

## Scenario playbooks

### Exposed frontend public key

Supabase anon/publishable keys, Turnstile site keys, and Sentry DSNs are public identifiers, not secrets. Confirm the key is the intended scoped public value, check for abuse and RLS failures, and rotate only if provider guidance or observed abuse warrants it. A service-role key, Turnstile secret, database URL, SMTP credential, Sentry auth token, or session token is a credential incident.

### Privileged credential or administrator compromise

1. Revoke/rotate through a known-clean administrator session.
2. Remove unauthorized sessions, tokens, users, apps, webhooks, and deploy keys.
3. Inspect changes to RLS, migrations, Edge Functions, redirects, SMTP, Turnstile, Vercel variables, workflows, branch rules, and releases.
4. Rebuild and redeploy from a reviewed commit; verify owner isolation with two staging users.

### Suspected cross-account data access

1. Treat as SEV-0 until disproven and preserve Postgres/Auth/Edge Function evidence.
2. Stop the affected data path or writes if that reduces ongoing exposure.
3. Test the exact policy with two isolated accounts and the pgTAP suite.
4. Determine affected account IDs and fields in a restricted environment; avoid exporting unrelated rows.
5. Patch server-side RLS/authorization before changing client presentation.

### Malicious dependency, Action, or deployment

1. Disable the workflow/deployment and revoke every token it could access.
2. Compare the resolved action/dependency commit to the reviewed SHA and lockfile.
3. Inspect artifact, package, and provider audit logs for outbound access.
4. Rebuild on a clean runner with reviewed pinned actions and `npm ci`.

### Data loss or corruption

1. Stop the source of writes and preserve the latest healthy encrypted backup.
2. Determine the corruption window and post-backup legitimate changes.
3. Follow `backup-and-restore.md` in an isolated project.
4. Reconcile post-backup changes and deletion requests before production use.

### Unsafe service-worker cache

1. Confirm cache names and entries without collecting user data.
2. Publish a new service-worker version that removes unsafe caches and waits for explicit activation.
3. Verify no Supabase, Auth, export, or financial response remains cached.
4. Tell affected users how to update or clear site data if automatic cleanup cannot be guaranteed.
