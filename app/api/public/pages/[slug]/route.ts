/**
 * GET /api/public/pages/[slug]
 * Returns full page data. Requires X-API-Key header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth/api-key'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const ctx = await validateApiKey(req.headers.get('x-api-key') ?? '')
  if (!ctx) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })

  const { slug } = await params
  const { siteId } = ctx

  const page = await prisma.page.findFirst({
    where: { siteId, slug },
    include: {
      author: { select: { name: true } },
    },
  })

  if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 })

  return NextResponse.json({ page })
}
