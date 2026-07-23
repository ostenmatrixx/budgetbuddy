#!/usr/bin/env bash
set -euo pipefail

if ! command -v pyftsubset >/dev/null 2>&1; then
  printf '%s\n' "pyftsubset is required. Install FontTools with: python3 -m pip install fonttools brotli" >&2
  exit 1
fi

source_font="node_modules/material-symbols/material-symbols-outlined.woff2"
output_font="src/assets/material-symbols-outlined-subset.woff2"

if [[ ! -f "${source_font}" ]]; then
  printf '%s\n' "Material Symbols source font is missing. Run npm ci first." >&2
  exit 1
fi

icons=(
  account_balance_wallet
  add
  add_circle
  archive
  bar_chart
  calendar_month
  calendar_today
  category
  check_circle
  chevron_left
  chevron_right
  close
  cloud_off
  dashboard
  dark_mode
  delete
  edit
  error
  light_mode
  logout
  manage_accounts
  mobile_arrow_down
  monitoring
  notes
  notifications
  payments
  progress_activity
  receipt_long
  savings
  sell
  settings
  shopping_bag
  sync
  system_update_alt
  tune
  visibility
  visibility_off
  warning
)

glyphs=".notdef,space,underscore"
for letter in {a..z}; do
  glyphs+=",${letter}"
done
for icon in "${icons[@]}"; do
  glyphs+=",${icon},${icon}.fill"
done

mkdir -p "$(dirname "${output_font}")"
pyftsubset "${source_font}" \
  --output-file="${output_font}" \
  --flavor=woff2 \
  --glyphs="${glyphs}" \
  --ignore-missing-glyphs \
  --no-layout-closure \
  --layout-features='*' \
  --name-IDs='*' \
  --name-languages='*' \
  --notdef-glyph \
  --notdef-outline \
  --recommended-glyphs

printf '%s\n' "Wrote ${output_font}"
