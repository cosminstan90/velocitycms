#!/usr/bin/env bash
# deploy-cloudpanel.sh — Zero-downtime deploy for CloudPanel VPS (divet.ro)
#
# Usage:
#   ./deploy-cloudpanel.sh              # deploy latest main branch
#   ./deploy-cloudpanel.sh --skip-pull  # build from current working tree
#
# Requirements: Docker, docker compose v2+, git
# Difference from deploy.sh: uses docker-compose.cloudpanel.yml (no nginx/certbot)

set -euo pipefail

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.cloudpanel.yml"
SKIP_PULL=false

for arg in "$@"; do
  case $arg in
    --skip-pull) SKIP_PULL=true ;;
    *) echo "Unknown argument: $arg"; exit 1 ;;
  esac
done

echo ""
echo "════════════════════════════════════════════"
echo "  Velocity CMS — CloudPanel Deploy (divet.ro)"
echo "  $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "════════════════════════════════════════════"
echo ""

# ── 1. Pre-deploy backup ───────────────────────────────────────────────────────
echo "▶ Step 1/6 — Pre-deploy backup..."
bash ./backup-before-deploy.sh || {
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

# ── 3. Pull upstream images ────────────────────────────────────────────────────
echo "▶ Step 3/6 — Pulling upstream images (postgres, redis, umami)..."
$COMPOSE pull --ignore-buildable postgres redis umami 2>/dev/null || true
echo "✓ Upstream images updated"
echo ""

# ── 4. Build Next.js image ─────────────────────────────────────────────────────
echo "▶ Step 4/6 — Building Next.js image..."
$COMPOSE build --no-cache nextjs
echo "✓ Image built"
echo ""

# ── 5. Database migrations ─────────────────────────────────────────────────────
echo "▶ Step 5/6 — Running Prisma migrations..."
$COMPOSE run --rm nextjs npx prisma migrate deploy
echo "✓ Migrations applied"
echo ""

# ── 6. Rolling restart — Next.js only ─────────────────────────────────────────
echo "▶ Step 6/6 — Restarting Next.js container..."
$COMPOSE up -d --no-deps --force-recreate nextjs
echo "✓ Container restarted"
echo ""

# ── Health check ───────────────────────────────────────────────────────────────
echo "▶ Waiting for health check (up to 30s)..."
RETRIES=15
until $COMPOSE exec -T nextjs wget -qO- http://localhost:3000/api/health >/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -eq 0 ]; then
    echo "✗ Health check failed. Check: docker compose logs nextjs"
    exit 1
  fi
  sleep 2
done

echo ""
echo "════════════════════════════════════════════"
echo "  ✓ Deploy successful!"
echo "  Site:   https://divet.ro"
echo "  Commit: $(git log -1 --pretty='%h %s')"
echo "  Time:   $(date '+%Y-%m-%d %H:%M:%S')"
echo "════════════════════════════════════════════"
echo ""
