#!/usr/bin/env bash
set -euo pipefail
: "${RESTORE_DATABASE_URL:?Set a NEW empty isolated database URL}"
: "${RESTORE_CONFIRM_EMPTY:?Set RESTORE_CONFIRM_EMPTY=yes after verifying the target}"
[[ "$RESTORE_CONFIRM_EMPTY" == yes ]] || exit 1
backup="${1:?Pass a verified custom-format dump}"
count=$(DATABASE_URL="$RESTORE_DATABASE_URL" node "$(dirname "$0")/database-client.cjs" psql -X -At -v ON_ERROR_STOP=1 -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'")
[[ "$count" == 0 ]] || { echo 'Refusing restore into non-empty database' >&2; exit 1; }
DATABASE_URL="$RESTORE_DATABASE_URL" node "$(dirname "$0")/database-client.cjs" pg_restore --no-owner --no-acl --single-transaction --exit-on-error "$backup"
printf 'Restore completed; reconcile counts, constraints and payment state before traffic.\n'
