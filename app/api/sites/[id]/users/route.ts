import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function isSiteAdmin(userId: string, siteId: string): Promise<boolean> {
  const access = await prisma.userSiteAccess.findUnique({ where: { userId_siteId: { userId, siteId } } })
  return !!access && access.role === 'ADMIN'
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = req.nextUrl.pathname.split('/')[3] // /api/sites/[id]/users
  if (!siteId) return NextResponse.json({ error: 'site id required' }, { status: 400 })

  if (!(await isSiteAdmin(session.user.id, siteId))) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, role } = body
  if (!userId || !role) return NextResponse.json({ error: 'userId and role required' }, { status: 400 })
  if (!['ADMIN', 'EDITOR', 'AUTHOR'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const existing = await prisma.userSiteAccess.findUnique({ where: { userId_siteId: { userId, siteId } } })
  if (existing) {
    const updated = await prisma.userSiteAccess.update({ where: { id: existing.id }, data: { role } })
    return NextResponse.json({ access: updated })
  }

  const access = await prisma.userSiteAccess.create({ data: { userId, siteId, role } })
  return NextResponse.json({ access }, { status: 201 })
}
