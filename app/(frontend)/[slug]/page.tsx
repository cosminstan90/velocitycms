import { prisma } from '@/lib/prisma'
import { CategoryDispatcher } from '@/components/frontend/TemplateDispatcher'
import StaticPageTemplate from '@/components/frontend/shared/StaticPageTemplate'
import { generateCategorySchema, generatePageSchema } from '@/lib/seo/schema-generator'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const POSTS_PER_PAGE = 12

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateStaticParams() {
  // Return empty array — pages are generated on first request and cached by ISR
  // (revalidate = 86400). Pre-rendering at build time requires a live DB connection.
  return []
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  // Check category first
  const category = await prisma.category.findFirst({
    where: { slug, parentId: null },
  })

  if (category) {
    const seo = await prisma.seoSettings.findFirst({ where: { siteId: category.siteId } })
    const siteName = seo?.siteName ?? 'Site'
    const siteUrl = seo?.siteUrl ?? 'http://localhost'
    const title = category.metaTitle ?? category.name
    const description = category.metaDesc ?? category.description ?? undefined
    const canonical = `${siteUrl}/${slug}`
    return {
      title: `${title} | ${siteName}`,
      description,
      openGraph: {
        title,
        description,
        url: canonical,
        images: seo?.defaultOgImage ? [{ url: seo.defaultOgImage }] : [],
      },
      alternates: { canonical },
    }
  }

  // Check page
  const page = await prisma.page.findFirst({
    where: { slug, status: 'PUBLISHED' },
  })

  if (page) {
    const seo = await prisma.seoSettings.findFirst({ where: { siteId: page.siteId } })
    const siteName = seo?.siteName ?? 'Site'
    const siteUrl = seo?.siteUrl ?? 'http://localhost'
    const title = page.metaTitle ?? page.title
    const description = page.metaDescription ?? undefined
    const canonical = page.canonicalUrl ?? `${siteUrl}/${slug}`
    return {
      title: `${title} | ${siteName}`,
      description,
      robots: page.noIndex ? { index: false, follow: false } : undefined,
      openGraph: {
        title,
        description,
        url: canonical,
      },
      alternates: { canonical },
    }
  }

  return { title: 'Pagină negăsită' }
}

export default async function SlugPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10))
  const skip = (currentPage - 1) * POSTS_PER_PAGE

  // 1. Try category (root-level only)
  const category = await prisma.category.findFirst({
    where: { slug, parentId: null },
    include: {
      children: {
        select: { id: true, name: true, slug: true, description: true, _count: { select: { posts: true } } },
      },
    },
  })

  if (category) {
    const site = await prisma.site.findUnique({ where: { id: category.siteId } })
    const seo = await prisma.seoSettings.findFirst({ where: { siteId: category.siteId } })
    const siteData = {
      siteName: seo?.siteName ?? site?.name ?? 'Site',
      siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
      defaultOgImage: seo?.defaultOgImage ?? null,
    }

    // Fetch all root categories for navigation
    const navCategories = await prisma.category.findMany({
      where: { siteId: category.siteId, parentId: null },
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })

    const [posts, totalCount] = await Promise.all([
      prisma.post.findMany({
        where: { status: 'PUBLISHED', categoryId: category.id },
        take: POSTS_PER_PAGE,
        skip,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { name: true, email: true } },
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.post.count({ where: { status: 'PUBLISHED', categoryId: category.id } }),
    ])

    const imageIds = posts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
    const mediaItems =
      imageIds.length > 0
        ? await prisma.media.findMany({
            where: { id: { in: imageIds } },
            select: { id: true, url: true, altText: true, width: true, height: true },
          })
        : []
    const mediaMap = new Map(mediaItems.map((m) => [m.id, m]))

    const mappedPosts = posts.map((p) => {
      const media = p.featuredImageId ? (mediaMap.get(p.featuredImageId) ?? null) : null
      return {
        ...p,
        featuredImage: media
          ? { url: media.url, altText: media.altText ?? null, width: media.width ?? null, height: media.height ?? null }
          : null,
        author: p.author ?? null,
        category: p.category ?? null,
      }
    })

    const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE)

    const schemaCategory = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description ?? null,
      metaTitle: category.metaTitle ?? null,
      metaDesc: category.metaDesc ?? null,
    }
    const schema = generateCategorySchema(schemaCategory, siteData)

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
        <CategoryDispatcher
          template={site?.template ?? 'default'}
          category={category}
          posts={mappedPosts}
          subcategories={category.children}
          site={siteData}
          seoSettings={seo ?? null}
          pagination={{ currentPage, totalPages, totalCount }}
          categories={navCategories}
        />
      </>
    )
  }

  // 2. Try static page
  const page = await prisma.page.findFirst({
    where: { slug, status: 'PUBLISHED' },
  })

  if (page) {
    const site = await prisma.site.findUnique({ where: { id: page.siteId } })
    const seo = await prisma.seoSettings.findFirst({ where: { siteId: page.siteId } })
    const navCategories = await prisma.category.findMany({
      where: { siteId: page.siteId, parentId: null },
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })
    const siteData = {
      siteName: seo?.siteName ?? site?.name ?? 'Site',
      siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
      defaultOgImage: seo?.defaultOgImage ?? null,
    }

    const schemaPage = {
      id: page.id,
      title: page.title,
      slug: page.slug,
      metaTitle: page.metaTitle ?? null,
      metaDescription: page.metaDescription ?? null,
      publishedAt: page.publishedAt ?? null,
      updatedAt: page.updatedAt,
      canonicalUrl: page.canonicalUrl ?? null,
    }
    const schema = generatePageSchema(schemaPage, siteData)

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
        <StaticPageTemplate
          template={site?.template ?? 'default'}
          page={{ title: page.title, contentHtml: page.contentHtml }}
          site={{ siteName: siteData.siteName, siteUrl: siteData.siteUrl }}
          categories={navCategories}
        />
      </>
    )
  }

  notFound()
}
