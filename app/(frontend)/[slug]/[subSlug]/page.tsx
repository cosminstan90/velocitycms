/**
 * Route: /[slug]/[subSlug]
 *
 * Handles two cases (resolved by DB lookup):
 *   1. Subcategory listing page — [subSlug] is a child category of [slug]
 *   2. Article page — [subSlug] is a post slug within category [slug]
 *
 * Param mapping:
 *   [slug]    = top-level category slug  (was [categorySlug])
 *   [subSlug] = subcategory or article slug (was [slug])
 */
import { prisma } from '@/lib/prisma'
import { ogImages } from '@/lib/default-og'
import { parsePageParam } from '@/lib/pagination'
import { ArticleDispatcher, CategoryDispatcher } from '@/components/frontend/TemplateDispatcher'
import { generatePostSchema, generateCategorySchema } from '@/lib/seo/schema-generator'
import { buildCanonicalUrl } from '@/lib/seo/canonical-builder'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { headers } from 'next/headers'
import { findLegacyRedirect } from '@/lib/legacy-redirects'
import { getSiteIdFromHostname } from '@/lib/site'
import { CARD_META_KEYS } from '@/lib/fields'

export const dynamic = 'force-dynamic'

const POSTS_PER_PAGE = 12

type Props = {
  params: Promise<{ slug: string; subSlug: string }>
  searchParams: Promise<{ page?: string }>
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getSiteData(siteId: string) {
  const [site, seo] = await Promise.all([
    prisma.site.findUnique({ where: { id: siteId } }),
    prisma.seoSettings.findFirst({ where: { siteId } }),
  ])
  return {
    siteName: seo?.siteName ?? site?.name ?? 'Site',
    siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
    defaultOgImage: seo?.defaultOgImage ?? null,
    template: site?.template ?? 'default',
    seo,
  }
}

async function fetchFeaturedImage(id: string | null) {
  if (!id) return null
  const m = await prisma.media.findUnique({
    where: { id },
    select: { url: true, altText: true, width: true, height: true },
  })
  return m ? { url: m.url, altText: m.altText ?? null, width: m.width ?? null, height: m.height ?? null } : null
}

async function mapPostsWithImages(posts: Array<{ id: string; featuredImageId: string | null; [key: string]: unknown }>) {
  const ids = posts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const mediaMap = new Map(
    ids.length
      ? (await prisma.media.findMany({ where: { id: { in: ids } }, select: { id: true, url: true, altText: true, width: true, height: true } })).map((m) => [m.id, m])
      : []
  )
  return posts.map((p) => {
    const m = p.featuredImageId ? (mediaMap.get(p.featuredImageId) ?? null) : null
    return { ...p, featuredImage: m ? { url: m.url, altText: m.altText ?? null, width: m.width ?? null, height: m.height ?? null } : null }
  })
}

/** Active site: by request host, falling back to the only root category with this slug. */
async function resolveSiteId(groupSlug: string): Promise<string | null> {
  const host = (await headers()).get('host') ?? ''
  const bySite = host ? await getSiteIdFromHostname(host).catch(() => null) : null
  if (bySite) return bySite
  const roots = await prisma.category.findMany({ where: { slug: groupSlug, parentId: null }, select: { siteId: true }, take: 2 })
  return roots.length === 1 ? roots[0].siteId : null
}

// ─── generateStaticParams ─────────────────────────────────────────────────────

export async function generateStaticParams() {
  // Return empty array — pages are generated on first request and cached by ISR
  // (revalidate = 3600). Pre-rendering at build time requires a live DB connection.
  return []
}

// ─── generateMetadata ─────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug: categorySlug, subSlug: slug } = await params

  // Try subcategory first
  const subCategory = await prisma.category.findFirst({
    where: { slug, parent: { slug: categorySlug, parentId: null } },
  })

  if (subCategory) {
    const { siteUrl, siteName, defaultOgImage, seo } = await getSiteData(subCategory.siteId)
    const title = subCategory.metaTitle ?? subCategory.name
    const description = subCategory.metaDesc ?? subCategory.description ?? undefined
    const canonical = `${siteUrl}/${categorySlug}/${slug}`
    return {
      title: `${title} | ${siteName}`,
      description,
      openGraph: { title, description, url: canonical, images: ogImages(siteUrl, defaultOgImage) },
      alternates: { canonical },
    }
  }

  // Try article in root category
  const post = await prisma.post.findFirst({
    where: { slug, status: 'PUBLISHED', category: { slug: categorySlug, parentId: null } },
    include: { author: { select: { name: true, email: true, slug: true } }, category: { select: { name: true, slug: true } } },
  })

  if (!post) return { title: 'Pagină negăsită' }

  const { siteUrl, siteName, defaultOgImage, seo } = await getSiteData(post.siteId)
  const title = post.metaTitle ?? post.title
  const description = post.metaDescription ?? post.excerpt ?? undefined

  let ogImageUrl: string | undefined
  if (post.ogImageId) {
    const m = await prisma.media.findUnique({ where: { id: post.ogImageId }, select: { url: true } })
    ogImageUrl = m?.url
  } else if (post.featuredImageId) {
    const m = await prisma.media.findUnique({ where: { id: post.featuredImageId }, select: { url: true } })
    ogImageUrl = m?.url
  }
  if (!ogImageUrl && defaultOgImage) ogImageUrl = defaultOgImage

  const canonical = buildCanonicalUrl(
    post,
    { siteUrl },
    post.category ? { slug: post.category.slug, parent: null } : null
  )

  return {
    title: `${title} | ${siteName}`,
    description,
    robots: post.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.ogTitle ?? title,
      description: post.ogDescription ?? description,
      url: canonical,
      images: ogImages(siteUrl, ogImageUrl),
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
    twitter: { card: 'summary_large_image', images: ogImages(siteUrl, ogImageUrl) },
    alternates: { canonical },
  }
}

// ─── Page component ───────────────────────────────────────────────────────────

export default async function CategorySlugPage({ params, searchParams }: Props) {
  const { slug: categorySlug, subSlug: slug } = await params
  const { page: pageParam } = await searchParams
  const currentPage = parsePageParam(pageParam)
  const skip = (currentPage - 1) * POSTS_PER_PAGE

  // ── Case 1: Subcategory listing ──────────────────────────────────────────
  const subCategory = await prisma.category.findFirst({
    where: { slug, parent: { slug: categorySlug, parentId: null } },
    include: { children: { select: { id: true, name: true, slug: true, description: true, _count: { select: { posts: true } } } } },
  })

  if (subCategory) {
    const parentCategory = await prisma.category.findFirst({ where: { slug: categorySlug, parentId: null }, select: { name: true, slug: true } })
    const { siteName, siteUrl, defaultOgImage, template, seo } = await getSiteData(subCategory.siteId)

    const navCategories = await prisma.category.findMany({
      where: { siteId: subCategory.siteId, parentId: null },
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })

    const [rawPosts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: { status: 'PUBLISHED', categoryId: subCategory.id },
        take: POSTS_PER_PAGE,
        skip,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { name: true } },
          category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
          fieldValues: {
            where: { fieldDefinition: { fieldKey: { in: [...CARD_META_KEYS] } } },
            select: { value: true, fieldDefinition: { select: { fieldKey: true } } },
          },
        },
      }),
      prisma.post.count({ where: { status: 'PUBLISHED', categoryId: subCategory.id } }),
    ])

    const posts = await mapPostsWithImages(rawPosts as any)
    const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE)

    const schemaCat = { id: subCategory.id, name: subCategory.name, slug: subCategory.slug, description: subCategory.description, metaTitle: subCategory.metaTitle, metaDesc: subCategory.metaDesc, parent: parentCategory ? { name: parentCategory.name, slug: parentCategory.slug } : null }
    const schema = generateCategorySchema(schemaCat, { siteName, siteUrl, defaultOgImage })

    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
        <CategoryDispatcher
          template={template}
          category={subCategory}
          subcategories={subCategory.children}
          posts={posts as any}
          pagination={{ currentPage, totalPages, totalCount }}
          site={{ siteName, siteUrl }}
          parentCategory={parentCategory ?? null}
          seoSettings={seo}
          categories={navCategories}
        />
      </>
    )
  }

  // ── Case 2: Article in root category ────────────────────────────────────
  const post = await prisma.post.findFirst({
    where: { slug, status: 'PUBLISHED', category: { slug: categorySlug, parentId: null } },
    include: {
      author: { select: { name: true, email: true, slug: true, title: true, bio: true, photo: true, website: true } },
      category: { select: { id: true, name: true, slug: true, parent: { select: { id: true, name: true, slug: true } } } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
      fieldValues: {
        include: {
          fieldDefinition: { select: { fieldKey: true, fieldLabel: true, fieldType: true, sortOrder: true } },
        },
        orderBy: { fieldDefinition: { sortOrder: 'asc' } },
      },
    },
  })

  if (!post) {
    // Legacy URL (/group/slug -> /group/sub/slug) or explicit alias: permanent redirect.
    // Next only offers 308 from server components (no 301).
    const siteId = await resolveSiteId(categorySlug)
    const target = siteId ? await findLegacyRedirect({ siteId, group: categorySlug, slug }) : null
    if (target) permanentRedirect(target)
    notFound()
  }

  const { siteName, siteUrl, defaultOgImage, template, seo } = await getSiteData(post.siteId)
  const featuredImage = await fetchFeaturedImage(post.featuredImageId)

  const navCategories2 = await prisma.category.findMany({
    where: { siteId: post.siteId, parentId: null },
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  })

  // Related posts: other recent posts of the same group
  const groupId = post.category?.parent?.id ?? post.category?.id
  const rawRelated = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      id: { not: post.id },
      ...(groupId
        ? { category: { OR: [{ id: groupId }, { parentId: groupId }] } }
        : { categoryId: post.categoryId }),
    },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    include: { category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } } },
  })
  const relatedPosts = await mapPostsWithImages(rawRelated as any)

  const schemaPost = {
    id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt ?? null,
    contentJson: post.contentJson as Record<string, unknown>,
    metaTitle: post.metaTitle ?? null, metaDescription: post.metaDescription ?? null,
    publishedAt: post.publishedAt ?? null, updatedAt: post.updatedAt, createdAt: post.createdAt,
    author: post.author ? { name: post.author.name ?? null, email: post.author.email, slug: post.author.slug ?? null } : null,
    featuredImage: featuredImage ? { url: featuredImage.url, altText: featuredImage.altText } : null,
    category: post.category ?? null, noIndex: post.noIndex, canonicalUrl: post.canonicalUrl ?? null,
  }
  const schema = generatePostSchema(schemaPost, { siteName, siteUrl, defaultOgImage })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      <ArticleDispatcher
        template={template}
        post={{ ...post, featuredImage, author: post.author ?? null, category: post.category ?? null }}
        relatedPosts={relatedPosts as any}
        site={{ siteName, siteUrl }}
        seoSettings={seo}
        categories={navCategories2}
        fieldValues={post.fieldValues}
      />
    </>
  )
}
