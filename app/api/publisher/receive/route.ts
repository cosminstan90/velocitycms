/**
 * POST /api/publisher/receive
 * Receives content from SEO Publisher, processes it, and creates/updates a Post.
 * Protected by X-CMS-Token header (timing-safe comparison).
 */

import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { prisma } from '@/lib/prisma'
import { processImage, saveProcessedImage, generateAltText } from '@/lib/media/image-processor'
import { siteUploadDir, sitePublicPrefix } from '@/lib/media/storage'
import { calculateGeoScore } from '@/lib/seo/geo-scorer'
import { generatePostSchema } from '@/lib/seo/schema-generator'
import { addSpeakableSchema, getFaqItemCount } from '@/lib/seo/speakable-schema'
import { serverHtmlToTiptapJson } from '@/lib/tiptap/server-html-parser'
import { getSmartScheduledAt } from '@/lib/publisher/scheduler'
import { revalidatePath } from 'next/cache'
import fs from 'fs/promises'
import { Prisma } from '@prisma/client'

// Prisma v7 Json field helper — casts any value for use in Json columns
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const asJson = (v: unknown): any => v

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif']
const MAX_IMAGE_BYTES = 20 * 1024 * 1024

// ── Timing-safe token comparison ────────────────────────────────────────────
function tokenMatches(received: string, expected: string): boolean {
  try {
    const a = Buffer.from(received, 'utf8')
    const b = Buffer.from(expected, 'utf8')
    if (a.length !== b.length) {
      // Still run a comparison to avoid timing oracle on length mismatch
      timingSafeEqual(a, Buffer.alloc(a.length))
      return false
    }
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

export interface PublisherPayload {
  title: string
  slug: string
  metaDescription?: string | null
  contentHtml: string
  schemaMarkup?: Record<string, unknown> | null
  faqItems?: Array<{ question: string; answer: string }>
  focusKeyword?: string | null
  categorySlug?: string | null
  status?: 'draft' | 'published'
  publisherPageId?: string | null
  publisherCampaign?: string | null
  featuredImageUrl?: string | null
  featuredImageCredit?: string | null
  siteId: string
  model?: string | null
  geoScore?: number | null
  geoBreakdown?: Record<string, unknown> | null
  directAnswer?: string | null
  speakableSections?: string[] | null
}

export async function POST(req: NextRequest) {
  // ── Parse body first to get siteId for per-site token lookup ────────────
  let body: PublisherPayload
  try {
    body = (await req.json()) as PublisherPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { siteId } = body
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  // ── Auth: per-site token → env fallback ─────────────────────────────────
  const receivedToken = req.headers.get('x-cms-token') ?? ''
  let expectedToken = process.env.CMS_PUBLISHER_TOKEN ?? ''

  const seoSettings = await prisma.seoSettings
    .findUnique({ where: { siteId }, select: { publisherToken: true, siteName: true, siteUrl: true, defaultOgImage: true } })
    .catch(() => null)

  if (seoSettings?.publisherToken) expectedToken = seoSettings.publisherToken

  if (!expectedToken || !tokenMatches(receivedToken, expectedToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ── Validate required fields ─────────────────────────────────────────────
  const {
    title,
    slug,
    metaDescription,
    contentHtml,
    faqItems = [],
    focusKeyword,
    categorySlug,
    status: rawStatus = 'draft',
    publisherPageId,
    publisherCampaign,
    featuredImageUrl,
    featuredImageCredit,
    geoScore: providedGeoScore = null,
    geoBreakdown: providedGeoBreakdown = null,
    directAnswer: providedDirectAnswer = null,
    speakableSections: providedSpeakable = null,
  } = body

  if (!title || !slug || !contentHtml) {
    return NextResponse.json({ error: 'title, slug, contentHtml required' }, { status: 400 })
  }

  // ── Find or create category ──────────────────────────────────────────────
  let categoryId: string | null = null
  if (categorySlug) {
    let cat = await prisma.category.findFirst({ where: { siteId, slug: categorySlug } })
    if (!cat) {
      const name = categorySlug
        .split('-')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
      cat = await prisma.category.create({ data: { siteId, slug: categorySlug, name } })
    }
    categoryId = cat.id
  }

  // ── Download + process featured image ───────────────────────────────────
  let featuredImageId: string | null = null
  if (featuredImageUrl) {
    try {
      const imgRes = await fetch(featuredImageUrl, {
        headers: { 'User-Agent': 'VelocityCMS/1.0 Publisher' },
        signal: AbortSignal.timeout(15_000),
      })
      if (imgRes.ok) {
        const ct = imgRes.headers.get('content-type')?.split(';')[0].trim() ?? 'image/jpeg'
        if (ALLOWED_IMAGE_TYPES.includes(ct)) {
          const buf = Buffer.from(await imgRes.arrayBuffer())
          if (buf.byteLength <= MAX_IMAGE_BYTES) {
            const uploadDir = siteUploadDir(siteId)
            const publicPrefix = sitePublicPrefix(siteId)
            await fs.mkdir(uploadDir, { recursive: true })
            const originalName =
              new URL(featuredImageUrl).pathname.split('/').pop() || 'image.jpg'
            const processed = await processImage(buf, originalName)
            const urls = await saveProcessedImage(processed, uploadDir, publicPrefix)
            const altText = await generateAltText(processed.webpBuffer)
            const media = await prisma.media.create({
              data: {
                siteId,
                filename: processed.webpFilename,
                originalName: featuredImageCredit || originalName,
                mimeType: 'image/webp',
                size: processed.size,
                width: processed.width,
                height: processed.height,
                url: urls.url,
                urlOriginal: urls.urlOriginal,
                altText,
              },
            })
            featuredImageId = media.id
          }
        }
      }
    } catch {
      // Non-fatal — post saved without featured image
    }
  }

  // ── Generate contentJson from contentHtml ───────────────────────────────
  const contentJson = serverHtmlToTiptapJson(contentHtml) as Record<string, unknown>

  // Append FAQBlock node if faqItems provided
  const validFaqItems = (faqItems ?? []).filter((f) => f.question && f.answer)
  if (validFaqItems.length > 0) {
    const doc = contentJson as { type: string; content: unknown[] }
    doc.content = [...doc.content, { type: 'faqBlock', attrs: { items: validFaqItems } }]
  }

  // ── GEO scoring ─────────────────────────────────────────────────────────
  let geoScore: number | null = providedGeoScore
  let geoBreakdown: Record<string, unknown> | null = providedGeoBreakdown
  let directAnswer: string | null = providedDirectAnswer
  let speakableSections: string[] = providedSpeakable ?? []

  if (geoScore === null) {
    const geoResult = calculateGeoScore({
      contentHtml,
      contentJson,
      focusKeyword: focusKeyword ?? null,
      metaDescription: metaDescription ?? null,
    })
    geoScore = geoResult.score
    geoBreakdown = geoResult.breakdown as unknown as Record<string, unknown>
    directAnswer = geoResult.directAnswerText
    speakableSections = geoResult.speakableSections
  }

  // ── Generate JSON-LD schema ──────────────────────────────────────────────
  const siteData = {
    siteName: seoSettings?.siteName ?? 'Site',
    siteUrl: seoSettings?.siteUrl ?? 'http://localhost',
    defaultOgImage: seoSettings?.defaultOgImage ?? null,
  }

  const now = new Date()
  const baseSchema = generatePostSchema(
    {
      id: publisherPageId ?? slug,
      title,
      slug,
      excerpt: metaDescription ?? null,
      contentJson,
      metaTitle: null,
      metaDescription: metaDescription ?? null,
      publishedAt: rawStatus === 'published' ? now : null,
      updatedAt: now,
      createdAt: now,
      author: null,
      featuredImage: null,
      category: categorySlug ? { name: categorySlug, slug: categorySlug } : null,
      noIndex: false,
      canonicalUrl: null,
    },
    siteData
  )

  const faqCount = getFaqItemCount(baseSchema as Record<string, unknown>)
  const finalSchema = addSpeakableSchema(
    baseSchema as Record<string, unknown>,
    speakableSections,
    faqCount
  )

  // ── Find default author for site ─────────────────────────────────────────
  const siteAccess = await prisma.userSiteAccess.findFirst({
    where: { siteId },
    orderBy: [{ role: 'asc' }, { id: 'asc' }],
    select: { userId: true },
  })
  if (!siteAccess) {
    return NextResponse.json({ error: 'No users found for site' }, { status: 422 })
  }
  const authorId = siteAccess.userId

  // ── Smart scheduler ──────────────────────────────────────────────────────
  let scheduledAt: Date | null = null
  let finalStatus: 'DRAFT' | 'PUBLISHED' = rawStatus === 'published' ? 'PUBLISHED' : 'DRAFT'

  if (rawStatus === 'published') {
    const slot = await getSmartScheduledAt(siteId)
    if (slot) {
      scheduledAt = slot
      finalStatus = 'DRAFT' // Scheduler will publish at scheduledAt
    }
  }

  // ── Upsert post ─────────────────────────────────────────────────────────
  const existing = publisherPageId
    ? await prisma.post.findFirst({ where: { siteId, publisherPageId } })
    : await prisma.post.findFirst({ where: { siteId, slug } })

  let post: { id: string; slug: string }

  if (existing) {
    post = await prisma.post.update({
      where: { id: existing.id },
      data: {
        title,
        contentJson: asJson(contentJson),
        contentHtml,
        metaDescription: metaDescription ?? null,
        focusKeyword: focusKeyword ?? null,
        status: finalStatus,
        scheduledAt,
        publishedAt: finalStatus === 'PUBLISHED' ? now : existing.publishedAt,
        geoScore,
        geoBreakdown: geoBreakdown !== null ? asJson(geoBreakdown) : Prisma.JsonNull,
        directAnswer,
        speakableSections: asJson(speakableSections),
        schemaMarkup: asJson(finalSchema),
        publisherCampaign: publisherCampaign ?? existing.publisherCampaign,
        featuredImageId: featuredImageId ?? existing.featuredImageId,
        categoryId: categoryId ?? existing.categoryId,
      },
      select: { id: true, slug: true },
    })
  } else {
    // Ensure slug uniqueness
    let finalSlug = slug
    const slugConflict = await prisma.post.findFirst({ where: { siteId, slug } })
    if (slugConflict) finalSlug = `${slug}-${Date.now()}`

    post = await prisma.post.create({
      data: {
        siteId,
        title,
        slug: finalSlug,
        contentJson: asJson(contentJson),
        contentHtml,
        metaDescription: metaDescription ?? null,
        focusKeyword: focusKeyword ?? null,
        status: finalStatus,
        scheduledAt,
        publishedAt: finalStatus === 'PUBLISHED' ? now : null,
        categoryId,
        authorId,
        geoScore,
        geoBreakdown: geoBreakdown !== null ? asJson(geoBreakdown) : Prisma.JsonNull,
        directAnswer,
        speakableSections: asJson(speakableSections),
        schemaMarkup: asJson(finalSchema),
        publisherPageId: publisherPageId ?? null,
        publisherCampaign: publisherCampaign ?? null,
        featuredImageId,
        sourceType: 'publisher',
      },
      select: { id: true, slug: true },
    })
  }

  // ── Revalidate public paths ─────────────────────────────────────────────
  try {
    if (categorySlug) {
      revalidatePath(`/${categorySlug}/${post.slug}`)
    } else {
      revalidatePath(`/blog/${post.slug}`)
    }
    revalidatePath('/sitemap.xml')
  } catch {
    // Non-fatal in development
  }

  const publicUrl = categorySlug
    ? `${siteData.siteUrl}/${categorySlug}/${post.slug}`
    : `${siteData.siteUrl}/blog/${post.slug}`

  return NextResponse.json(
    {
      success: true,
      postId: post.id,
      url: publicUrl,
      scheduledAt: scheduledAt?.toISOString() ?? null,
      revalidated: true,
    },
    { status: existing ? 200 : 201 }
  )
}
