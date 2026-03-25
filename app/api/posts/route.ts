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
  const categoryId = p.get('categoryId') as string | null
  const search = p.get('search') as string | null
  const page = Math.max(1, parseInt(p.get('page') ?? '1'))
  const limit = Math.min(100, Math.max(1, parseInt(p.get('limit') ?? '20')))
  const skip = (page - 1) * limit

  const where = {
    siteId,
    ...(status && { status: status as any }),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { excerpt: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        status: true,
        metaTitle: true,
        metaDescription: true,
        publishedAt: true,
        scheduledAt: true,
        createdAt: true,
        updatedAt: true,
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, name: true, email: true } },
        featuredImageId: true,
        tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    }),
    prisma.post.count({ where }),
  ])

  return NextResponse.json({
    posts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const {
    title, excerpt, contentJson, contentHtml, categoryId, featuredImageId,
    metaTitle, metaDescription, focusKeyword, canonicalUrl, noIndex,
    ogTitle, ogDescription, ogImageId, schemaMarkup, scheduledAt, tagIds,
    sourceType, publisherPageId, publisherCampaign,
  } = body

  const siteId = body.siteId ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const slug = body.slug ? slugify(body.slug) : slugify(title)

  const existing = await prisma.post.findFirst({ where: { siteId, slug } })
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

  const post = await prisma.post.create({
    data: {
      siteId,
      title,
      slug,
      excerpt: excerpt ?? null,
      contentJson: contentJson ?? {},
      contentHtml: contentHtml ?? '',
      status: 'DRAFT',
      metaTitle: metaTitle ?? null,
      metaDescription: metaDescription ?? null,
      focusKeyword: focusKeyword ?? null,
      canonicalUrl: canonicalUrl ?? null,
      noIndex: noIndex ?? false,
      ogTitle: ogTitle ?? null,
      ogDescription: ogDescription ?? null,
      ogImageId: ogImageId ?? null,
      schemaMarkup: schemaMarkup ?? null,
      categoryId: categoryId ?? null,
      authorId: session.user.id,
      featuredImageId: featuredImageId ?? null,
      sourceType: sourceType ?? null,
      publisherPageId: publisherPageId ?? null,
      publisherCampaign: publisherCampaign ?? null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      revisions: initialRevisions as any,
      ...(tagIds?.length && {
        tags: { create: tagIds.map((tagId: string) => ({ tagId })) },
      }),
    },
    include: {
      category: { select: { id: true, name: true } },
      author: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
    },
  })

  return NextResponse.json({ post }, { status: 201 })
}
