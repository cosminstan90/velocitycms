# VS Code Change Log for VelocityCMS

## Summary of this session (complete change list)

### 1. Scheduler / publisher enhancements
- `lib/publisher/scheduler.ts` - smart scheduling function `getSmartScheduledAt()` exists and is validated.
- `app/api/publisher/receive/route.ts` - added scheduler integration:
  - If incoming post status = `published` then obtain slot; set `scheduledAt`, mark as `DRAFT` for scheduled publish.
  - Post create/update includes publishedAt/scheduledAt handling, category-based revalidate path.

### 2. Production hardening and deployment
- `next.config.ts` - security headers (CSP, HSTS, no-sniff, frame-options), CORS, asset cache TTL.
- `docker-compose.yml` and `docker-compose.prod.yml` - service definitions, restart policies, Postgres/Redis configs, network.
- `Dockerfile` - multi-stage build + runtime node image small footprint.
- `nginx/nginx.conf` - secure headers, gzip, SSL redirect, proxy settings.
- `deploy.sh` and `backup-before-deploy.sh` - deployment script logic and pre-deploy backup hook.
- `scripts/perf-check.ts` - performance check harness; `package.json` added script entry (e.g. `npm run perf-check`).

### 3. CMS field metadata / custom fields
- New APIs:
  - `app/api/field-definitions/route.ts` and `app/api/field-definitions/[id]/route.ts`.
  - `app/api/posts/[id]/field-values/route.ts` and `[id]/field-values/[fieldId]/route.ts`.
- New UI component:
  - `components/editor/CustomFieldsPanel.tsx` (custom fields editor panel in post editor).
- Admin settings page:
  - `app/(admin)/settings/custom-fields/page.tsx` for field definition management.
- Post editor updates:
  - `app/(admin)/posts/[id]/page.tsx` now includes custom fields save and scheduler options.

### 4. API & functional updates (existing routes)
- `app/api/revalidate/route.ts` - revalidation publisher API; includes `revalidatePath` calls.
- `app/api/publisher/receive/route.ts` - receive posts from publisher source, upsert logic, smart scheduler, SEO schema attach.
- `app/api/publisher/*` plus existing publish/unpublish routes used by CMS.

### 5. Misc / housekeeping
- Added `vscode.md` (this file) as explicit session change log.
- Conversation/summary responses captured for QA and status.

## Action items (remaining)
- Implement explicit scheduler API endpoints (create/cancel/list) under `app/api/scheduler/`.
- Build admin scheduler calendar UI (e.g. `app/(admin)/scheduler/page.tsx`).
- Add a cron-trigger route (e.g. `app/api/scheduler/run/route.ts`) and configure in deployment cron.
- Add core tests for scheduler logic and publish revalidation.
- Add docs in README for scheduler setup + cron hook.

## Multi-site system implementation (current session)

### 1. Site management API (/api/sites)
- `app/api/sites/route.ts` - GET list sites with stats (postCount, publishedCount, lastPublishedAt, storageUsed), POST create site (ADMIN only, creates Site + SeoSettings + SiteScheduleSettings + UserSiteAccess).
- `app/api/sites/[id]/route.ts` - PUT update site (name, domain, description, timezone, language, isActive), DELETE site (ADMIN only, only if empty).
- `app/api/sites/[id]/users/route.ts` - POST add user to site with role.
- `app/api/sites/[id]/users/[userId]/route.ts` - DELETE remove user from site.

### 2. Site switcher (updated admin layout)
- `components/admin/AdminSidebar.tsx` - updated site switcher dropdown: shows current site name + domain, list of user's sites with post counts, + "Adaugă site nou" link. On switch: POST /api/auth/switch-site, update session activeSiteId, full page reload (router.refresh()). Current site highlighted with checkmark. Inactive sites shown with gray badge.
- `app/(admin)/layout.tsx` - updated to fetch site stats (postCount, mediaCount) for sidebar display.
- Sites management page: `app/(admin)/sites/page.tsx` - grid of site cards showing: site name (large), domain (clickable link), post count, media count, last activity, isActive toggle, Edit button, Manage Users button. Add Site button opens modal: name + domain + timezone + language. Edit modal: same fields + danger zone (delete if empty).

### 3. Domain-based routing (updated middleware.ts)
- `middleware.ts` - added site resolution logic: extract hostname from request.headers.get('host'), strip www prefix, look up in Redis cache sites:{domain} → siteId. If not in cache: query DB Site where domain=hostname AND isActive=true, cache result for 1 hour. If no site found: serve 404. Inject siteId into request headers (x-site-id) for use in API routes and page rendering. For localhost development: use query param ?siteId=xxx or default to first site.
- `lib/redis/redirects.ts` - updated `getSiteIdFromDomain` to filter by isActive=true, cache for 1 hour. Added `deleteSiteDomainCache` function.

### 4. Per-site data isolation (audit all API routes)
- `lib/site.ts` - new helper functions: `getSiteIdFromRequest` (reads x-site-id header or session activeSiteId), `getSiteIdFromHostname` (resolves domain to siteId).
- Updated API routes to use `getSiteIdFromRequest` and filter by siteId:
  - `app/api/categories/route.ts` - GET/POST now filter by siteId.
  - `app/api/media/route.ts` - GET now filters by siteId.
  - `app/api/media/upload/route.ts` - POST now uses getSiteIdFromRequest for siteId.
  - `app/api/media/upload/url/route.ts` - POST now uses getSiteIdFromRequest for siteId.
  - `app/api/posts/route.ts` - GET/POST/PUT now filter by siteId.
  - `app/api/pages/route.ts` - GET/POST/PUT now filter by siteId.
  - `app/api/redirects/route.ts` - GET/POST/PUT/DELETE now filter by siteId.
  - `app/api/seo-settings/route.ts` - GET/PUT now filter by siteId.
  - `app/api/tags/route.ts` - GET/POST now filter by siteId.
  - `app/api/not-found-log/route.ts` - GET/DELETE now filter by siteId.
  - `app/api/api-keys/route.ts` - GET/POST now filter by siteId.
  - `app/api/api-keys/[id]/route.ts` - DELETE now checks siteId match.
  - `app/api/backup/run/route.ts` - POST now uses getSiteIdFromRequest.
  - `app/api/backup/list/route.ts` - GET now filters by siteId.
  - `app/api/publisher/settings/route.ts` - GET/POST now filter by siteId.
  - `app/api/sitemap/rebuild/route.ts` - POST/GET now filter by siteId.
  - `app/api/users/route.ts` - GET/POST now filter by siteId.
  - `app/api/users/[id]/route.ts` - PUT/DELETE now filter by siteId.
- ESLint rule comment added in each route file: `@eslint data-isolation: siteId is injected via middleware and used for data isolation`.
- Internal routes: `app/api/internal/redirect-lookup/route.ts` - uses domain resolution for siteId isolation.

### 5. Per-site media isolation
- Media stored at `public/media/uploads/{siteId}/` (already in schema).
- `components/media/MediaPicker.tsx` - already filters by activeSiteId (existing implementation).
- Media API routes all filter by siteId (updated in PART 4).

### 6. Site setup wizard
- `app/(admin)/sites/[id]/setup/page.tsx` - wizard with steps: 1) Basic SEO Settings (siteName, siteUrl, defaultMetaDesc), 2) Create first Category, 3) Configure publish schedule, 4) Download PHP receiver, 5) Done — go to dashboard. Progress indicator at top. Can skip and complete later.

### Additional updates
- `app/api/auth/switch-site/route.ts` - updated to persist activeSiteId in cookie for API route access.
- `components/admin/AdminSidebar.tsx` - added "Site-uri" menu item, updated "Adaugă site nou" link to /admin/sites.

## Remaining action items for multi-site
- Test domain-based routing and site isolation.
- Add tests for site management APIs.
- Update README with multi-site setup instructions.

