#!/usr/bin/env bash
# deploy-pm2.sh — Zero-downtime deploy for VelocityCMS on CloudPanel VPS (PM2, no Docker)
#
# Usage:
#   ./deploy-pm2.sh              # deploy latest main branch
#   ./deploy-pm2.sh --skip-pull  # build from current working tree
#
# Requirements: Node.js 20+, PM2, PostgreSQL running, Redis running, git
#
# NOTE: This replaces deploy.sh (Docker) and deploy-cloudpanel.sh (Docker+CloudPanel).
#       VelocityCMS runs as a PM2 process on port 3002. PostgreSQL and Redis run
#       as system services — no Docker containers needed.

set -euo pipefail

APP_DIR="/home/velocitycms/htdocs/app"
SKIP_PULL=false

for arg in "$@"; do
  case $arg in
    --skip-pull) SKIP_PULL=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

echo ""
echo "════════════════════════════════════════════"
echo "  VelocityCMS — PM2 Deploy"
echo "  $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "════════════════════════════════════════════"
echo ""

cd "$APP_DIR"

# ── 1. Pre-deploy backup ───────────────────────────────────────────────────────
echo "▶ Step 1/6 — Pre-deploy backup..."
bash backup-before-deploy.sh || {
  echo "⚠  Backup failed. Deploy aborted for safety."
  exit 1
}
echo "✓ Backup complete"
echo ""

# ── 2. Pull latest code ────────────────────────────────────────────────────────
if [ "$SKIP_PULL" = false ]; then
  echo "▶ Step 2/6 — Pulling latest code..."
  git pull --ff-only origin main
  echo "✓ Code updated: $(git log -1 --pretty='%h %s')"
else
  echo "▶ Step 2/6 — Skipping git pull (--skip-pull)"
fi
echo ""

# ── 3. Install dependencies ────────────────────────────────────────────────────
echo "▶ Step 3/6 — Installing dependencies..."
npm ci --production=false
echo "✓ Dependencies installed"
echo ""

# ── 4. Generate Prisma client + run migrations ────────────────────────────────
echo "▶ Step 4/6 — Prisma generate + migrate..."
npx prisma generate
npx prisma migrate deploy
echo "✓ Database up to date"
echo ""

# ── 5. Build Next.js ──────────────────────────────────────────────────────────
echo "▶ Step 5/6 — Building Next.js..."
npm run build
echo "✓ Build complete"
echo ""

# ── 6. Reload PM2 (zero-downtime) ─────────────────────────────────────────────
echo "▶ Step 6/6 — Reloading PM2 process..."
# 'pm2 reload' does a graceful rolling restart with zero downtime
pm2 reload velocitycms --update-env
pm2 save
echo "✓ PM2 reloaded"
echo ""

# ── Health check ───────────────────────────────────────────────────────────────
echo "▶ Waiting for health check (up to 30s)..."
RETRIES=15
until curl -sf http://127.0.0.1:3002/api/health > /dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo "✗ Health check failed. Check: pm2 logs velocitycms"
    exit 1
  fi
  sleep 2
done

echo ""
echo "════════════════════════════════════════════"
echo "  ✓ Deploy successful!"
echo "  Commit: $(git log -1 --pretty='%h %s')"
echo "  Time:   $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════"
echo ""
