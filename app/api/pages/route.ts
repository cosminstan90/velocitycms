import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'
import { slugify } from '@/lib/slugify'
import { appendRevision } from '@/lib/revisions'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Ensure siteId is always in where clause for data isolation

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const p = req.nextUrl.searchParams
  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const status = p.get('status') as string | null
  const search = p.get('search') as string | null
  const page = Math.max(1, parseInt(p.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(p.get('limit') ?? '20')))
  const skip = (page - 1) * limit

  const where = {
    siteId,
    ...(status && { status: status as any }),
    ...(search && {
      title: { contains: search, mode: 'insensitive' as const },
    }),
  }

  const [pages, total] = await Promise.all([
    prisma.page.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true, title: true, slug: true, status: true, template: true,
        metaTitle: true, metaDescription: true, publishedAt: true,
        createdAt: true, updatedAt: true,
        author: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.page.count({ where }),
  ])

  return NextResponse.json({
    pages,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, contentJson, contentHtml, template, metaTitle, metaDescription, canonicalUrl, noIndex, schemaMarkup } = body
  const siteId = body.siteId ?? session.user.activeSiteId

  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const slug = body.slug ? slugify(body.slug) : slugify(title)

  const existing = await prisma.page.findFirst({ where: { siteId, slug } })
  if (existing) return NextResponse.json({ error: 'Slug already exists for this site' }, { status: 409 })

  const initialRevisions = appendRevision([], {
    savedAt: new Date().toISOString(),
    savedBy: session.user.id,
    title,
    contentJson: contentJson ?? {},
    contentHtml: contentHtml ?? '',
    metaTitle: metaTitle ?? null,
    metaDescription: metaDescription ?? null,
    status: 'DRAFT',
  })

  const page = await prisma.page.create({
    data: {
      siteId,
      title,
      slug,
      contentJson: contentJson ?? {},
      contentHtml: contentHtml ?? '',
      status: 'DRAFT',
      template: template ?? 'default',
      metaTitle: metaTitle ?? null,
      metaDescription: metaDescription ?? null,
      canonicalUrl: canonicalUrl ?? null,
      noIndex: noIndex ?? false,
      schemaMarkup: schemaMarkup ?? null,
      authorId: session.user.id,
      revisions: initialRevisions as any,
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  })

  return NextResponse.json({ page }, { status: 201 })
}
