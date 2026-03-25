/**
 * GET /api/public/posts
 * Headless API — requires X-API-Key header.
 *
 * Query params:
 *   status=published|draft|all  (default: published)
 *   category=slug
 *   limit=20  (max 100)
 *   page=1
 *   fields=id,title,slug,excerpt,publishedAt,...  (sparse fieldset)
 *   search=keyword
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateApiKey } from '@/lib/auth/api-key'
import { rateLimit, rateLimitResponse, getClientIp } from '@/lib/rate-limit'

// CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204 })
}

const ALLOWED_FIELDS = new Set([
  'id', 'title', 'slug', 'excerpt', 'status', 'publishedAt', 'updatedAt', 'createdAt',
  'metaTitle', 'metaDescription', 'focusKeyword', 'canonicalUrl', 'noIndex',
  'geoScore', 'directAnswer', 'contentHtml', 'schemaMarkup',
  'category', 'author', 'tags', 'featuredImageUrl',
])

function pickFields(post: Record<string, unknown>, fields: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const f of fields) {
    if (f in post) out[f] = post[f]
  }
  return out
}

export async function GET(req: NextRequest) {
  // General API rate limit: 200 req/min per IP
  const ip = getClientIp(req)
  const rl = await rateLimit(`api:${ip}`, 200, 60)
  if (!rl.allowed) return rateLimitResponse(rl)

  const ctx = await validateApiKey(req.headers.get('x-api-key') ?? '')
  if (!ctx) return NextResponse.json({ error: 'Invalid or missing API key' }, { status: 401 })

  const { siteId } = ctx
  const sp = req.nextUrl.searchParams

  const rawStatus = sp.get('status') ?? 'published'
  const category = sp.get('category')
  const search = sp.get('search')
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20')))
  const page = Math.max(1, parseInt(sp.get('page') ?? '1'))

  // Sparse fieldset
  const fieldsParam = sp.get('fields')
  const selectedFields: Set<string> = fieldsParam
    ? new Set(fieldsParam.split(',').filter((f) => ALLOWED_FIELDS.has(f)))
    : new Set(ALLOWED_FIELDS)
  // Always include id and slug
  selectedFields.add('id')
  selectedFields.add('slug')

  const statusFilter =
    rawStatus === 'all' ? undefined :
    rawStatus === 'draft' ? 'DRAFT' :
    'PUBLISHED'

  // Find category id if slug provided
  let categoryId: string | undefined
  if (category) {
    const cat = await prisma.category.findFirst({ where: { siteId, slug: category }, select: { id: true } })
    if (!cat) return NextResponse.json({ posts: [], total: 0, page, limit, totalPages: 0 })
    categoryId = cat.id
  }

  const where = {
    siteId,
    ...(statusFilter && { status: statusFilter }),
    ...(categoryId && { categoryId }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' as const } },
        { excerpt: { contains: search, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [posts, total] = await prisma.$transaction([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        author: { select: { name: true } },
        tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
      },
    }),
    prisma.post.count({ where }),
  ])

  // Flatten and build response
  const items = posts.map((p) => {
    const flat: Record<string, unknown> = {
      id: p.id,
      title: p.title,
      slug: p.slug,
      excerpt: p.excerpt,
      status: p.status,
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
      createdAt: p.createdAt,
      metaTitle: p.metaTitle,
      metaDescription: p.metaDescription,
      focusKeyword: p.focusKeyword,
      canonicalUrl: p.canonicalUrl,
      noIndex: p.noIndex,
      geoScore: p.geoScore,
      directAnswer: p.directAnswer,
      contentHtml: selectedFields.has('contentHtml') ? p.contentHtml : undefined,
      schemaMarkup: selectedFields.has('schemaMarkup') ? p.schemaMarkup : undefined,
      category: p.category,
      author: p.author,
      tags: p.tags.map((t) => t.tag),
      featuredImageUrl: null as string | null,
    }

    // Resolve featured image URL if requested
    if (!selectedFields.has('featuredImageUrl')) delete flat.featuredImageUrl

    return pickFields(flat, selectedFields)
  })

  // Resolve featured image URLs in one batch query
  if (selectedFields.has('featuredImageUrl')) {
    const imageIds = posts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
    if (imageIds.length > 0) {
      const images = await prisma.media.findMany({
        where: { id: { in: imageIds } },
        select: { id: true, url: true },
      })
      const imageMap = new Map(images.map((m) => [m.id, m.url]))
      posts.forEach((p, i) => {
        if (p.featuredImageId) {
          ;(items[i] as Record<string, unknown>).featuredImageUrl = imageMap.get(p.featuredImageId) ?? null
        }
      })
    }
  }

  return NextResponse.json({
    posts: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  })
}
