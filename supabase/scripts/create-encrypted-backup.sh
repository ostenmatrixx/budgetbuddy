#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${BUDGETBUDDY_DATABASE_URL:?Set BUDGETBUDDY_DATABASE_URL in the runner secret store}"
: "${BUDGETBUDDY_BACKUP_PASSPHRASE:?Set BUDGETBUDDY_BACKUP_PASSPHRASE in the runner secret store}"

backup_output_dir="${1:-./backups}"
backup_timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_temp_dir="$(mktemp -d "${TMPDIR:-/tmp}/budgetbuddy-backup.XXXXXX")"
backup_plain_archive="${backup_temp_dir}/budgetbuddy-${backup_timestamp}.tar.gz"
backup_encrypted_archive="${backup_output_dir}/budgetbuddy-${backup_timestamp}.tar.gz.enc"

cleanup_backup_temp_dir() {
  case "${backup_temp_dir}" in
    "${TMPDIR:-/tmp}"/budgetbuddy-backup.*) rm -rf -- "${backup_temp_dir}" ;;
    *) return 1 ;;
  esac
}
trap cleanup_backup_temp_dir EXIT

mkdir -p -- "${backup_output_dir}"

supabase db dump \
  --db-url "${BUDGETBUDDY_DATABASE_URL}" \
  --file "${backup_temp_dir}/schema.sql"
supabase db dump \
  --db-url "${BUDGETBUDDY_DATABASE_URL}" \
  --data-only \
  --use-copy \
  --file "${backup_temp_dir}/data.sql"
supabase db dump \
  --db-url "${BUDGETBUDDY_DATABASE_URL}" \
  --role-only \
  --file "${backup_temp_dir}/roles.sql"

tar -C "${backup_temp_dir}" -czf "${backup_plain_archive}" schema.sql data.sql roles.sql
openssl enc -aes-256-cbc -salt -pbkdf2 \
  -in "${backup_plain_archive}" \
  -out "${backup_encrypted_archive}" \
  -pass env:BUDGETBUDDY_BACKUP_PASSPHRASE

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "${backup_encrypted_archive}" > "${backup_encrypted_archive}.sha256"
else
  shasum -a 256 "${backup_encrypted_archive}" > "${backup_encrypted_archive}.sha256"
fi

printf '%s\n' "Encrypted backup created: ${backup_encrypted_archive}"
