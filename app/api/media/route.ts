import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getSiteIdFromRequest } from '@/lib/site'
import { prisma } from '@/lib/prisma'

// ─── GET — list media for a site ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get('page') ?? '1'))
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') ?? '40'))
  const skip = (page - 1) * limit
  const typeFilter = req.nextUrl.searchParams.get('type')   // 'image' | 'pdf' | null
  const search = req.nextUrl.searchParams.get('search') ?? ''

  const where = {
    siteId,
    ...(typeFilter === 'image' && { mimeType: { startsWith: 'image/' } }),
    ...(typeFilter === 'pdf'   && { mimeType: 'application/pdf' }),
    ...(search && { originalName: { contains: search, mode: 'insensitive' as const } }),
  }

  const [media, total] = await prisma.$transaction([
    prisma.media.findMany({ where, orderBy: { uploadedAt: 'desc' }, skip, take: limit }),
    prisma.media.count({ where }),
  ])

  return NextResponse.json({ media, total, page, limit, totalPages: Math.ceil(total / limit) })
}
