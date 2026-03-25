import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { getSiteIdFromRequest } from '@/lib/site'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const users = await prisma.user.findMany({
    where: { siteId },
    select: { id: true, email: true, name: true, role: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ users })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const { email, name, password, role } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  try {
    const user = await prisma.user.create({
      data: { siteId, email, name, passwordHash, role: role ?? 'EDITOR' },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    })
    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 })
  }
}
