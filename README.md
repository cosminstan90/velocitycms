# Velocity CMS

A headless CMS built with Next.js 16, Prisma, PostgreSQL, and Redis.
Supports multi-site management, SEO scoring (GEO), AI-assisted content,
publisher integrations, backup automation, and a headless REST API.

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Framework  | Next.js 16 (App Router, standalone) |
| Database   | PostgreSQL 16 (via Prisma ORM)      |
| Cache      | Redis 7 (ioredis)                   |
| Auth       | NextAuth v5 (JWT, Credentials)      |
| Editor     | TipTap v3                           |
| AI         | Anthropic Claude (alt text, GEO)    |
| Email      | Brevo REST API                      |
| Analytics  | Umami (self-hosted)                 |
| Images     | Sharp (WebP + thumbnails)           |
| Styles     | Tailwind CSS v4                     |

---

## VPS Setup (Ubuntu 24.04 LTS)

### 1. Provision server

Minimum specs: **2 vCPU, 4 GB RAM, 40 GB SSD**.
Recommended: 4 vCPU / 8 GB RAM for sites with heavy media uploads.

```bash
apt update && apt upgrade -y
apt install -y curl wget git unzip ufw
```

### 2. Configure firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### 3. Install Docker

```bash
curl -fsSL https://get.docker.com | bash
usermod -aG docker $USER   # log out and back in after this
```

Verify: `docker compose version` should show v2.x.

### 4. Configure DNS

In your DNS provider, create A records pointing to your VPS IP:

| Type | Name | Value       |
|------|------|-------------|
| A    | @    | VPS_IP      |
| A    | www  | VPS_IP      |

Verify propagation: `dig +short yourdomain.com`

### 5. Clone and configure environment

```bash
git clone https://github.com/YOUR_ORG/velocitycms.git /opt/velocitycms
cd /opt/velocitycms
cp .env.example .env.prod
```

Edit `.env.prod` — set all required values (see [Environment Variables](#environment-variables-reference)):

```bash
nano .env.prod
```

Key values to change:
- `DATABASE_URL` — use the same password as `POSTGRES_PASSWORD`
- `AUTH_SECRET` — generate: `openssl rand -base64 32`
- `NEXTAUTH_URL` — your public domain: `https://yourdomain.com`
- `POSTGRES_PASSWORD` — strong random password
- `CRON_SECRET` + `INTERNAL_API_KEY` — generate: `openssl rand -hex 32`
- `CORS_ALLOWED_ORIGINS` — your domain(s)

### 6. Configure nginx for your domain

```bash
sed -i 's/YOUR_DOMAIN.com/yourdomain.com/g' nginx/nginx.conf
```

### 7. First deploy (HTTP only, before SSL)

```bash
cd /opt/velocitycms

# Build the Next.js image
docker compose -f docker-compose.yml -f docker-compose.prod.yml build nextjs

# Start database and app
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d postgres redis nextjs

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nextjs \
  npx prisma migrate deploy

# Seed initial data
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nextjs \
  npx prisma db seed

# Start nginx (HTTP only for now — needed for ACME challenge)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d nginx
```

### 8. Obtain SSL certificate (Let's Encrypt)

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml run --rm certbot \
  certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  --email admin@yourdomain.com \
  --agree-tos \
  --no-eff-email \
  -d yourdomain.com \
  -d www.yourdomain.com

# Reload nginx to pick up the certificate
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload
```

### 9. Start all services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
```

Verify: `curl -I https://yourdomain.com` → HTTP 200 + `Strict-Transport-Security` header.

### 10. Set up cron jobs (on the VPS host)

```bash
crontab -e
```

```cron
# Daily full backup at 3:00 AM
0 3 * * * curl -s -X POST http://localhost:3000/api/backup/run \
  -H "X-Cron-Secret: YOUR_CRON_SECRET" -H "Content-Type: application/json" \
  -d '{"type":"full"}' >> /var/log/velocitycms-backup.log 2>&1

# SSL certificate auto-renewal (twice daily, skips if not due)
0 0,12 * * * cd /opt/velocitycms && \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml exec certbot certbot renew --quiet && \
  docker compose -f docker-compose.yml -f docker-compose.prod.yml exec nginx nginx -s reload
```

---

## Development

```bash
# Start dependencies
docker compose up -d postgres redis

# Install packages
npm install

# Apply migrations and generate Prisma client
npx prisma migrate dev
npx prisma db seed

# Start dev server
npm run dev
```

Open: `http://localhost:3000`
Admin: `http://localhost:3000/admin/dashboard`

---

## Subsequent Deploys

```bash
cd /opt/velocitycms
chmod +x deploy.sh backup-before-deploy.sh
./deploy.sh
```

The deploy script:
1. Creates a pre-deploy database backup (`backup-before-deploy.sh`)
2. Pulls latest code from `main`
3. Updates upstream Docker images
4. Builds the Next.js container
5. Runs `prisma migrate deploy`
6. Restarts only the Next.js container (other services unaffected)
7. Runs a health check

---

## Available Scripts

| Script               | Description                                            |
|----------------------|--------------------------------------------------------|
| `npm run dev`        | Start development server                               |
| `npm run build`      | Production build                                       |
| `npm run start`      | Start production server (after build)                  |
| `npm run lint`       | ESLint check                                           |
| `npm run perf-check` | SEO / content quality audit on all published posts     |

---

## Headless API

All public endpoints require `X-API-Key: sk-...` header.
Generate and manage keys at `/admin/settings` → **Chei API** tab.

| Method | Endpoint                       | Description                    |
|--------|--------------------------------|--------------------------------|
| GET    | `/api/public/posts`            | List posts (paginated)         |
| GET    | `/api/public/posts/[slug]`     | Full post with tags + media    |
| GET    | `/api/public/pages/[slug]`     | Full static page               |
| GET    | `/api/public/categories`       | Nested category tree           |
| GET    | `/api/public/tags`             | Tags with post counts          |

Query params for `/api/public/posts`:
- `page`, `limit` (max 100)
- `category=slug`
- `search=keyword`
- `status=published|draft|all`
- `fields=id,title,slug,...` — sparse fieldset

### On-demand revalidation

```bash
curl -X POST https://yourdomain.com/api/revalidate \
  -H "Content-Type: application/json" \
  -H "x-cron-secret: YOUR_CRON_SECRET" \
  -d '{"type": "post", "path": "/blog/my-article"}'
```

Types: `page`, `post`, `category`, `all`

---

## Environment Variables Reference

| Variable                | Required | Description                                     |
|-------------------------|----------|-------------------------------------------------|
| `DATABASE_URL`          | ✓        | PostgreSQL connection string                    |
| `AUTH_SECRET`           | ✓        | NextAuth JWT secret (32+ chars)                 |
| `NEXTAUTH_URL`          | ✓        | Public URL (e.g. `https://yourdomain.com`)      |
| `REDIS_URL`             | ✓        | Redis connection string                         |
| `CRON_SECRET`           | ✓        | Shared secret for cron/webhook endpoints        |
| `INTERNAL_API_KEY`      | ✓        | Internal service-to-service auth key            |
| `BACKUP_PATH`           | ✓        | Filesystem path for backup storage              |
| `POSTGRES_PASSWORD`     | prod     | Docker PostgreSQL password (prod only)          |
| `ANTHROPIC_API_KEY`     |          | Claude API key (alt text, GEO scoring)          |
| `BREVO_API_KEY`         |          | Brevo SMTP API key (email notifications)        |
| `BREVO_FROM_EMAIL`      |          | Sender address for notification emails          |
| `CMS_PUBLISHER_TOKEN`   |          | Default publisher integration token             |
| `CORS_ALLOWED_ORIGINS`  |          | Comma-separated origins for headless API CORS   |
| `PAGESPEED_API_KEY`     |          | Google PageSpeed Insights API key               |
| `UMAMI_WEBSITE_ID`      |          | Umami analytics site ID                         |
| `UMAMI_URL`             |          | Umami instance URL                              |

---

## Architecture Notes

- **ISR cache TTLs:** Homepage 30min · Blog/category listings 1h · Articles 2h · Static pages 24h
- **On-demand revalidation:** `POST /api/revalidate` + automatic on publish/update
- **Rate limits (app):** Login 5/15min per email · Uploads 20/h per user · Public API 200/min per IP
- **Rate limits (nginx):** Auth 5/min · API 60/min · General 200/min — all with burst
- **Security headers:** X-Frame-Options DENY · X-Content-Type-Options · Referrer-Policy · Permissions-Policy · HSTS
- **SSL:** Let's Encrypt via certbot, auto-renewed twice daily
- **Backups:** Daily full backup via cron · Pre-deploy backup before every deploy · 30-day retention
