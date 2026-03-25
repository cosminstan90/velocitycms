/**
 * GET /api/internal/site-lookup?domain=...
 * Internal endpoint called by Edge middleware to resolve domain → siteId.
 * NOT protected by user session — protected by x-internal-key header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSiteIdFromHostname } from '@/lib/site'

export const runtime = 'nodejs' // needs ioredis + prisma (TCP sockets, crypto)

export async function GET(req: NextRequest) {
  const internalKey = req.headers.get('x-internal-key') ?? ''
  const expectedKey = process.env.INTERNAL_API_KEY ?? ''
  if (expectedKey && internalKey !== expectedKey) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const domain = req.nextUrl.searchParams.get('domain')
  if (!domain) return NextResponse.json({ siteId: null })

  const siteId = await getSiteIdFromHostname(domain)
  return NextResponse.json({ siteId })
}
