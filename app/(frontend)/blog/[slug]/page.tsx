import { prisma } from '@/lib/prisma'
import ArticleTemplate from '@/components/frontend/ArticleTemplate'
import { generatePostSchema } from '@/lib/seo/schema-generator'
import { buildCanonicalUrl } from '@/lib/seo/canonical-builder'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 7200

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED', categoryId: null },
    select: { slug: true },
  })
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  const post = await prisma.post.findFirst({
    where: { slug, status: 'PUBLISHED', categoryId: null },
    include: {
      author: { select: { name: true, email: true } },
      category: { select: { name: true, slug: true } },
    },
  })

  if (!post) return { title: 'Articol negăsit' }

  const seo = await prisma.seoSettings.findFirst({ where: { siteId: post.siteId } })
  const siteName = seo?.siteName ?? 'Site'
  const siteUrl = seo?.siteUrl ?? 'http://localhost'

  const title = post.metaTitle ?? post.title
  const description = post.metaDescription ?? post.excerpt ?? undefined

  let ogImageUrl: string | undefined
  if (post.ogImageId) {
    const ogMedia = await prisma.media.findUnique({ where: { id: post.ogImageId }, select: { url: true } })
    ogImageUrl = ogMedia?.url
  } else if (post.featuredImageId) {
    const featMedia = await prisma.media.findUnique({ where: { id: post.featuredImageId }, select: { url: true } })
    ogImageUrl = featMedia?.url
  }
  if (!ogImageUrl && seo?.defaultOgImage) ogImageUrl = seo.defaultOgImage

  const canonical = buildCanonicalUrl(post, { siteUrl }, null)

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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  const post = await prisma.post.findFirst({
    where: { slug, status: 'PUBLISHED', categoryId: null },
    include: {
      author: { select: { name: true, email: true } },
      category: { select: { name: true, slug: true } },
      tags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
    },
  })

  if (!post) notFound()

  const site = await prisma.site.findUnique({ where: { id: post.siteId } })
  const seo = await prisma.seoSettings.findFirst({ where: { siteId: post.siteId } })

  const siteData = {
    siteName: seo?.siteName ?? site?.name ?? 'Site',
    siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
    defaultOgImage: seo?.defaultOgImage ?? null,
  }

  // Fetch featured image separately
  const featuredImage = post.featuredImageId
    ? await prisma.media.findUnique({
        where: { id: post.featuredImageId },
        select: { url: true, altText: true, width: true, height: true },
      })
    : null

  // Related posts: same site, no category, exclude current, last 3
  const relatedPosts = await prisma.post.findMany({
    where: {
      status: 'PUBLISHED',
      siteId: post.siteId,
      categoryId: null,
      id: { not: post.id },
    },
    take: 3,
    orderBy: { publishedAt: 'desc' },
    include: {
      author: { select: { name: true, email: true } },
      category: { select: { name: true, slug: true } },
    },
  })

  // Fetch featured images for related posts
  const relatedImageIds = relatedPosts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const relatedMediaItems =
    relatedImageIds.length > 0
      ? await prisma.media.findMany({
          where: { id: { in: relatedImageIds } },
          select: { id: true, url: true, altText: true },
        })
      : []
  const relatedMediaMap = new Map(relatedMediaItems.map((m) => [m.id, m]))

  const mappedRelatedPosts = relatedPosts.map((p) => {
    const media = p.featuredImageId ? (relatedMediaMap.get(p.featuredImageId) ?? null) : null
    return {
      ...p,
      featuredImage: media ? { url: media.url, altText: media.altText ?? null } : null,
      author: p.author ?? null,
      category: p.category ?? null,
    }
  })

  const schemaPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt ?? null,
    contentJson: post.contentJson as Record<string, unknown>,
    metaTitle: post.metaTitle ?? null,
    metaDescription: post.metaDescription ?? null,
    publishedAt: post.publishedAt ?? null,
    updatedAt: post.updatedAt,
    createdAt: post.createdAt,
    author: post.author ? { name: post.author.name ?? null, email: post.author.email } : null,
    featuredImage: featuredImage
      ? { url: featuredImage.url, altText: featuredImage.altText ?? null }
      : null,
    category: post.category ?? null,
    noIndex: post.noIndex,
    canonicalUrl: post.canonicalUrl ?? null,
  }

  const schema = generatePostSchema(schemaPost, siteData)

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
        relatedPosts={mappedRelatedPosts}
        site={siteData}
        seoSettings={seo ?? null}
      />
    </>
  )
}
