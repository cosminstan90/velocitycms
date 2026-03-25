/**
 * Route: /[categorySlug]/[subCategorySlug]/[slug]
 * Article inside a subcategory.
 */
import { prisma } from '@/lib/prisma'
import ArticleTemplate from '@/components/frontend/ArticleTemplate'
import { generatePostSchema } from '@/lib/seo/schema-generator'
import { buildCanonicalUrl } from '@/lib/seo/canonical-builder'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 7200

type Props = {
  params: Promise<{ categorySlug: string; subCategorySlug: string; slug: string }>
}

async function getSiteData(siteId: string) {
  const [site, seo] = await Promise.all([
    prisma.site.findUnique({ where: { id: siteId } }),
    prisma.seoSettings.findFirst({ where: { siteId } }),
  ])
  return {
    siteName: seo?.siteName ?? site?.name ?? 'Site',
    siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
    defaultOgImage: seo?.defaultOgImage ?? null,
    seo,
  }
}

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      category: { parentId: { not: null } },
    },
    select: {
      slug: true,
      category: { select: { slug: true, parent: { select: { slug: true } } } },
    },
  })

  return posts
    .filter((p) => p.category?.parent)
    .map((p) => ({
      categorySlug: p.category!.parent!.slug,
      subCategorySlug: p.category!.slug,
      slug: p.slug,
    }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categorySlug, subCategorySlug, slug } = await params

  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      category: { slug: subCategorySlug, parent: { slug: categorySlug } },
    },
    include: { author: { select: { name: true, email: true } } },
  })

  if (!post) return { title: 'Articol negăsit' }

  const { siteName, siteUrl, defaultOgImage, seo } = await getSiteData(post.siteId)
  const title = post.metaTitle ?? post.title
  const description = post.metaDescription ?? post.excerpt ?? undefined

  let ogImageUrl: string | undefined
  for (const imageId of [post.ogImageId, post.featuredImageId]) {
    if (imageId) {
      const m = await prisma.media.findUnique({ where: { id: imageId }, select: { url: true } })
      if (m?.url) { ogImageUrl = m.url; break }
    }
  }
  if (!ogImageUrl && defaultOgImage) ogImageUrl = defaultOgImage

  const canonical = buildCanonicalUrl(
    post,
    { siteUrl },
    { slug: subCategorySlug, parent: { slug: categorySlug } }
  )

  return {
    title: `${title} | ${siteName}`,
    description,
    robots: post.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: post.ogTitle ?? title,
      description: post.ogDescription ?? description,
      url: canonical,
      images: ogImageUrl ? [{ url: ogImageUrl }] : [],
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
    },
    alternates: { canonical },
  }
}

export default async function SubCategoryPostPage({ params }: Props) {
  const { categorySlug, subCategorySlug, slug } = await params

  const post = await prisma.post.findFirst({
    where: {
      slug,
      status: 'PUBLISHED',
      category: { slug: subCategorySlug, parent: { slug: categorySlug } },
    },
    include: {
      author: { select: { name: true, email: true } },
      category: { select: { name: true, slug: true } },
      tags: { include: { tag: { select: { id: true, name: true, slug: true } } } },
    },
  })

  if (!post) notFound()

  const { siteName, siteUrl, defaultOgImage, seo } = await getSiteData(post.siteId)

  const featuredImage = post.featuredImageId
    ? await prisma.media.findUnique({ where: { id: post.featuredImageId }, select: { url: true, altText: true, width: true, height: true } })
    : null

  // Related posts: same subcategory, exclude current
  const rawRelated = await prisma.post.findMany({
    where: { status: 'PUBLISHED', categoryId: post.categoryId, id: { not: post.id } },
    take: 3,
    orderBy: { publishedAt: 'desc' },
    include: { category: { select: { name: true, slug: true } } },
  })

  const relatedImageIds = rawRelated.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const relatedMediaMap = new Map(
    relatedImageIds.length
      ? (await prisma.media.findMany({ where: { id: { in: relatedImageIds } }, select: { id: true, url: true, altText: true } })).map((m) => [m.id, m])
      : []
  )
  const relatedPosts = rawRelated.map((p) => ({
    ...p,
    featuredImage: p.featuredImageId ? (relatedMediaMap.get(p.featuredImageId) ?? null) : null,
    author: null,
    category: p.category ?? null,
  }))

  const parentCategory = await prisma.category.findFirst({
    where: { slug: categorySlug },
    select: { name: true, slug: true },
  })

  const subCategory = post.category
    ? { name: post.category.name, slug: post.category.slug }
    : null

  const schemaPost = {
    id: post.id, title: post.title, slug: post.slug, excerpt: post.excerpt ?? null,
    contentJson: post.contentJson as Record<string, unknown>,
    metaTitle: post.metaTitle ?? null, metaDescription: post.metaDescription ?? null,
    publishedAt: post.publishedAt ?? null, updatedAt: post.updatedAt, createdAt: post.createdAt,
    author: post.author ? { name: post.author.name ?? null, email: post.author.email } : null,
    featuredImage: featuredImage ? { url: featuredImage.url, altText: featuredImage.altText ?? null } : null,
    category: post.category ?? null, noIndex: post.noIndex, canonicalUrl: post.canonicalUrl ?? null,
  }
  const schema = generatePostSchema(schemaPost, { siteName, siteUrl, defaultOgImage })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />
      <ArticleTemplate
        post={{
          ...post,
          featuredImage: featuredImage
            ? { url: featuredImage.url, altText: featuredImage.altText ?? null, width: featuredImage.width ?? null, height: featuredImage.height ?? null }
            : null,
          author: post.author ?? null,
          category: post.category ?? null,
        }}
        relatedPosts={relatedPosts as any}
        site={{ siteName, siteUrl }}
        subCategory={subCategory}
        breadcrumbExtra={parentCategory ? [{ name: parentCategory.name, href: `/${categorySlug}` }] : []}
        seoSettings={seo}
      />
    </>
  )
}
