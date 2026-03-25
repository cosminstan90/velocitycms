# Velocity CMS — Deployment Guide (CloudPanel + divet.ro)

---

## Tech Stack

| Layer      | Technology                                       |
|------------|--------------------------------------------------|
| Framework  | Next.js (App Router, standalone output)          |
| Database   | PostgreSQL 16 via Prisma                         |
| Cache      | Redis 7                                          |
| Auth       | NextAuth v5                                      |
| Editor     | TipTap v3                                        |
| AI         | Anthropic Claude (alt text, GEO, internal links) |
| Email      | Brevo REST API                                   |
| Analytics  | Umami (self-hosted)                              |
| Styles     | Tailwind CSS v4                                  |

---

## How it runs in production

```
Internet → CloudPanel nginx (port 80/443 · SSL · rate limits)
               │
               └─ reverse proxy → Next.js Docker  (127.0.0.1:3000)
                                       │
                                       ├── PostgreSQL  (Docker-internal only)
                                       └── Redis       (Docker-internal only)
```

CloudPanel owns nginx and SSL.
Docker owns the app, the database, and Redis.
They never conflict.

---

# PART A — One-time server setup

> Do this once. SSH into your VPS as root.

```bash
ssh root@YOUR_VPS_IP
```

### A1. Update the system

```bash
apt update && apt upgrade -y
apt install -y git curl wget unzip
```

### A2. Install Docker

```bash
curl -fsSL https://get.docker.com | bash
```

Verify it works:

```bash
docker compose version
# Should print: Docker Compose version v2.x.x
```

### A3. Create the app folder

```bash
mkdir -p /opt/velocitycms
```

---

# PART B — CloudPanel UI setup

> Open your CloudPanel dashboard in the browser: `https://YOUR_VPS_IP:8443`

### B1. Add the site

1. Click **Add Site** in the top-right
2. Choose **Create a Node.js Site** (NOT PHP, NOT reverse proxy yet)
   - If Node.js is not available, choose **Reverse Proxy** instead
3. Fill in:
   - **Domain Name:** `divet.ro`
   - **Node.js Version:** 20 (if using Node.js site type)
   - **Reverse Proxy URL:** `http://127.0.0.1:3000`
4. Click **Add Site**

> If you chose "Node.js Site", go back into the site settings and change the
> site type to **Reverse Proxy** pointing to `http://127.0.0.1:3000`

### B2. Issue the SSL certificate

1. CloudPanel → Sites → **divet.ro**
2. Click the **SSL/TLS** tab (or the lock icon)
3. Click **Actions → New Let's Encrypt Certificate**
4. Add both:
   - `divet.ro`
   - `www.divet.ro`
5. Click **Create and Install**

> DNS must already be pointing to the VPS IP before this step works.
> If it fails, wait 5 minutes for DNS to propagate and try again.

---

# PART C — Clone and configure

> Back in your SSH session.

### C1. Clone the repository

```bash
cd /opt/velocitycms
git clone https://github.com/cosminstan90/velocitycms.git .
```

### C2. Generate your secrets

Run each command and copy the output — you'll need them in the next step:

```bash
# AUTH_SECRET
openssl rand -base64 32

# CRON_SECRET
openssl rand -hex 32

# INTERNAL_API_KEY
openssl rand -hex 32

# CMS_PUBLISHER_TOKEN
openssl rand -hex 32

# POSTGRES_PASSWORD (make a strong one)
openssl rand -hex 24

# REDIS_PASSWORD (optional but recommended)
openssl rand -hex 16
```

### C3. Create the production environment file

```bash
cp .env.example .env.prod
nano .env.prod
```

Replace the entire contents with this template, filling in your generated values:

```env
# ── App ───────────────────────────────────────────────────────────────────────
NEXTAUTH_URL=https://divet.ro
AUTH_SECRET=PASTE_OUTPUT_OF_OPENSSL_BASE64
NEXTAUTH_SECRET=PASTE_SAME_AS_AUTH_SECRET

# ── Database ──────────────────────────────────────────────────────────────────
# Use the same password as POSTGRES_PASSWORD below
DATABASE_URL=postgresql://cms_user:PASTE_POSTGRES_PASSWORD@postgres:5432/velocitycms

# ── Redis ─────────────────────────────────────────────────────────────────────
REDIS_URL=redis://:PASTE_REDIS_PASSWORD@redis:6379

# ── Docker credentials ────────────────────────────────────────────────────────
POSTGRES_PASSWORD=PASTE_POSTGRES_PASSWORD
POSTGRES_USER=cms_user
POSTGRES_DB=velocitycms
REDIS_PASSWORD=PASTE_REDIS_PASSWORD

# ── Secrets ───────────────────────────────────────────────────────────────────
CRON_SECRET=PASTE_CRON_SECRET
INTERNAL_API_KEY=PASTE_INTERNAL_API_KEY
CMS_PUBLISHER_TOKEN=PASTE_CMS_PUBLISHER_TOKEN

# ── Storage ───────────────────────────────────────────────────────────────────
BACKUP_PATH=/opt/velocitycms/backups

# ── CORS (origins allowed to call /api/public/*) ──────────────────────────────
CORS_ALLOWED_ORIGINS=https://divet.ro,https://www.divet.ro

# ── AI (optional but recommended) ────────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-...

# ── Email (optional) ──────────────────────────────────────────────────────────
BREVO_API_KEY=
BREVO_FROM_EMAIL=noreply@divet.ro

# ── Analytics (optional) ──────────────────────────────────────────────────────
UMAMI_WEBSITE_ID=
UMAMI_URL=http://localhost:3001
PAGESPEED_API_KEY=
```

Save and close: `Ctrl+O` → `Enter` → `Ctrl+X`

Verify nothing is empty that should not be:

```bash
grep -E "^(NEXTAUTH_URL|AUTH_SECRET|DATABASE_URL|REDIS_URL|POSTGRES_PASSWORD|CRON_SECRET)" .env.prod
```

All six lines should show real values, not placeholder text.

---

# PART D — nginx configuration

### D1. Install rate-limit zones

CloudPanel's nginx loads everything in `/etc/nginx/conf.d/` automatically.

```bash
cp /opt/velocitycms/nginx/cloudpanel-rate-limits.conf \
   /etc/nginx/conf.d/velocitycms-rate-limits.conf

nginx -t
# → nginx: configuration file /etc/nginx/nginx.conf test is successful

systemctl reload nginx
```

### D2. Add vhost directives in CloudPanel UI

1. CloudPanel → Sites → **divet.ro** → **Nginx Directives** tab
2. Copy the file contents:

```bash
cat /opt/velocitycms/nginx/cloudpanel-vhost-directives.conf
```

3. Paste the entire output into the **Nginx Directives** text box in CloudPanel
4. Click **Save**

This adds:
- Correct proxy headers for Next.js (WebSocket, X-Forwarded-For, etc.)
- Immutable 1-year cache for `/_next/static/` (JS/CSS bundles)
- 24-hour cache for `/media/` uploads
- Security headers (X-Frame-Options, HSTS, Referrer-Policy)
- Rate limits on `/api/auth/` (5/min), `/api/` (60/min), `/` (200/min)

---

# PART E — First deploy

### E1. Make scripts executable

```bash
cd /opt/velocitycms
chmod +x deploy-cloudpanel.sh backup-before-deploy.sh
```

### E2. Start all services

```bash
docker compose -f docker-compose.yml -f docker-compose.cloudpanel.yml up -d --build
```

This will take **5–10 minutes** on first run (downloading images + building Next.js).

Watch the build progress:

```bash
docker compose -f docker-compose.yml -f docker-compose.cloudpanel.yml logs -f nextjs
```

Wait until you see:
```
✓ Starting...
```

Press `Ctrl+C` to stop following logs.

### E3. Check all containers are running

```bash
docker compose -f docker-compose.yml -f docker-compose.cloudpanel.yml ps
```

Expected output — all should show `healthy` or `running`:

```
NAME                    STATUS
velocitycms_postgres    Up (healthy)
velocitycms_redis       Up (healthy)
velocitycms_app         Up (healthy)
velocitycms_umami       Up
```

### E4. Run database migrations

```bash
docker compose -f docker-compose.yml -f docker-compose.cloudpanel.yml \
  exec nextjs npx prisma migrate deploy
```

Expected: `All migrations have been successfully applied.`

### E5. Seed the database (first time only)

This creates the admin user and default site record:

```bash
docker compose -f docker-compose.yml -f docker-compose.cloudpanel.yml \
  exec nextjs npx prisma db seed
```

Note the admin email and password printed in the output — save them.

### E6. Verify the app is responding

```bash
curl -s http://127.0.0.1:3000/api/health
```

Expected:
```json
{"status":"ok","db":"ok","redis":"ok"}
```

Then test through CloudPanel's nginx:

```bash
curl -s -o /dev/null -w "%{http_code}" https://divet.ro
# → 200
```

Open `https://divet.ro` in your browser — the site should load.
Open `https://divet.ro/admin/dashboard` and log in with the seed credentials.

---

# PART F — Cron jobs

### F1. Open the crontab

```bash
crontab -e
```

If asked to choose an editor, pick **nano** (option 1).

### F2. Add these two jobs

```cron
# Content scheduler — publish posts on schedule (runs every minute)
* * * * * curl -s -X GET https://divet.ro/api/scheduler/run -H "X-Cron-Secret: PASTE_YOUR_CRON_SECRET" >> /var/log/velocitycms-scheduler.log 2>&1

# Daily full backup at 03:00 AM
0 3 * * * curl -s -X POST https://divet.ro/api/backup/run -H "X-Cron-Secret: PASTE_YOUR_CRON_SECRET" -H "Content-Type: application/json" -d '{"type":"full"}' >> /var/log/velocitycms-backup.log 2>&1
```

Replace `PASTE_YOUR_CRON_SECRET` with the `CRON_SECRET` value from `.env.prod`:

```bash
grep CRON_SECRET /opt/velocitycms/.env.prod
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

### F3. Create the log files

```bash
touch /var/log/velocitycms-scheduler.log
touch /var/log/velocitycms-backup.log
```

### F4. Test the scheduler endpoint manually

```bash
CRON_SECRET=$(grep ^CRON_SECRET /opt/velocitycms/.env.prod | cut -d= -f2)

curl -s -X GET https://divet.ro/api/scheduler/run \
  -H "X-Cron-Secret: $CRON_SECRET"
# → {"published":0,"errors":[],"checkedAt":"...","total":0}
```

---

# PART G — Add a convenience alias

Add this to your shell so you don't have to type the full compose command every time:

```bash
echo "alias dc='docker compose -f /opt/velocitycms/docker-compose.yml -f /opt/velocitycms/docker-compose.cloudpanel.yml'" >> ~/.bashrc
source ~/.bashrc
```

Now you can use:

```bash
dc ps                    # check container status
dc logs -f nextjs        # stream app logs
dc logs -f postgres      # stream database logs
dc exec nextjs sh        # open a shell in the app container
dc restart nextjs        # restart just the app
```

---

# PART H — Future deploys

Every time you push new code to GitHub, deploy it with:

```bash
cd /opt/velocitycms
./deploy-cloudpanel.sh
```

What it does automatically:
1. Creates a database backup (safe to roll back)
2. `git pull --ff-only origin main`
3. Pulls latest postgres/redis/umami images
4. Rebuilds the Next.js Docker image
5. Runs `prisma migrate deploy` for any new migrations
6. Restarts **only** the Next.js container (database stays up)
7. Health check — warns you if the container is not responding

---

# Troubleshooting

### Site shows CloudPanel default page instead of the app

The nginx vhost directives were not saved. Redo **Step D2**.

### `curl http://127.0.0.1:3000/api/health` returns connection refused

The Next.js container is not running or still starting up. Check:

```bash
dc ps
dc logs nextjs
```

### SSL certificate failed / `https://divet.ro` not loading

DNS is not pointing to the VPS yet. Check:

```bash
dig +short divet.ro
# Must return your VPS IP
```

Then re-issue the certificate in CloudPanel UI.

### Migrations fail with "database does not exist"

The postgres container may not have finished its init. Wait 30 seconds and retry:

```bash
dc exec postgres pg_isready -U cms_user -d velocitycms
# → /var/run/postgresql:5432 - accepting connections

dc exec nextjs npx prisma migrate deploy
```

### Admin login fails after seed

```bash
dc exec nextjs npx prisma db seed
```

Check the output for the printed credentials.

### See all container logs since last restart

```bash
dc logs --since 1h
```

---

# Environment Variables Reference

| Variable               | Required | Description                                              |
|------------------------|----------|----------------------------------------------------------|
| `NEXTAUTH_URL`         | ✓        | Public URL — `https://divet.ro`                          |
| `AUTH_SECRET`          | ✓        | NextAuth JWT secret — `openssl rand -base64 32`          |
| `DATABASE_URL`         | ✓        | PostgreSQL connection string (points to Docker service)  |
| `REDIS_URL`            | ✓        | Redis connection string (points to Docker service)       |
| `POSTGRES_PASSWORD`    | ✓        | Docker PostgreSQL password                               |
| `POSTGRES_USER`        | ✓        | Docker PostgreSQL user (default: `cms_user`)             |
| `POSTGRES_DB`          | ✓        | Docker PostgreSQL database (default: `velocitycms`)      |
| `REDIS_PASSWORD`       | ✓        | Docker Redis password                                    |
| `CRON_SECRET`          | ✓        | Secret for `/api/scheduler/run` and `/api/backup/run`    |
| `INTERNAL_API_KEY`     | ✓        | Internal service-to-service key                          |
| `CMS_PUBLISHER_TOKEN`  | ✓        | Publisher integration token                              |
| `BACKUP_PATH`          | ✓        | Filesystem path for backup files                         |
| `CORS_ALLOWED_ORIGINS` | –        | Comma-separated CORS origins for `/api/public/*`         |
| `ANTHROPIC_API_KEY`    | –        | Claude AI — alt text, GEO scoring, internal link engine  |
| `BREVO_API_KEY`        | –        | Brevo transactional email                                |
| `BREVO_FROM_EMAIL`     | –        | Sender address                                           |
| `UMAMI_WEBSITE_ID`     | –        | Umami analytics site ID                                  |
| `UMAMI_URL`            | –        | Umami instance URL                                       |
| `PAGESPEED_API_KEY`    | –        | Google PageSpeed Insights API key                        |

---

# Headless API

All public endpoints require `X-API-Key: sk-...` header.
Generate keys at `/admin/settings` → **Chei API** tab.

| Method | Endpoint                    | Description                   |
|--------|-----------------------------|-------------------------------|
| GET    | `/api/public/posts`         | List posts (paginated)        |
| GET    | `/api/public/posts/[slug]`  | Full post with tags + media   |
| GET    | `/api/public/pages/[slug]`  | Full static page              |
| GET    | `/api/public/categories`    | Nested category tree          |
| GET    | `/api/public/tags`          | Tags with post counts         |

---

# Development (local)

```bash
docker compose up -d postgres redis
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open `http://localhost:3000/admin/dashboard`
