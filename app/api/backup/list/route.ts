/**
 * GET /api/backup/list?page=1&limit=20
 * Returns paginated BackupLog records with formatted file sizes.
 * @eslint data-isolation: siteId is injected via middleware and used for data isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'

function fmtSize(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = await getSiteIdFromRequest(req)
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const page  = Math.max(1, parseInt(req.nextUrl.searchParams.get('page')  ?? '1'))
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') ?? '20'))
  const skip  = (page - 1) * limit

  const [logs, total] = await prisma.$transaction([
    prisma.backupLog.findMany({
      where: { siteId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.backupLog.count({ where: { siteId } }),
  ])

  // Attach formatted size
  const formatted = logs.map((l) => ({ ...l, fileSizeFmt: fmtSize(l.fileSize) }))

  // Latest entry per type (for stats cards)
  const latestByType = await prisma.$transaction([
    prisma.backupLog.findFirst({ where: { siteId, type: 'DATABASE' }, orderBy: { createdAt: 'desc' } }),
    prisma.backupLog.findFirst({ where: { siteId, type: 'MEDIA'    }, orderBy: { createdAt: 'desc' } }),
    prisma.backupLog.findFirst({ where: { siteId, type: 'FULL'     }, orderBy: { createdAt: 'desc' } }),
  ])

  return NextResponse.json({
    logs: formatted,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    latest: {
      database: latestByType[0] ? { ...latestByType[0], fileSizeFmt: fmtSize(latestByType[0].fileSize) } : null,
      media:    latestByType[1] ? { ...latestByType[1], fileSizeFmt: fmtSize(latestByType[1].fileSize) } : null,
      full:     latestByType[2] ? { ...latestByType[2], fileSizeFmt: fmtSize(latestByType[2].fileSize) } : null,
    },
  })
}
