#!/usr/bin/env bash
# backup-db.sh — dump PostgreSQL inainte de un deploy (PostgreSQL de sistem, fara Docker)
#
# Citeste DATABASE_URL din mediu sau din .env (in directorul aplicatiei) si scrie un
# dump gzip, apoi il verifica: arhiva intreaga, marcajul de final de dump, marime minima.
# Ruleaza standalone sau e apelat de deploy-pm2.sh.
#
# Variabile optionale:
#   APP_DIR     directorul aplicatiei            (implicit: directorul acestui script)
#   BACKUP_DIR  unde se scriu dump-urile         (implicit: <parintele lui htdocs>/backups/pre-deploy)
#   PG_DUMP     calea catre pg_dump              (implicit: pg_dump din PATH)
#   KEEP        cate dump-uri se pastreaza       (implicit: 10)
#
# Dump-ul contine date sensibile (hash-uri de parole, token-uri): se scrie cu permisiuni 600.

set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)}"
PG_DUMP="${PG_DUMP:-pg_dump}"
KEEP="${KEEP:-10}"

# ── DATABASE_URL ──────────────────────────────────────────────────────────────
if [ -z "${DATABASE_URL:-}" ] && [ -f "$APP_DIR/.env" ]; then
  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$APP_DIR/.env" | head -1 | cut -d= -f2- \
    | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//")"
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "  ✗ DATABASE_URL lipseste (nici in mediu, nici in $APP_DIR/.env)"
  exit 1
fi
# libpq nu accepta parametri de query necunoscuti (ex. ?schema=public din URL-urile Prisma)
DB_URL="${DATABASE_URL%%\?*}"
DB_NAME="${DB_URL##*/}"

# ── Destinatie ────────────────────────────────────────────────────────────────
if [ -z "${BACKUP_DIR:-}" ]; then
  BACKUP_DIR="$(cd "$APP_DIR/../.." && pwd)/backups/pre-deploy"
fi
mkdir -p "$BACKUP_DIR"
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
FINAL="$BACKUP_DIR/pre-deploy-${TIMESTAMP}.sql.gz"
PART="$FINAL.part"
trap 'rm -f "$PART"' EXIT

echo "▶ Backup baza de date"
echo "  Baza:      $DB_NAME"
echo "  Destinatie: $FINAL"

# ── Dump ──────────────────────────────────────────────────────────────────────
umask 077
"$PG_DUMP" --no-owner --no-privileges "$DB_URL" | gzip -9 > "$PART"

# ── Verificare ────────────────────────────────────────────────────────────────
if ! gzip -t "$PART" 2>/dev/null; then
  echo "  ✗ Arhiva e corupta"
  exit 1
fi
if [ "$(wc -c < "$PART")" -lt 1024 ]; then
  echo "  ✗ Dump-ul e prea mic (sub 1 KB)"
  exit 1
fi
if ! gzip -dc "$PART" | tail -n 20 | grep -q "PostgreSQL database dump complete"; then
  echo "  ✗ Dump incomplet (lipseste marcajul de final)"
  exit 1
fi

mv "$PART" "$FINAL"
chmod 600 "$FINAL"
trap - EXIT
echo "  ✓ Salvat: $FINAL ($(du -h "$FINAL" | cut -f1))"

# ── Curatenie: pastreaza cele mai recente $KEEP ───────────────────────────────
# shellcheck disable=SC2012
ls -1t "$BACKUP_DIR"/pre-deploy-*.sql.gz 2>/dev/null | tail -n +"$((KEEP + 1))" | xargs -r rm -f
echo "  ✓ Pastrate cel mult $KEEP dump-uri"
