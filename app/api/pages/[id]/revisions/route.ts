import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hasSiteAccess } from '@/lib/site-access'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const page = await prisma.page.findUnique({ where: { id }, select: { id: true, siteId: true, revisions: true } })
  if (!page || !(await hasSiteAccess(session.user.id, page.siteId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const revisions = Array.isArray(page.revisions) ? page.revisions : []
  return NextResponse.json({ revisions: [...revisions].reverse() })
}
