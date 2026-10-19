import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hasSiteAccess } from '@/lib/site-access'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const log = await prisma.notFoundLog.findUnique({ where: { id }, select: { id: true, siteId: true } })
  // Already gone: keep the previous idempotent success response
  if (!log) return NextResponse.json({ success: true })
  if (!(await hasSiteAccess(session.user.id, log.siteId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.notFoundLog.delete({ where: { id } }).catch(() => {})
  return NextResponse.json({ success: true })
}
