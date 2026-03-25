/**
 * GET /api/internal/redirect-lookup?path=...&domain=...
 * Internal endpoint called by Edge middleware to resolve redirects via Redis cache.
 * NOT protected by user session — protected by x-internal-key header.
 * @eslint data-isolation: siteId is resolved from domain and used for data isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSiteIdFromDomain, getRedirectFromCache } from '@/lib/redis/redirects'

export const runtime = 'nodejs' // needs ioredis (TCP sockets)

export async function GET(req: NextRequest) {
  const internalKey = req.headers.get('x-internal-key') ?? ''
  const expectedKey = process.env.INTERNAL_API_KEY ?? ''
  if (expectedKey && internalKey !== expectedKey) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const path   = req.nextUrl.searchParams.get('path')
  const domain = req.nextUrl.searchParams.get('domain')

  if (!path || !domain) return NextResponse.json({ redirect: null })

  const siteId = await getSiteIdFromDomain(domain)
  if (!siteId) return NextResponse.json({ redirect: null })

  const redirect = await getRedirectFromCache(siteId, path)
  return NextResponse.json({ redirect })
}
