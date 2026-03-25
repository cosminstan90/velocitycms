/**
 * Redis cache layer for 301/302 redirect lookups.
 *
 * Data model:
 *   Redis hash  redirects:{siteId}  → field: fromPath, value: JSON{toPath, statusCode, id}
 *   Redis string sites:{domain}     → siteId
 *
 * The hash has no TTL — it is invalidated on every redirect mutation.
 */

import { redis } from './client'
import { prisma } from '@/lib/prisma'

// ─── Key helpers ─────────────────────────────────────────────────────────────
const redirectsKey = (siteId: string) => `redirects:${siteId}`
const siteKey = (domain: string) => `sites:${domain}`

export interface CachedRedirect {
  toPath: string
  statusCode: number
  id: string
}

// ─── Cache management ─────────────────────────────────────────────────────────

/**
 * Reload all active redirects for a site from DB into Redis.
 * Called after any redirect create / update / delete.
 */
export async function refreshRedirectsCache(siteId: string): Promise<void> {
  try {
    const redirects = await prisma.redirect.findMany({
      where: { siteId, isActive: true },
      select: { fromPath: true, toPath: true, statusCode: true, id: true },
    })

    const key = redirectsKey(siteId)
    const pipeline = redis.pipeline()
    pipeline.del(key)

    for (const r of redirects) {
      const val: CachedRedirect = { toPath: r.toPath, statusCode: r.statusCode, id: r.id }
      pipeline.hset(key, r.fromPath, JSON.stringify(val))
    }

    await pipeline.exec()
  } catch (err) {
    console.error('[redis/redirects] refreshRedirectsCache error:', err)
  }
}

/**
 * Look up a redirect for (siteId, fromPath).
 * Tries Redis first; falls back to DB on cache miss.
 */
export async function getRedirectFromCache(
  siteId: string,
  fromPath: string
): Promise<CachedRedirect | null> {
  try {
    const raw = await redis.hget(redirectsKey(siteId), fromPath)
    if (raw) return JSON.parse(raw) as CachedRedirect
  } catch {
    // Redis unavailable — fall through to DB
  }

  // DB fallback
  try {
    const r = await prisma.redirect.findUnique({
      where: { siteId_fromPath: { siteId, fromPath } },
      select: { toPath: true, statusCode: true, id: true, isActive: true },
    })
    if (r?.isActive) return { toPath: r.toPath, statusCode: r.statusCode, id: r.id }
  } catch {
    // DB also unavailable
  }

  return null
}

// ─── Site domain → siteId cache ───────────────────────────────────────────────

/** Cache domain → siteId in Redis (indefinite TTL). */
export async function cacheSiteDomain(domain: string, siteId: string): Promise<void> {
  try {
    await redis.set(siteKey(domain), siteId)
  } catch {
    // Non-fatal
  }
}

/**
 * Resolve domain to siteId.
 * Tries Redis first; falls back to DB lookup with auto-caching.
 */
export async function getSiteIdFromDomain(domain: string): Promise<string | null> {
  // Strip port if present (e.g. localhost:3000 → localhost)
  const host = domain.split(':')[0]

  try {
    const cached = await redis.get(siteKey(host))
    if (cached) return cached
  } catch {
    // Fall through to DB
  }

  try {
    const site = await prisma.site.findFirst({
      where: { domain: host, isActive: true },
      select: { id: true },
    })
    if (site) {
      // Cache for 1 hour to align with requirement
      await redis.set(siteKey(host), site.id, 'EX', 3600)
      return site.id
    }
  } catch {
    // DB unavailable
  }

  return null
}

export async function deleteSiteDomainCache(domain: string): Promise<void> {
  try {
    await redis.del(siteKey(domain))
  } catch {
    // no-op
  }
}
