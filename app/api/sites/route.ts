import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

async function isSiteAdmin(userId: string, siteId: string): Promise<boolean> {
  const access = await prisma.userSiteAccess.findUnique({ where: { userId_siteId: { userId, siteId } } })
  return !!access && access.role === 'ADMIN'
}

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const accesses = await prisma.userSiteAccess.findMany({
    where: { userId: session.user.id },
    include: {
      site: { select: { id: true, name: true, domain: true, description: true, timezone: true, language: true, isActive: true, createdAt: true } },
    },
    orderBy: { site: { name: 'asc' } },
  })

  const data = await Promise.all(
    accesses.map(async (access) => {
      const { site } = access

      const [postCount, publishedCount, pageCount, mediaCount, storageAggregate, lastPublished] =
        await prisma.$transaction([
          prisma.post.count({ where: { siteId: site.id } }),
          prisma.post.count({ where: { siteId: site.id, status: 'PUBLISHED' } }),
          prisma.page.count({ where: { siteId: site.id } }),
          prisma.media.count({ where: { siteId: site.id } }),
          prisma.media.aggregate({ where: { siteId: site.id }, _sum: { size: true } }),
          prisma.post.findFirst({
            where: { siteId: site.id, status: 'PUBLISHED', publishedAt: { not: null } },
            orderBy: { publishedAt: 'desc' },
            select: { publishedAt: true },
          }),
        ])

      return {
        ...site,
        accessRole: access.role,
        postCount,
        publishedCount,
        pageCount,
        mediaCount,
        lastPublishedAt: lastPublished?.publishedAt ?? null,
        storageUsed: storageAggregate._sum.size ?? 0,
      }
    })
  )

  return NextResponse.json({ sites: data })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const body = await req.json()
  const { name, domain, description, timezone = 'Europe/Bucharest', language = 'ro', isActive = true } = body
  if (!name || !domain) {
    return NextResponse.json({ error: 'name and domain required' }, { status: 400 })
  }

  const normalizedDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/$/, '')

  const existingSite = await prisma.site.findUnique({ where: { domain: normalizedDomain } })
  if (existingSite) {
    return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })
  }

  const site = await prisma.site.create({
    data: {
      name,
      domain: normalizedDomain,
      description: description ?? null,
      timezone,
      language,
      isActive,
    },
  })

  await prisma.seoSettings.create({
    data: {
      siteId: site.id,
      siteName: name,
      siteUrl: `https://${normalizedDomain}`,
      gscConnected: false,
    },
  })

  await prisma.siteScheduleSettings.create({
    data: {
      siteId: site.id,
      maxPerDay: 3,
      preferredTimes: ['09:00', '14:00', '18:00'],
      timezone,
      isActive: true,
    },
  })

  await prisma.userSiteAccess.create({
    data: {
      userId: session.user.id,
      siteId: site.id,
      role: 'ADMIN',
    },
  })

  return NextResponse.json({ site }, { status: 201 })
}
