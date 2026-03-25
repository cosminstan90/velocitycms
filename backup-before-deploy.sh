#!/usr/bin/env bash
# backup-before-deploy.sh — Create a database backup before any deployment
#
# Called automatically by deploy.sh. Can also be run standalone:
#   ./backup-before-deploy.sh
#
# Requires:
#   - Docker + docker-compose v2
#   - BACKUP_PATH env var or defaults to ./backups/pre-deploy
#   - PostgreSQL running in the 'postgres' service

set -euo pipefail

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
BACKUP_DIR="${BACKUP_PATH:-./backups}/pre-deploy"
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
FILENAME="pre-deploy-${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

# PostgreSQL connection — read from env or use defaults matching docker-compose
PG_HOST="${PG_HOST:-postgres}"
PG_PORT="${PG_PORT:-5432}"
PG_USER="${POSTGRES_USER:-cms_user}"
PG_PASS="${POSTGRES_PASSWORD:-cms_pass}"
PG_DB="${POSTGRES_DB:-velocitycms}"

echo "▶ Pre-deploy backup..."
echo "  Target: ${FILEPATH}"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

# Run pg_dump inside the postgres container and stream through gzip
$COMPOSE exec -T postgres \
  env PGPASSWORD="${PG_PASS}" \
  pg_dump -h localhost -U "${PG_USER}" "${PG_DB}" \
  | gzip -9 > "${FILEPATH}"

if [ $? -eq 0 ] && [ -s "${FILEPATH}" ]; then
  SIZE=$(du -sh "${FILEPATH}" | cut -f1)
  echo "  ✓ Saved ${FILEPATH} (${SIZE})"
else
  echo "  ✗ Backup failed or empty file produced"
  rm -f "${FILEPATH}"
  exit 1
fi

# Cleanup: keep last 10 pre-deploy backups
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/*.sql.gz 2>/dev/null | wc -l)
if [ "$BACKUP_COUNT" -gt 10 ]; then
  echo "  Pruning old pre-deploy backups (keeping 10 most recent)..."
  ls -1t "${BACKUP_DIR}"/*.sql.gz | tail -n +11 | xargs rm -f
fi

echo "  ✓ Pre-deploy backup complete"
