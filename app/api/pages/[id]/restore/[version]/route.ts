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

  const page = await prisma.page.findUnique({ where: { id } })
  if (!page) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const revisions = Array.isArray(page.revisions) ? (page.revisions as unknown as Revision[]) : []
  const target = revisions.find((r) => r.version === versionNum)
  if (!target) return NextResponse.json({ error: `Revision v${versionNum} not found` }, { status: 404 })

  const updatedRevisions = appendRevision(page.revisions, {
    savedAt: new Date().toISOString(),
    savedBy: session.user.id,
    title: page.title,
    contentJson: page.contentJson,
    contentHtml: page.contentHtml,
    metaTitle: page.metaTitle,
    metaDescription: page.metaDescription,
    status: page.status,
  })

  const updated = await prisma.page.update({
    where: { id },
    data: {
      title: target.title,
      contentJson: target.contentJson as any,
      contentHtml: target.contentHtml,
      metaTitle: target.metaTitle,
      metaDescription: target.metaDescription,
      revisions: updatedRevisions as any,
    },
    select: { id: true, title: true, contentJson: true, contentHtml: true, metaTitle: true, metaDescription: true, updatedAt: true },
  })

  return NextResponse.json({ page: updated, restoredFrom: versionNum })
}
