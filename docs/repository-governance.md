# Repository Governance and Releases

This runbook lists GitHub controls that must be enabled outside the repository. Checked-in workflows and `CODEOWNERS` do not enforce repository settings by themselves.

## Default branch protection

Create a ruleset targeting `main` and enable it for administrators as well as contributors:

- Require pull requests and at least one approving review
- Dismiss stale approvals when new commits are pushed
- Require review from Code Owners
- Require conversation resolution
- Require branches to be up to date before merge, unless GitHub merge queue is enabled
- Require successful `CI`, `CodeQL`, and `Dependency review` checks plus the applicable staging/release gates
- Block force pushes, branch deletion, and direct pushes
- Require signed commits only if every maintainer and automation identity has a tested signing path
- Restrict bypass permission to an emergency administrator group and review every bypass after use

Use the merge queue if contribution volume makes repeated rebases disruptive. Do not permit a failing security check to be bypassed merely to meet a release date.

## Repository security settings

In **Settings → Security**:

1. Enable the dependency graph, Dependabot alerts, and Dependabot security updates.
2. Enable code scanning with the checked-in advanced CodeQL workflow. Avoid enabling a duplicate default setup.
3. Enable secret scanning and push protection, including validity checks where GitHub supports the secret type.
4. Enable private vulnerability reporting and confirm the link in `SECURITY.md` opens a private advisory draft.
5. Enable automated security fixes only after deciding how lockfile changes are reviewed and staged.
6. Require organization or account MFA, remove dormant collaborators, and review deploy keys, webhooks, GitHub Apps, environments, and personal access tokens quarterly.

If a secret-scanning alert fires, treat the value as compromised even when the commit is deleted. Rotate it at the owning service, invalidate affected sessions or tokens, then remove it from history only after containment. Never paste the value into an issue.

## Actions security

- Keep the default `GITHUB_TOKEN` permission read-only and grant job-specific writes explicitly.
- Pin third-party and official actions to reviewed full commit SHAs. Dependabot may propose SHA updates; verify the corresponding upstream release before merging.
- Require approval for workflows from first-time contributors and do not expose repository secrets to fork pull requests.
- Scope staging and production secrets to separate GitHub Environments. Production deployment should require owner approval and use only protected branches/tags.
- Review workflow logs and artifacts for accidental personal, financial, or secret data. The backup workflow may upload only encrypted dumps and checksums.
- Retain workflow artifacts for the minimum operational period and expire unneeded logs under repository settings.

## Release and version policy

BudgetBuddy follows Semantic Versioning after tags begin:

- Patch: backwards-compatible fixes and security patches
- Minor: backwards-compatible features; before `1.0.0`, may include clearly documented breaking beta changes
- Major: incompatible public behavior or migration requirements after `1.0.0`

Use annotated `vMAJOR.MINOR.PATCH` tags. Every release should identify the exact commit, migration range, Edge Function version, hosted-service changes, known risks, rollback path, and verification results.

### Release checklist

1. Confirm the changelog and version are accurate and the working tree contains no generated secrets or public source maps.
2. Require green CI, CodeQL, dependency review, latest staging validation, and preview release gate.
3. Verify the staging deployment uses staging-only credentials and passes auth, owner-isolation, CRUD, export, deletion, accessibility, header, PWA-cache, and telemetry checks.
4. Create and verify an encrypted production backup before database or function changes.
5. Follow the additive release order in `production-runbook.md`.
6. Create the annotated tag from the reviewed commit and publish GitHub release notes from `CHANGELOG.md`.
7. Record production deployment identifiers and complete post-deploy checks.
8. Watch error, availability, database, Auth, Edge Function, and backup signals through the heightened observation window defined for the release.

Do not reuse or move a published release tag. If a release is bad, roll back the frontend where safe and publish a new patch version. Database reversal requires a reviewed forward-fix or explicit restore/migration plan rather than an untested destructive rollback.

## Review cadence

| Control                      | Minimum review cadence            |
| ---------------------------- | --------------------------------- |
| Collaborators and admin MFA  | Quarterly and after role changes  |
| Branch rules and bypasses    | Quarterly and after any bypass    |
| Actions and installed Apps   | Monthly                           |
| Dependabot and CodeQL alerts | On alert; summarize weekly        |
| CODEOWNERS accuracy          | When ownership changes            |
| Release and rollback drill   | Before each release; drill yearly |
| Security reporting path      | Quarterly                         |
