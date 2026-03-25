/**
 * GET /api/public/posts/[slug]
 * Returns full post data including contentHtml + schemaMarkup.
 * Requires X-API-Key header.
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

  const post = await prisma.post.findFirst({
    where: { siteId, slug },
    include: {
      category: { select: { id: true, name: true, slug: true, parentId: true } },
      author: { select: { name: true } },
      tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
    },
  })

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  // Resolve featured image
  let featuredImageUrl: string | null = null
  if (post.featuredImageId) {
    const media = await prisma.media.findUnique({
      where: { id: post.featuredImageId },
      select: { url: true, altText: true, width: true, height: true },
    })
    if (media) featuredImageUrl = media.url
  }

  return NextResponse.json({
    post: {
      ...post,
      tags: post.tags.map((t) => t.tag),
      featuredImageUrl,
    },
  })
}
