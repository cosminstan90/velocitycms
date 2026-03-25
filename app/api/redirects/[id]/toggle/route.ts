import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { refreshRedirectsCache } from '@/lib/redis/redirects'

type Params = { params: Promise<{ id: string }> }

export async function PUT(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const existing = await prisma.redirect.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const redirect = await prisma.redirect.update({
    where: { id },
    data: { isActive: !existing.isActive },
  })

  await refreshRedirectsCache(existing.siteId)
  return NextResponse.json({ redirect })
}
