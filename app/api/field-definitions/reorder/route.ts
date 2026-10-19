import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { hasSiteAccess } from '@/lib/site-access'

export async function PUT(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body.ids)) {
    return NextResponse.json({ error: 'ids array is required' }, { status: 400 })
  }

  const ids = body.ids.filter((i: any) => typeof i === 'string')

  // Every definition must exist and belong to a site the user can access
  const found = await prisma.fieldDefinition.findMany({ where: { id: { in: ids } }, select: { id: true, siteId: true } })
  if (found.length !== new Set<string>(ids).size) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  for (const siteId of new Set(found.map((f) => f.siteId))) {
    if (!(await hasSiteAccess(session.user.id, siteId))) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  await prisma.$transaction(
    ids.map((id: string, idx: number) =>
      prisma.fieldDefinition.update({ where: { id }, data: { sortOrder: idx + 1 } })
    )
  )

  return NextResponse.json({ success: true })
}
