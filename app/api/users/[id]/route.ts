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

  const user = await prisma.user.update({
    where: { id, siteId },
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

  await prisma.user.delete({ where: { id, siteId } })
  return NextResponse.json({ success: true })
}
