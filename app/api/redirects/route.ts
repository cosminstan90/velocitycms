import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'
import { refreshRedirectsCache } from '@/lib/redis/redirects'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Ensure siteId is always in where clause for data isolation

// ─── GET — paginated list ─────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const page  = Math.max(1, parseInt(req.nextUrl.searchParams.get('page')  ?? '1'))
  const limit = Math.min(100, parseInt(req.nextUrl.searchParams.get('limit') ?? '50'))
  const search = req.nextUrl.searchParams.get('search') ?? ''
  const skip = (page - 1) * limit

  const where = {
    siteId,
    ...(search && {
      OR: [
        { fromPath: { contains: search } },
        { toPath:   { contains: search } },
      ],
    }),
  }

  const [redirects, total] = await prisma.$transaction([
    prisma.redirect.findMany({
      where,
      orderBy: { hits: 'desc' },
      skip,
      take: limit,
    }),
    prisma.redirect.count({ where }),
  ])

  // Stats for the active site
  const [activeCount, totalHits] = await Promise.all([
    prisma.redirect.count({ where: { siteId, isActive: true } }),
    prisma.redirect.aggregate({ where: { siteId }, _sum: { hits: true } }),
  ])

  return NextResponse.json({
    redirects,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    stats: {
      total,
      active: activeCount,
      totalHits: totalHits._sum.hits ?? 0,
    },
  })
}

// ─── POST — create redirect ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    fromPath?: string
    toPath?: string
    statusCode?: number
    siteId?: string
  }

  const siteId = body.siteId ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const { fromPath, toPath, statusCode = 301 } = body

  // Validate
  if (!fromPath?.startsWith('/'))
    return NextResponse.json({ error: 'fromPath must start with /' }, { status: 422 })
  if (!toPath || (!toPath.startsWith('/') && !toPath.startsWith('https://') && !toPath.startsWith('http://')))
    return NextResponse.json({ error: 'toPath must start with / or http(s)://' }, { status: 422 })
  if (fromPath === toPath)
    return NextResponse.json({ error: 'Circular redirect: fromPath and toPath are identical' }, { status: 422 })
  if (![301, 302, 307, 308].includes(statusCode))
    return NextResponse.json({ error: 'statusCode must be 301, 302, 307, or 308' }, { status: 422 })

  try {
    const redirect = await prisma.redirect.create({
      data: { siteId, fromPath, toPath, statusCode },
    })
    await refreshRedirectsCache(siteId)
    return NextResponse.json({ redirect }, { status: 201 })
  } catch (e: unknown) {
    if ((e as { code?: string }).code === 'P2002')
      return NextResponse.json({ error: `A redirect from ${fromPath} already exists` }, { status: 409 })
    throw e
  }
}
