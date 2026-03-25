/**
 * API key authentication helper.
 * Validates X-API-Key header using bcryptjs, with Redis caching (5 min TTL).
 * Uses keyPrefix for fast DB lookup to avoid iterating all keys.
 */

import { compare } from 'bcryptjs'
import { createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis/client'

export interface ApiKeyContext {
  siteId: string
  keyId: string
}

/**
 * Validates an API key string and returns its context, or null if invalid.
 * Results are cached in Redis for 5 minutes to amortize bcrypt cost.
 */
export async function validateApiKey(rawKey: string): Promise<ApiKeyContext | null> {
  if (!rawKey.startsWith('sk-') || rawKey.length < 11) return null

  // Redis cache: keyed by SHA-256(rawKey) prefix — never stores the raw key
  const cacheKey = `apikey:${createHash('sha256').update(rawKey).digest('hex').slice(0, 40)}`

  try {
    const cached = await redis.get(cacheKey)
    if (cached) {
      const ctx = JSON.parse(cached) as ApiKeyContext
      // Update lastUsedAt asynchronously
      prisma.aPIKey.update({ where: { id: ctx.keyId }, data: { lastUsedAt: new Date() } }).catch(() => {})
      return ctx
    }
  } catch {
    // Redis unavailable — proceed without cache
  }

  // Use the keyPrefix for fast DB lookup (sk- + first 8 hex chars)
  const keyPrefix = rawKey.slice(0, 11)

  const candidates = await prisma.aPIKey.findMany({
    where: { keyPrefix, isActive: true },
    select: { id: true, siteId: true, keyHash: true },
  })

  for (const candidate of candidates) {
    const match = await compare(rawKey, candidate.keyHash)
    if (match && candidate.siteId) {
      const ctx: ApiKeyContext = { siteId: candidate.siteId, keyId: candidate.id }

      // Cache for 5 minutes
      try {
        await redis.setex(cacheKey, 300, JSON.stringify(ctx))
      } catch {}

      // Update lastUsedAt
      prisma.aPIKey.update({ where: { id: candidate.id }, data: { lastUsedAt: new Date() } }).catch(() => {})

      return ctx
    }
  }

  return null
}
