import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { appendRevision, type Revision } from '@/lib/revisions'

type Params = { params: Promise<{ id: string; version: string }> }

export async function POST(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, version } = await params
  const versionNum = parseInt(version)

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const revisions = Array.isArray(post.revisions) ? (post.revisions as unknown as Revision[]) : []
  const target = revisions.find((r) => r.version === versionNum)
  if (!target) return NextResponse.json({ error: `Revision v${versionNum} not found` }, { status: 404 })

  // Save current state as new revision before restoring
  const updatedRevisions = appendRevision(post.revisions, {
    savedAt: new Date().toISOString(),
    savedBy: session.user.id,
    title: post.title,
    contentJson: post.contentJson,
    contentHtml: post.contentHtml,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    status: post.status,
  })

  const updated = await prisma.post.update({
    where: { id },
    data: {
      title: target.title,
      contentJson: target.contentJson as any,
      contentHtml: target.contentHtml,
      metaTitle: target.metaTitle,
      metaDescription: target.metaDescription,
      revisions: updatedRevisions as any,
    },
    select: {
      id: true, title: true, contentJson: true, contentHtml: true,
      metaTitle: true, metaDescription: true, updatedAt: true,
    },
  })

  return NextResponse.json({ post: updated, restoredFrom: versionNum })
}
