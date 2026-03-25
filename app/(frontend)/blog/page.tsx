import { prisma } from '@/lib/prisma'
import CategoryTemplate from '@/components/frontend/CategoryTemplate'
import type { Metadata } from 'next'

export const revalidate = 3600

const POSTS_PER_PAGE = 12

type Props = {
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const seo = await prisma.seoSettings.findFirst()
    const siteName = seo?.siteName ?? 'Site'
    return {
      title: `Blog | ${siteName}`,
      description: seo?.defaultMetaDesc ?? undefined,
      openGraph: {
        title: `Blog | ${siteName}`,
        description: seo?.defaultMetaDesc ?? undefined,
        images: seo?.defaultOgImage ? [{ url: seo.defaultOgImage }] : [],
      },
    }
  } catch {
    return { title: 'Blog' }
  }
}

export default async function BlogPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10))
  const skip = (currentPage - 1) * POSTS_PER_PAGE

  let site = null
  let seo = null
  let posts: any[] = []
  let totalCount = 0

  try {
    site = await prisma.site.findFirst({ where: { isActive: true } })
    seo = site
      ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } })
      : null

    const results = await Promise.all([
      prisma.post.findMany({
        where: { status: 'PUBLISHED', siteId: site?.id },
        take: POSTS_PER_PAGE,
        skip,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { name: true, email: true } },
          category: { select: { name: true, slug: true } },
        },
      }),
      prisma.post.count({
        where: { status: 'PUBLISHED', siteId: site?.id },
      }),
    ])
    posts = results[0]
    totalCount = results[1]
  } catch {
    // DB unavailable at build time — ISR will populate on first runtime request
  }

  // Fetch featured images separately (no Prisma relation on featuredImageId)
  const imageIds = posts.map((p: any) => p.featuredImageId).filter((id): id is string => !!id)
  let mediaItems: any[] = []
  try {
    mediaItems =
      imageIds.length > 0
        ? await prisma.media.findMany({
            where: { id: { in: imageIds } },
            select: { id: true, url: true, altText: true, width: true, height: true },
          })
        : []
  } catch {
    // no-op
  }
  const mediaMap = new Map(mediaItems.map((m: any) => [m.id, m]))

  const mappedPosts = posts.map((p: any) => {
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

  const siteData = {
    siteName: seo?.siteName ?? site?.name ?? 'Site',
    siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
    defaultOgImage: seo?.defaultOgImage ?? null,
  }

  // Fake "Blog" category object to satisfy CategoryTemplate
  const blogCategory = {
    id: 'blog',
    name: 'Blog',
    slug: 'blog',
    description: null,
    metaTitle: null,
    metaDesc: null,
    siteId: site?.id ?? '',
    parentId: null,
    createdAt: new Date(),
  }

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE)

  return (
    <CategoryTemplate
      category={blogCategory}
      posts={mappedPosts}
      subcategories={[]}
      site={siteData}
      seoSettings={seo ?? null}
      pagination={{ currentPage, totalPages, totalCount }}
    />
  )
}
