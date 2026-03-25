/**
 * GET  /api/not-found-log  — paginated 404 log for the active site
 * DELETE /api/not-found-log/[id] — handled in [id]/route.ts
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Ensure siteId is always in where clause for data isolation

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const page  = Math.max(1, parseInt(req.nextUrl.searchParams.get('page')  ?? '1'))
  const limit = Math.min(200, parseInt(req.nextUrl.searchParams.get('limit') ?? '50'))
  const skip  = (page - 1) * limit

  const [logs, total] = await prisma.$transaction([
    prisma.notFoundLog.findMany({
      where: { siteId },
      orderBy: { hits: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notFoundLog.count({ where: { siteId } }),
  ])

  return NextResponse.json({ logs, total, page, limit, totalPages: Math.ceil(total / limit) })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // Clear all 404 logs for the site
  await prisma.notFoundLog.deleteMany({ where: { siteId } })
  return NextResponse.json({ success: true })
}
