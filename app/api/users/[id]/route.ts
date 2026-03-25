import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const { id } = await params
  const { name, role } = await req.json()

  // Verify user belongs to this site before mutating
  const access = await prisma.userSiteAccess.findUnique({
    where: { userId_siteId: { userId: id, siteId } },
  })
  if (!access) return NextResponse.json({ error: 'User not found on this site' }, { status: 404 })

  const user = await prisma.user.update({
    where: { id },
    data: { ...(name !== undefined && { name }), ...(role !== undefined && { role }) },
    select: { id: true, email: true, name: true, role: true },
  })

  return NextResponse.json({ user })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
  }

  // Verify user belongs to this site before removing
  const access = await prisma.userSiteAccess.findUnique({
    where: { userId_siteId: { userId: id, siteId } },
  })
  if (!access) return NextResponse.json({ error: 'User not found on this site' }, { status: 404 })

  // Remove site access; only hard-delete user if they have no other site memberships
  await prisma.userSiteAccess.delete({ where: { userId_siteId: { userId: id, siteId } } })
  const remaining = await prisma.userSiteAccess.count({ where: { userId: id } })
  if (remaining === 0) await prisma.user.delete({ where: { id } })

  return NextResponse.json({ success: true })
}
