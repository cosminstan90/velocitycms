/**
 * Route: /comparatie/[slug]
 *
 * Renders a comparison page between two animals/breeds.
 * The comparison post uses a special "comparison" category or tag convention:
 *   - The post itself is a regular published Post with a slug like "labrador-vs-golden-retriever"
 *   - Custom fields define the two compared items (postA / postB slugs)
 *   - The comparison rows come from custom fields or contentJson
 *
 * For MVP, this renders any post that belongs to a "comparatie" category slug.
 */

import { prisma } from '@/lib/prisma'
import { ComparisonDispatcher } from '@/components/frontend/TemplateDispatcher'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 3600

type Props = {
  params: Promise<{ slug: string }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSiteData() {
  const site = await prisma.site.findFirst({ where: { isActive: true } })
  const seo = site ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } }) : null
  return {
    site,
    seo,
    siteName: seo?.siteName ?? site?.name ?? 'Site',
    siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
    template: site?.template ?? 'default',
  }
}

async function fetchFeaturedImage(id: string | null) {
  if (!id) return null
  const m = await prisma.media.findUnique({
    where: { id },
    select: { url: true, altText: true, width: true, height: true },
  })
  return m ? { url: m.url, altText: m.altText ?? null } : null
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { siteName, siteUrl } = await getSiteData()

  const post = await prisma.post.findFirst({
    where: { slug, status: 'PUBLISHED' },
    select: { title: true, metaTitle: true, metaDescription: true, excerpt: true },
  })
  if (!post) return { title: 'Comparație | ' + siteName }

  const title = post.metaTitle ?? post.title
  return {
    title: `${title} | ${siteName}`,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    alternates: { canonical: `${siteUrl}/comparatie/${slug}` },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ComparisonPage({ params }: Props) {
  const { slug } = await params
  const { site, seo, siteName, siteUrl, template } = await getSiteData()
  if (!site) notFound()

  // Fetch the comparison post — look for it by slug first
  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      siteId: site.id,
    },
    include: {
      author: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: true } },
    },
  })

  if (!post) notFound()

  // Fetch featured image
  const featuredImage = await fetchFeaturedImage((post as any).featuredImageId ?? null)

  // Try to find the two compared posts from custom field values
  // Convention: custom fields "postA_slug" and "postB_slug" link to the individual articles
  const fieldValues = await prisma.fieldValue.findMany({
    where: { postId: post.id },
    include: { fieldDefinition: true },
  })

  const fieldMap = new Map(fieldValues.map((fv) => [fv.fieldDefinition.fieldKey, fv.value]))
  const postASlug = fieldMap.get('postA_slug') ?? null
  const postBSlug = fieldMap.get('postB_slug') ?? null

  // Fetch the two compared items (if they exist as posts)
  const [postA, postB] = await Promise.all([
    postASlug
      ? prisma.post.findFirst({
          where: { slug: postASlug, status: 'PUBLISHED', siteId: site.id },
          select: { title: true, slug: true, excerpt: true, featuredImageId: true, category: { select: { name: true, slug: true } } },
        })
      : null,
    postBSlug
      ? prisma.post.findFirst({
          where: { slug: postBSlug, status: 'PUBLISHED', siteId: site.id },
          select: { title: true, slug: true, excerpt: true, featuredImageId: true, category: { select: { name: true, slug: true } } },
        })
      : null,
  ])

  // Fetch featured images for both items
  const [imgA, imgB] = await Promise.all([
    fetchFeaturedImage(postA?.featuredImageId ?? null),
    fetchFeaturedImage(postB?.featuredImageId ?? null),
  ])

  // Build comparison items — fall back to the post title split on "vs" if no linked posts
  const titleParts = post.title.split(/\s+vs\.?\s+/i)
  const itemA = postA
    ? { title: postA.title, slug: postA.slug, excerpt: postA.excerpt, featuredImage: imgA, category: postA.category }
    : { title: titleParts[0]?.trim() ?? 'Animal A', slug: '', excerpt: null, featuredImage: featuredImage, category: post.category }
  const itemB = postB
    ? { title: postB.title, slug: postB.slug, excerpt: postB.excerpt, featuredImage: imgB, category: postB.category }
    : { title: titleParts[1]?.trim() ?? 'Animal B', slug: '', excerpt: null, featuredImage: featuredImage, category: post.category }

  // Parse comparison rows from custom fields (convention: "compare_rows" is a JSON string)
  let comparisonRows: Array<{ label: string; valueA: string; valueB: string; winner?: 'a' | 'b' | 'tie' | null }> = []
  const rowsJson = fieldMap.get('compare_rows')
  if (rowsJson) {
    try { comparisonRows = JSON.parse(rowsJson) } catch { /* skip */ }
  }

  // Verdict from custom field
  const verdict = fieldMap.get('verdict') ?? null

  // Related comparisons — other posts in the same "comparatie" category
  const comparCategory = await prisma.category.findFirst({
    where: { slug: 'comparatie', siteId: site.id },
    select: { id: true },
  })
  let relatedComparisons: any[] = []
  if (comparCategory) {
    const related = await prisma.post.findMany({
      where: {
        siteId: site.id,
        status: 'PUBLISHED',
        categoryId: comparCategory.id,
        id: { not: post.id },
      },
      take: 6,
      orderBy: { publishedAt: 'desc' },
      select: { id: true, title: true, slug: true, excerpt: true, featuredImageId: true },
    })
    const relImageIds = related.map((r) => r.featuredImageId).filter((id): id is string => !!id)
    const relMedia = relImageIds.length > 0
      ? await prisma.media.findMany({ where: { id: { in: relImageIds } }, select: { id: true, url: true, altText: true } })
      : []
    const relMediaMap = new Map(relMedia.map((m) => [m.id, m]))
    relatedComparisons = related.map((r) => ({
      ...r,
      featuredImage: r.featuredImageId && relMediaMap.has(r.featuredImageId)
        ? { url: relMediaMap.get(r.featuredImageId)!.url, altText: relMediaMap.get(r.featuredImageId)!.altText }
        : null,
    }))
  }

  // Fetch all categories for the layout nav
  const categories = await prisma.category.findMany({
    where: { siteId: site.id, parentId: null },
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  })

  return (
    <ComparisonDispatcher
      template={template}
      itemA={itemA}
      itemB={itemB}
      contentHtml={post.contentHtml ?? ''}
      comparisonRows={comparisonRows}
      verdict={verdict}
      relatedComparisons={relatedComparisons}
      site={{ siteName, siteUrl }}
      categories={categories}
      seoSettings={seo}
      pageTitle={post.title}
      publishedAt={post.publishedAt}
      author={post.author}
    />
  )
}
