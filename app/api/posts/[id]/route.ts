import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { appendRevision } from '@/lib/revisions'
import { calculateGeoScore } from '@/lib/seo/geo-scorer'
import { generatePostSchema } from '@/lib/seo/schema-generator'
import { addSpeakableSchema, getFaqItemCount } from '@/lib/seo/speakable-schema'

type Params = { params: Promise<{ id: string }> }

export async function GET(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      site: { select: { id: true } },
      category: true,
      author: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
      fieldValues: { include: { fieldDefinition: true } },
    },
  })

  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ post: { ...post, siteId: post.site?.id ?? null } })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()

  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Save revision before updating
  const revisions = appendRevision(post.revisions, {
    savedAt: new Date().toISOString(),
    savedBy: session.user.id,
    title: post.title,
    contentJson: post.contentJson,
    contentHtml: post.contentHtml,
    metaTitle: post.metaTitle,
    metaDescription: post.metaDescription,
    status: post.status,
  })

  // Handle slug update
  let slug = post.slug
  if (body.slug && body.slug !== post.slug) {
    slug = slugify(body.slug)
    const conflict = await prisma.post.findFirst({
      where: { siteId: post.siteId, slug, id: { not: id } },
    })
    if (conflict) return NextResponse.json({ error: 'Slug already exists for this site' }, { status: 409 })
  } else if (body.title && body.title !== post.title && !body.slug) {
    // Auto-update slug only if post hasn't been published yet
    if (post.status === 'DRAFT' || post.status === 'REVIEW') {
      const newSlug = slugify(body.title)
      const conflict = await prisma.post.findFirst({
        where: { siteId: post.siteId, slug: newSlug, id: { not: id } },
      })
      if (!conflict) slug = newSlug
    }
  }

  const { tagIds, ...rest } = body

  const updated = await prisma.post.update({
    where: { id },
    data: {
      ...(rest.title !== undefined && { title: rest.title }),
      slug,
      ...(rest.excerpt !== undefined && { excerpt: rest.excerpt }),
      ...(rest.contentJson !== undefined && { contentJson: rest.contentJson }),
      ...(rest.contentHtml !== undefined && { contentHtml: rest.contentHtml }),
      ...(rest.status !== undefined && { status: rest.status }),
      ...(rest.metaTitle !== undefined && { metaTitle: rest.metaTitle }),
      ...(rest.metaDescription !== undefined && { metaDescription: rest.metaDescription }),
      ...(rest.focusKeyword !== undefined && { focusKeyword: rest.focusKeyword }),
      ...(rest.canonicalUrl !== undefined && { canonicalUrl: rest.canonicalUrl }),
      ...(rest.noIndex !== undefined && { noIndex: rest.noIndex }),
      ...(rest.ogTitle !== undefined && { ogTitle: rest.ogTitle }),
      ...(rest.ogDescription !== undefined && { ogDescription: rest.ogDescription }),
      ...(rest.ogImageId !== undefined && { ogImageId: rest.ogImageId }),
      ...(rest.geoScore !== undefined && { geoScore: rest.geoScore }),
      ...(rest.geoBreakdown !== undefined && { geoBreakdown: rest.geoBreakdown }),
      ...(rest.directAnswer !== undefined && { directAnswer: rest.directAnswer }),
      ...(rest.schemaMarkup !== undefined && { schemaMarkup: rest.schemaMarkup }),
      ...(rest.internalLinksUsed !== undefined && { internalLinksUsed: rest.internalLinksUsed }),
      ...(rest.categoryId !== undefined && { categoryId: rest.categoryId }),
      ...(rest.featuredImageId !== undefined && { featuredImageId: rest.featuredImageId }),
      ...(rest.scheduledAt !== undefined && { scheduledAt: rest.scheduledAt ? new Date(rest.scheduledAt) : null }),
      revisions: revisions as any,
      ...(tagIds !== undefined && {
        tags: {
          deleteMany: {},
          create: tagIds.map((tagId: string) => ({ tagId })),
        },
      }),
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      author: { select: { id: true, name: true, email: true } },
      tags: { include: { tag: true } },
    },
  })

  try {
    revalidateTag('homepage')
    revalidateTag('posts')
    revalidateTag(`post-${id}`)
    revalidateTag(`post-${updated.slug}`)
    if (updated.categoryId) {
      revalidateTag(`category-${updated.categoryId}`)
    }

    revalidatePath('/', 'page')
    revalidatePath('/blog', 'page')

    if (updated.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: updated.categoryId } })
      if (category) {
        revalidatePath(`/${category.slug}`, 'page')
        if (category.parentId) {
          const parent = await prisma.category.findUnique({ where: { id: category.parentId } })
          if (parent) {
            revalidatePath(`/${parent.slug}/${category.slug}`, 'page')
            revalidatePath(`/${parent.slug}/${category.slug}/${updated.slug}`, 'page')
          }
        } else {
          revalidatePath(`/${category.slug}/${updated.slug}`, 'page')
        }
      }
    } else {
      revalidatePath(`/blog/${updated.slug}`, 'page')
    }
  } catch {
    // ignore in dev
  }

  // ── Auto GEO scoring ────────────────────────────────────────────────────────
  // Run after the main update so we score the freshly saved content.
  try {
    const contentHtml = rest.contentHtml ?? updated.contentHtml
    const contentJson = (rest.contentJson ?? updated.contentJson) as Record<string, unknown>
    const focusKeyword = rest.focusKeyword ?? updated.focusKeyword
    const metaDescription = rest.metaDescription ?? updated.metaDescription

    const geoResult = calculateGeoScore({
      contentHtml,
      contentJson,
      focusKeyword,
      metaDescription,
      author: updated.author
        ? { name: updated.author.name, credentials: null }
        : null,
      schemaMarkup: updated.schemaMarkup as Record<string, unknown> | null,
    })

    // Build enriched schema (Article + SpeakableSpecification)
    const siteData = await prisma.seoSettings.findFirst({ where: { siteId: updated.siteId } })
    const baseSchema = generatePostSchema(
      {
        id: updated.id,
        title: updated.title,
        slug: updated.slug,
        excerpt: updated.excerpt ?? null,
        contentJson,
        metaTitle: updated.metaTitle ?? null,
        metaDescription: updated.metaDescription ?? null,
        publishedAt: updated.publishedAt ?? null,
        updatedAt: updated.updatedAt,
        createdAt: updated.createdAt,
        author: updated.author ? { name: updated.author.name ?? null, email: updated.author.email } : null,
        featuredImage: null,
        category: updated.category ?? null,
        noIndex: updated.noIndex,
        canonicalUrl: updated.canonicalUrl ?? null,
      },
      {
        siteName: siteData?.siteName ?? 'Site',
        siteUrl: siteData?.siteUrl ?? 'http://localhost',
        defaultOgImage: siteData?.defaultOgImage ?? null,
      }
    )

    const faqCount = getFaqItemCount(baseSchema)
    const enrichedSchema = addSpeakableSchema(baseSchema, geoResult.speakableSections, faqCount)

    // Persist GEO data back to DB (non-blocking — fire-and-forget style error handling)
    await prisma.post.update({
      where: { id },
      data: {
        geoScore: geoResult.score,
        geoBreakdown: geoResult.breakdown as any,
        directAnswer: geoResult.directAnswerText,
        speakableSections: geoResult.speakableSections as any,
        schemaMarkup: enrichedSchema as any,
      },
    })

    return NextResponse.json({
      post: {
        ...updated,
        geoScore: geoResult.score,
        geoBreakdown: geoResult.breakdown,
        directAnswer: geoResult.directAnswerText,
        speakableSections: geoResult.speakableSections,
        schemaMarkup: enrichedSchema,
        geoSuggestions: geoResult.suggestions,
      },
    })
  } catch (geoErr) {
    console.error('[GEO scorer] failed:', geoErr)
    // Return the already-updated post without GEO data rather than failing the save
    return NextResponse.json({ post: updated })
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const post = await prisma.post.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (post.status !== 'DRAFT' && post.status !== 'ARCHIVED') {
    return NextResponse.json(
      { error: 'Only DRAFT or ARCHIVED posts can be deleted' },
      { status: 409 }
    )
  }

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
