# Velocity CMS

A headless CMS built with Next.js, Prisma, PostgreSQL, and Redis.
Supports multi-site management, AI-assisted content (Claude), SEO/GEO scoring,
content scheduling, internal linking, backup automation, and a headless REST API.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Next.js (App Router, standalone)    |
| Database   | PostgreSQL 16 (via Prisma ORM)      |
| Cache      | Redis 7 (ioredis)                   |
| Auth       | NextAuth v5 (JWT, Credentials)      |
| Editor     | TipTap v3                           |
| AI         | Anthropic Claude (alt text, GEO, internal links) |
| Email      | Brevo REST API                      |
| Analytics  | Umami (self-hosted)                 |
| Images     | Sharp (WebP + thumbnails)           |
| Styles     | Tailwind CSS v4                     |

---

## Deploying to CloudPanel (divet.ro)

> **This is the recommended production setup.**
> CloudPanel handles nginx, SSL (Let's Encrypt), and the reverse proxy.
> Docker manages only the app containers (Next.js, PostgreSQL, Redis, Umami).
> No nginx or certbot containers are used.

### Architecture

```
Internet
    │
    ▼
CloudPanel nginx  (port 80/443, SSL, rate limiting)
    │  reverse proxy
    ▼
Next.js Docker container  (127.0.0.1:3000, not publicly exposed)
    │
    ├── PostgreSQL Docker container  (internal Docker network only)
    ├── Redis Docker container       (internal Docker network only)
    └── Umami Docker container       (127.0.0.1:3001, optional subdomain)
```

---

### Step 1 — Server requirements

Minimum: **2 vCPU, 4 GB RAM, 40 GB SSD** (Ubuntu 22.04 or 24.04 LTS).
Recommended: 4 vCPU / 8 GB RAM for production traffic.

CloudPanel must already be installed. If not:
```bash
curl -sS https://installer.cloudpanel.io/ce/v2/install.sh -o install.sh
sudo bash install.sh
```

---

### Step 2 — Install Docker on the VPS

```bash
curl -fsSL https://get.docker.com | bash
usermod -aG docker $USER
# Log out and back in, then verify:
docker compose version   # must show v2.x
```

---

### Step 3 — Configure DNS

In your DNS provider, point **divet.ro** to your VPS IP:

| Type | Name  | Value   | TTL  |
|------|-------|---------|------|
| A    | @     | VPS_IP  | 300  |
| A    | www   | VPS_IP  | 300  |

Verify propagation: `dig +short divet.ro`

---

### Step 4 — Create the site in CloudPanel

1. Log in to CloudPanel → **Add Site**
2. Choose **Reverse Proxy**
3. Fill in:
   - **Domain:** `divet.ro`
   - **Reverse Proxy URL:** `http://127.0.0.1:3000`
4. Click **Add Site**

CloudPanel creates an nginx vhost that proxies `divet.ro → localhost:3000`.

---

### Step 5 — Issue SSL certificate

In CloudPanel → Sites → **divet.ro** → **SSL/TLS** tab:

1. Click **Actions → New Let's Encrypt Certificate**
2. Add both `divet.ro` and `www.divet.ro`
3. Click **Create and Install**

CloudPanel handles renewal automatically.

---

### Step 6 — Install nginx rate-limit zones

These zones must exist at the `http{}` level (outside any `server{}` block).
CloudPanel includes everything in `/etc/nginx/conf.d/` automatically.

```bash
# On the VPS, as root:
cp /opt/velocitycms/nginx/cloudpanel-rate-limits.conf \
   /etc/nginx/conf.d/velocitycms-rate-limits.conf

nginx -t && systemctl reload nginx
```

---

### Step 7 — Add custom nginx directives for divet.ro

In CloudPanel → Sites → **divet.ro** → **Nginx Directives** tab:

1. Open the file on your local machine:
   `nginx/cloudpanel-vhost-directives.conf`
2. Copy the entire contents
3. Paste into the **Nginx Directives** text area in CloudPanel
4. Click **Save**

This adds:
- WebSocket proxy headers (needed for Next.js hot reload + streaming)
- Security headers (X-Frame-Options, HSTS, CSP, etc.)
- Immutable cache for `/_next/static/` assets (1-year TTL)
- 24-hour cache for `/media/` uploads
- Rate limiting on `/api/auth/`, `/api/`, and `/*`

---

### Step 8 — Clone the repo and configure environment

```bash
mkdir -p /opt/velocitycms
git clone https://github.com/cosminstan90/velocitycms.git /opt/velocitycms
cd /opt/velocitycms
cp .env.example .env.prod
nano .env.prod
```

Fill in every value. Use the table below as a reference.
Generate secrets with:
```bash
openssl rand -base64 32   # for AUTH_SECRET
openssl rand -hex 32      # for CRON_SECRET, INTERNAL_API_KEY, CMS_PUBLISHER_TOKEN
```

**Minimum required `.env.prod` for divet.ro:**

```env
# App
NEXTAUTH_URL=https://divet.ro
AUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_SECRET=<same as AUTH_SECRET>

# Database (must match POSTGRES_* below)
DATABASE_URL=postgresql://cms_user:<POSTGRES_PASSWORD>@postgres:5432/velocitycms

# Redis
REDIS_URL=redis://:<REDIS_PASSWORD>@redis:6379

# Docker PostgreSQL credentials
POSTGRES_PASSWORD=<strong-random-password>
POSTGRES_USER=cms_user
POSTGRES_DB=velocitycms

# Redis password (optional but recommended)
REDIS_PASSWORD=<strong-random-password>

# Secrets
CRON_SECRET=<openssl rand -hex 32>
INTERNAL_API_KEY=<openssl rand -hex 32>
CMS_PUBLISHER_TOKEN=<openssl rand -hex 32>

# Storage
BACKUP_PATH=/backups

# CORS — origins allowed to call /api/public/*
CORS_ALLOWED_ORIGINS=https://divet.ro,https://www.divet.ro

# Optional
ANTHROPIC_API_KEY=sk-ant-...
BREVO_API_KEY=...
BREVO_FROM_EMAIL=noreply@divet.ro
PAGESPEED_API_KEY=...
UMAMI_WEBSITE_ID=...
UMAMI_URL=http://localhost:3001
```

> **Never commit `.env.prod` to git.** It is already in `.gitignore`.

---

### Step 9 — First deploy

```bash
cd /opt/velocitycms
chmod +x deploy-cloudpanel.sh backup-before-deploy.sh

# Build and start all services
docker compose -f docker-compose.yml -f docker-compose.cloudpanel.yml up -d --build

# Run database migrations
docker compose -f docker-compose.yml -f docker-compose.cloudpanel.yml \
  exec nextjs npx prisma migrate deploy

# Seed initial data (first time only — creates admin user + default site)
docker compose -f docker-compose.yml -f docker-compose.cloudpanel.yml \
  exec nextjs npx prisma db seed
```

Verify the app is running:
```bash
curl -s http://127.0.0.1:3000/api/health
# → {"status":"ok","db":"ok","redis":"ok"}
```

Then open **https://divet.ro** in your browser.

---

### Step 10 — Set up cron jobs

In CloudPanel → **Cron Jobs** (or via `crontab -e` on the VPS):

```cron
# Content scheduler — publish posts on schedule (every minute)
* * * * * curl -s -X GET https://divet.ro/api/scheduler/run \
  -H "X-Cron-Secret: YOUR_CRON_SECRET" >> /var/log/velocitycms-scheduler.log 2>&1

# Daily full backup at 03:00 AM
0 3 * * * curl -s -X POST https://divet.ro/api/backup/run \
  -H "X-Cron-Secret: YOUR_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"type":"full"}' >> /var/log/velocitycms-backup.log 2>&1
```

Replace `YOUR_CRON_SECRET` with the value from `.env.prod`.

> SSL renewal is managed automatically by CloudPanel — no cron needed.

---

### Subsequent deploys

```bash
cd /opt/velocitycms
./deploy-cloudpanel.sh
```

What it does:
1. Creates a pre-deploy database backup
2. `git pull --ff-only origin main`
3. Pulls latest upstream images (postgres, redis, umami)
4. Builds the Next.js Docker image
5. Runs `prisma migrate deploy`
6. Restarts **only** the Next.js container (postgres/redis untouched)
7. Health check — rolls back warning if it fails

---

## Development (local)

```bash
# Start database and cache
docker compose up -d postgres redis

# Install dependencies
npm install

# Apply migrations and generate Prisma client
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run dev
```

Open `http://localhost:3000`
Admin: `http://localhost:3000/admin/dashboard`

---

## Environment Variables Reference

| Variable                | Required | Description                                         |
|-------------------------|----------|-----------------------------------------------------|
| `DATABASE_URL`          | ✓        | PostgreSQL connection string                        |
| `AUTH_SECRET`           | ✓        | NextAuth JWT secret (32+ chars)                     |
| `NEXTAUTH_URL`          | ✓        | Public URL — `https://divet.ro`                     |
| `REDIS_URL`             | ✓        | Redis connection string                             |
| `CRON_SECRET`           | ✓        | Shared secret for `/api/scheduler/run`, `/api/backup/run`, `/api/revalidate` |
| `INTERNAL_API_KEY`      | ✓        | Internal service-to-service auth                    |
| `BACKUP_PATH`           | ✓        | Filesystem path for backup files                    |
| `POSTGRES_PASSWORD`     | prod     | Docker PostgreSQL password                          |
| `POSTGRES_USER`         | prod     | Docker PostgreSQL user (default: `cms_user`)        |
| `POSTGRES_DB`           | prod     | Docker PostgreSQL database name                     |
| `REDIS_PASSWORD`        | prod     | Docker Redis password                               |
| `ANTHROPIC_API_KEY`     | –        | Claude API — alt text, GEO scoring, internal links  |
| `BREVO_API_KEY`         | –        | Brevo email API key                                 |
| `BREVO_FROM_EMAIL`      | –        | Sender address for notifications                    |
| `CMS_PUBLISHER_TOKEN`   | –        | Publisher integration token                         |
| `CORS_ALLOWED_ORIGINS`  | –        | Comma-separated CORS origins for `/api/public/*`    |
| `PAGESPEED_API_KEY`     | –        | Google PageSpeed Insights API key                   |
| `UMAMI_WEBSITE_ID`      | –        | Umami analytics site ID                             |
| `UMAMI_URL`             | –        | Umami instance base URL                             |

---

## Headless API

All public endpoints require `X-API-Key: sk-...` header.
Generate and manage API keys at `/admin/settings` → **Chei API** tab.

| Method | Endpoint                       | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | `/api/public/posts`            | List posts (paginated)         |
| GET    | `/api/public/posts/[slug]`     | Full post with tags + media    |
| GET    | `/api/public/pages/[slug]`     | Full static page               |
| GET    | `/api/public/categories`       | Nested category tree           |
| GET    | `/api/public/tags`             | Tags with post counts          |

**Query params for `/api/public/posts`:**
- `page`, `limit` (max 100)
- `category=slug`
- `search=keyword`
- `status=published|draft|all`
- `fields=id,title,slug,...` — sparse fieldset

### On-demand cache revalidation

```bash
curl -X POST https://divet.ro/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -d '{"type": "post", "path": "/blog/my-article"}'
```

Types: `page` · `post` · `category` · `all`

---

## Available Scripts

| Script               | Description                                         |
|----------------------|-----------------------------------------------------|
| `npm run dev`        | Start development server                            |
| `npm run build`      | Production build                                    |
| `npm run start`      | Start production server (after build)               |
| `npm run lint`       | ESLint check                                        |
| `npm run perf-check` | SEO / content quality audit on all published posts  |

---

## Architecture Notes

- **ISR cache TTLs:** Homepage 30 min · Blog/category listings 1 h · Articles 2 h · Static pages 24 h
- **On-demand revalidation:** `POST /api/revalidate` + automatic on publish/update/unpublish
- **Rate limits (app layer):** Login 5/15 min per email · Uploads 20/h per user · Public API 200/min per IP
- **Rate limits (nginx layer):** Auth 5/min · API 60/min · General 200/min — all with burst
- **Security headers:** X-Frame-Options DENY · X-Content-Type-Options · Referrer-Policy · Permissions-Policy · HSTS (1 year)
- **SSL:** Let's Encrypt, auto-renewed by CloudPanel
- **Backups:** Daily full backup via cron · Pre-deploy backup before every deploy · 30-day retention

---

## Useful Docker Commands

```bash
# Alias for convenience (add to ~/.bashrc)
alias dc='docker compose -f /opt/velocitycms/docker-compose.yml -f /opt/velocitycms/docker-compose.cloudpanel.yml'

# View logs
dc logs -f nextjs
dc logs -f postgres

# Open a shell in the Next.js container
dc exec nextjs sh

# Run a Prisma migration manually
dc exec nextjs npx prisma migrate deploy

# Check container status
dc ps

# Restart a single service
dc restart nextjs
```
