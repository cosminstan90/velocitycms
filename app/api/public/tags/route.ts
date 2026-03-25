/**
 * GET /api/public/tags
 * Returns all tags with post counts. Requires X-API-Key header.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth/api-key'

export async function GET(req: NextRequest) {
  const ctx = await validateApiKey(req.headers.get('x-api-key') ?? '')
  if (!ctx) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })

  const tags = await prisma.tag.findMany({
    where: { siteId: ctx.siteId },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { posts: true } },
    },
    orderBy: { posts: { _count: 'desc' } },
  })

  return NextResponse.json({
    tags: tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, postCount: t._count.posts })),
    total: tags.length,
  })
}
