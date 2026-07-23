## Summary

Describe the user-visible and operational outcome. Link the issue when one exists.

## Risk and data impact

- Risk level: low / medium / high
- Data or schema change: none / additive / destructive
- Authentication, authorization, privacy, or financial-data impact:
- New third-party service, script, or outbound origin:

## Validation

- [ ] `npm run check`
- [ ] Relevant browser, database, accessibility, and manual tests
- [ ] Screenshots or recordings for user-interface changes
- [ ] No secrets, personal data, production records, or public source maps in the diff or test output

List the exact commands and environments used:

```text
npm run check
```

## Deployment and rollback

Document environment variables, additive migration order, hosted-service configuration, monitoring changes, rollout checks, and the rollback path. Write “not applicable” when none are needed.

## Reviewer checklist

- [ ] Server-side RLS or authorization protects every affected data operation
- [ ] Logs, analytics, caches, screenshots, and errors exclude financial and authentication data
- [ ] New dependencies and GitHub Actions are justified and pinned/reviewed
- [ ] User-facing controls remain keyboard and screen-reader accessible
- [ ] Documentation and `CHANGELOG.md` are updated when behavior or operations changed
