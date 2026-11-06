#!/usr/bin/env bash
set -euo pipefail
umask 077
: "${DATABASE_URL:?Set the direct PostgreSQL connection URL}"
: "${BACKUP_DIR:?Set an encrypted backup directory}"
mkdir -p "$BACKUP_DIR"
backup="$BACKUP_DIR/playza-$(date -u +%Y%m%dT%H%M%SZ)-$$.dump"
trap 'rm -f "$backup.partial"' EXIT
node "$(dirname "$0")/database-client.cjs" pg_dump --format=custom --no-owner --no-acl --file="$backup.partial"
pg_restore --list "$backup.partial" >/dev/null
mv "$backup.partial" "$backup"
shasum -a 256 "$backup" > "$backup.sha256"
printf 'Backup completed: %s\n' "$backup"
