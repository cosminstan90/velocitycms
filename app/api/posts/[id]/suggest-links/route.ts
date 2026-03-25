/**
 * POST /api/posts/[id]/suggest-links
 *
 * Generates AI-powered internal link suggestions for a post using Claude Haiku.
 * Results are cached in Redis for 1 hour per post.
 *
 * Query params:
 *   force=true  — bypass cache and regenerate fresh suggestions
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import {
  getSuggestedLinks,
  invalidateLinkSuggestionsCache,
} from '@/lib/seo/internal-linker'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const force = req.nextUrl.searchParams.get('force') === 'true'

  const post = await prisma.post.findUnique({
    where: { id },
    select: { id: true, contentHtml: true, siteId: true, title: true },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Invalidate cache if force=true
  if (force) {
    await invalidateLinkSuggestionsCache(id)
  }

  try {
    const suggestions = await getSuggestedLinks(id, post.contentHtml, post.siteId)
    return NextResponse.json({ suggestions, postId: id })
  } catch (err) {
    console.error('[suggest-links] error:', err)
    return NextResponse.json(
      { error: 'Failed to generate suggestions. Check ANTHROPIC_API_KEY.' },
      { status: 500 }
    )
  }
}
