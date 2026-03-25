/**
 * GET  /api/publisher/settings  — masked token info + recent received posts
 * POST /api/publisher/settings  — regenerate publisher token for the active site
 * @eslint data-isolation: siteId is injected via middleware and used for data isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import { getSiteIdFromRequest } from '@/lib/site'

function maskToken(token: string): string {
  if (token.length <= 4) return '••••'
  return '•'.repeat(Math.max(8, token.length - 4)) + token.slice(-4)
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // Current token: DB takes precedence over env
  const seoSettings = await prisma.seoSettings.findUnique({
    where: { siteId },
    select: { publisherToken: true, siteUrl: true },
  })

  const rawToken = seoSettings?.publisherToken ?? process.env.CMS_PUBLISHER_TOKEN ?? ''
  const tokenMasked = rawToken ? maskToken(rawToken) : null
  const hasToken = rawToken.length > 0

  // CMS URL for endpoint display
  const cmsUrl = seoSettings?.siteUrl ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const endpointUrl = `${cmsUrl.replace(/\/$/, '')}/api/publisher/receive`

  // Last 10 posts received via publisher
  const recentPosts = await prisma.post.findMany({
    where: { siteId, sourceType: 'publisher' },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      publisherCampaign: true,
      publisherPageId: true,
      geoScore: true,
      scheduledAt: true,
      publishedAt: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ tokenMasked, hasToken, endpointUrl, recentPosts })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // Verify site exists
  const site = await prisma.site.findUnique({ where: { id: siteId }, select: { id: true } })
  if (!site) return NextResponse.json({ error: 'Site not found' }, { status: 404 })

  // Generate a new cryptographically secure token
  const newToken = randomBytes(32).toString('hex') // 64-char hex string

  // Upsert SeoSettings with the new token
  await prisma.seoSettings.upsert({
    where: { siteId },
    update: { publisherToken: newToken },
    create: {
      siteId,
      siteName: 'Site',
      siteUrl: process.env.NEXTAUTH_URL ?? 'http://localhost:3000',
      publisherToken: newToken,
    },
  })

  return NextResponse.json({ token: newToken, tokenMasked: maskToken(newToken) })
}
