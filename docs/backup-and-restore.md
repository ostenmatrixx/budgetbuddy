# Encrypted Backup and Restore

Supabase free-tier projects need an independent logical-backup routine. Run `supabase/scripts/create-encrypted-backup.sh` daily from a trusted scheduled runner. Store only its encrypted `.tar.gz.enc` output and checksum in remote artifact storage.

The checked-in `Encrypted production backup` GitHub Actions workflow performs this schedule with a 30-day encrypted-artifact retention window. Configure `PRODUCTION_DATABASE_URL` and `BACKUP_ENCRYPTION_PASSPHRASE` as repository secrets; never use a public Actions variable for either value.

## Backup runner

Install the Supabase CLI, OpenSSL, and `tar`, then provide secrets through the runner's encrypted secret store:

```bash
export BUDGETBUDDY_DATABASE_URL='postgresql://...'
export BUDGETBUDDY_BACKUP_PASSPHRASE='a-long-random-passphrase'
bash supabase/scripts/create-encrypted-backup.sh /protected/artifacts
```

The script creates schema, data, and role dumps in a private temporary directory; packages them; encrypts with AES-256-CBC and PBKDF2; removes plaintext temporary files; and writes a SHA-256 checksum. It never prints either secret.

- Keep the decryption passphrase offline and separate from the artifacts.
- Retain daily backups for 30 days and one monthly backup for 12 months, subject to your privacy policy.
- Alert when the schedule fails, the encrypted artifact is empty, or the checksum is missing.
- Do not upload `.sql`, `.tar.gz`, environment files, or database URLs.

## Quarterly restore drill

Use an isolated Supabase test project with no production integrations.

1. Download an encrypted artifact and checksum; verify it with `sha256sum -c` (or `shasum -a 256`).
2. Decrypt locally:

   ```bash
   openssl enc -d -aes-256-cbc -pbkdf2 \
     -in budgetbuddy-YYYYMMDDTHHMMSSZ.tar.gz.enc \
     -out budgetbuddy-restore.tar.gz \
     -pass env:BUDGETBUDDY_BACKUP_PASSPHRASE
   ```

3. Extract into a newly created private temporary directory.
4. Review `schema.sql`, `data.sql`, and `roles.sql`; restore them to the isolated project in that order using a restricted administrator connection.
5. Reapply any Supabase-managed Auth/storage configuration that logical dumps do not cover.
6. Run `supabase test db`, sign in with drill-only users, and compare per-table row counts and representative exports.
7. Record the artifact date, duration, result, discrepancies, and cleanup confirmation. Securely destroy plaintext drill files.

Never test a restore over production. A backup is not considered healthy until a restore drill succeeds.
