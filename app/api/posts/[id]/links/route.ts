/**
 * GET /api/posts/[id]/links
 *
 * Returns all links already present in the post's contentHtml,
 * classified as internal or external.
 *
 * Response:
 *   {
 *     internal: [{ href, text }],
 *     external: [{ href, text }],
 *   }
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getLinksAlreadyInContent } from '@/lib/seo/internal-linker'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const post = await prisma.post.findUnique({
    where: { id },
    select: { contentHtml: true },
  })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const links = getLinksAlreadyInContent(post.contentHtml)

  return NextResponse.json(links)
}
