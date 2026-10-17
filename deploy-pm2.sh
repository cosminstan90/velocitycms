#!/usr/bin/env bash
# deploy-pm2.sh — deploy VelocityCMS (divet.ro) pe VPS, cu PM2, fara Docker
#
# Utilizare (pe server, in directorul aplicatiei):
#   ./deploy-pm2.sh                # backup, git pull --ff-only (main), install, migrari, build, reload
#   ./deploy-pm2.sh --skip-pull    # construieste din arborele curent
#   ./deploy-pm2.sh --seed         # ruleaza si seed-urile idempotente (categorii + campuri):
#                                  # necesar o singura data, la prima lansare a noului template
#   ./deploy-pm2.sh --skip-backup  # NU e recomandat
#
# Variabile (cu valorile implicite pentru divet.ro):
#   APP_DIR=/home/divet.ro/htdocs/app   PM2_APP=velocitycms   PORT=3002   SEED_SITE_DOMAIN=divet.ro
#
# Cerinte: Node 20.6+ (seed-urile folosesc --env-file), PM2, PostgreSQL, git, curl.
#
# NU modifica ecosystem.config.js din repo: pe server are o modificare locala (cwd si
# caile de loguri), iar un `git pull` care il schimba s-ar bloca.
#
# Atentie: `next build` scrie in .next, care e folosit si de procesul care ruleaza inca;
# in cateva zeci de secunde, ultimele cereri pot primi erori. Pentru zero-downtime real
# ar trebui build intr-un director separat si comutare; nu e cazul la acest trafic.

set -euo pipefail

APP_DIR="${APP_DIR:-/home/divet.ro/htdocs/app}"
PM2_APP="${PM2_APP:-velocitycms}"
PORT="${PORT:-3002}"
SEED_SITE_DOMAIN="${SEED_SITE_DOMAIN:-divet.ro}"

SKIP_PULL=false
SKIP_BACKUP=false
RUN_SEEDS=false

for arg in "$@"; do
  case $arg in
    --skip-pull)   SKIP_PULL=true ;;
    --skip-backup) SKIP_BACKUP=true ;;
    --seed)        RUN_SEEDS=true ;;
    *) echo "Argument necunoscut: $arg"; exit 1 ;;
  esac
done

echo ""
echo "════════════════════════════════════════════"
echo "  VelocityCMS — deploy PM2 ($PM2_APP)"
echo "  $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "════════════════════════════════════════════"
echo ""

cd "$APP_DIR"
PREV_COMMIT="$(git rev-parse --short HEAD)"
echo "  Directorul:     $APP_DIR"
echo "  Commit curent:  $(git log -1 --pretty='%h %s')"
echo ""

# ── 1. Backup ──────────────────────────────────────────────────────────────────
if [ "$SKIP_BACKUP" = false ]; then
  echo "▶ Pasul 1 — backup baza de date"
  APP_DIR="$APP_DIR" bash "$APP_DIR/backup-db.sh" || {
    echo "⚠  Backup esuat. Deploy oprit, din precautie."
    exit 1
  }
else
  echo "▶ Pasul 1 — backup SARIT (--skip-backup)"
fi
echo ""

# ── 2. Cod ─────────────────────────────────────────────────────────────────────
if [ "$SKIP_PULL" = false ]; then
  echo "▶ Pasul 2 — git pull (main, doar fast-forward)"
  BRANCH="$(git rev-parse --abbrev-ref HEAD)"
  if [ "$BRANCH" != "main" ]; then
    echo "✗ Esti pe '$BRANCH', nu pe 'main'. Deploy oprit."
    exit 1
  fi
  git pull --ff-only origin main
  echo "✓ Cod actualizat: $(git log -1 --pretty='%h %s')"
else
  echo "▶ Pasul 2 — git pull SARIT (--skip-pull)"
fi
echo ""

# ── 3. Dependinte ──────────────────────────────────────────────────────────────
echo "▶ Pasul 3 — dependinte"
npm ci --include=dev
echo "✓ Dependinte instalate"
echo ""

# ── 4. Prisma + migrari (+ seed-uri) ───────────────────────────────────────────
echo "▶ Pasul 4 — Prisma generate + migrate deploy"
npx prisma generate
npx prisma migrate deploy
echo "✓ Baza de date la zi"

if [ "$RUN_SEEDS" = true ]; then
  echo "  Seed-uri idempotente pentru $SEED_SITE_DOMAIN (categorii, campuri)..."
  for s in seed-categories seed-field-definitions; do
    SEED_SITE_DOMAIN="$SEED_SITE_DOMAIN" node --env-file=.env node_modules/ts-node/dist/bin.js \
      --compiler-options '{"module":"CommonJS"}' "scripts/$s.ts"
  done
  echo "✓ Seed-uri rulate"
fi
echo ""

# ── 5. Build ───────────────────────────────────────────────────────────────────
echo "▶ Pasul 5 — build Next.js"
npm run build
echo "✓ Build terminat"
echo ""

# ── 6. Reload PM2 ──────────────────────────────────────────────────────────────
echo "▶ Pasul 6 — reload PM2 ($PM2_APP)"
pm2 reload "$PM2_APP" --update-env
pm2 save
echo "✓ PM2 reincarcat"
echo ""

# ── Verificari dupa deploy ─────────────────────────────────────────────────────
echo "▶ Health check (pana la 30 s)..."
RETRIES=15
until curl -sf "http://127.0.0.1:$PORT/api/health" > /dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo "✗ Health check esuat. Vezi: pm2 logs $PM2_APP"
    echo "  Revenire la codul anterior: git reset --hard $PREV_COMMIT && npm ci --include=dev && npm run build && pm2 reload $PM2_APP"
    exit 1
  fi
  sleep 2
done

echo "▶ Verificare pagini principale"
FAILED=0
for path in / /index-a-z /sitemap.xml; do
  code="$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT$path" || true)"
  if [ "$code" = "200" ]; then
    echo "  ✓ $path  ($code)"
  else
    echo "  ✗ $path  ($code)"
    FAILED=1
  fi
done
if [ $FAILED -ne 0 ]; then
  echo "✗ O pagina principala nu raspunde 200. Vezi: pm2 logs $PM2_APP"
  echo "  Revenire la codul anterior: git reset --hard $PREV_COMMIT && npm ci --include=dev && npm run build && pm2 reload $PM2_APP"
  exit 1
fi

echo ""
echo "════════════════════════════════════════════"
echo "  ✓ Deploy reusit"
echo "  Commit: $(git log -1 --pretty='%h %s')   (anterior: $PREV_COMMIT)"
echo "  Ora:    $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════"
echo ""
