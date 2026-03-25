import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function isSiteAdmin(userId: string, siteId: string): Promise<boolean> {
  const access = await prisma.userSiteAccess.findUnique({ where: { userId_siteId: { userId, siteId } } })
  return !!access && access.role === 'ADMIN'
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const segments = req.nextUrl.pathname.split('/')
  const siteId = segments[3]
  const userId = segments[5]

  if (!siteId || !userId) return NextResponse.json({ error: 'Missing siteId or userId' }, { status: 400 })

  if (!(await isSiteAdmin(session.user.id, siteId))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const existing = await prisma.userSiteAccess.findUnique({ where: { userId_siteId: { userId, siteId } } })
  if (!existing) return NextResponse.json({ error: 'User is not part of site' }, { status: 404 })

  await prisma.userSiteAccess.delete({ where: { id: existing.id } })
  return NextResponse.json({ success: true })
}
