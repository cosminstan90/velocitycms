/**
 * lib/rate-limit.ts
 *
 * Simple sliding-window rate limiter backed by Redis (ioredis).
 * Uses fixed window per-minute counters with INCR + EXPIRE.
 *
 * Fails open on Redis errors so application availability is never
 * blocked by a caching layer failure.
 *
 * Usage:
 *   const result = await rateLimit(`upload:${userId}`, 20, 3600)
 *   if (!result.allowed) return rateLimitResponse(result)
 */

import { redis } from '@/lib/redis/client'
import { NextResponse } from 'next/server'

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetIn: number   // seconds until window resets
}

/**
 * Check and increment a rate limit counter.
 *
 * @param key           Unique key identifying the subject (e.g. "upload:userId")
 * @param limit         Maximum allowed requests per window
 * @param windowSeconds Length of the window in seconds
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const windowId = Math.floor(now / windowSeconds)
  const redisKey = `rl:${key}:${windowId}`

  try {
    const count = await redis.incr(redisKey)
    if (count === 1) {
      // First request in window — set TTL
      await redis.expire(redisKey, windowSeconds)
    }

    const remaining = Math.max(0, limit - count)
    const resetIn = windowSeconds - (now % windowSeconds)

    return { allowed: count <= limit, limit, remaining, resetIn }
  } catch {
    // Redis unavailable — fail open (never block legitimate traffic)
    return { allowed: true, limit, remaining: limit, resetIn: windowSeconds }
  }
}

/**
 * Returns a 429 NextResponse with standard rate-limit headers.
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { error: 'Too many requests', retryAfter: result.resetIn },
    {
      status: 429,
      headers: {
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(result.resetIn),
        'Retry-After': String(result.resetIn),
      },
    }
  )
}

/**
 * Get the client IP from a request (respects X-Forwarded-For from trusted proxies).
 */
export function getClientIp(req: Request): string {
  const forwarded = (req.headers as Headers).get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return 'unknown'
}
