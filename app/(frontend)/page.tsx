import { prisma } from '@/lib/prisma'
import HomepageTemplate from '@/components/frontend/HomepageTemplate'
import type { Metadata } from 'next'

export const revalidate = 1800

export async function generateMetadata(): Promise<Metadata> {
  const seo = await prisma.seoSettings.findFirst({ include: { site: true } })
  if (!seo) return { title: 'Acasă' }
  return {
    title: seo.defaultMetaTitle ?? seo.siteName,
    description: seo.defaultMetaDesc ?? undefined,
    openGraph: {
      title: seo.defaultMetaTitle ?? seo.siteName,
      description: seo.defaultMetaDesc ?? undefined,
      url: seo.siteUrl,
      images: seo.defaultOgImage ? [{ url: seo.defaultOgImage }] : [],
    },
    alternates: { canonical: seo.siteUrl },
  }
}

export default async function HomePage() {
  const site = await prisma.site.findFirst({ where: { isActive: true } })
  const seo = site
    ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } })
    : null

  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED', siteId: site?.id },
    take: 6,
    orderBy: { publishedAt: 'desc' },
    include: {
      author: { select: { name: true, email: true } },
      category: { select: { name: true, slug: true } },
    },
  })

  // featuredImageId is a bare String? field — no Prisma relation. Fetch images separately.
  const imageIds = posts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const mediaItems =
    imageIds.length > 0
      ? await prisma.media.findMany({
          where: { id: { in: imageIds } },
          select: { id: true, url: true, altText: true, width: true, height: true },
        })
      : []
  const mediaMap = new Map(mediaItems.map((m) => [m.id, m]))

  const categories = await prisma.category.findMany({
    where: { siteId: site?.id, parentId: null },
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  })

  const siteData = {
    siteName: seo?.siteName ?? site?.name ?? 'Site',
    siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
    defaultOgImage: seo?.defaultOgImage ?? null,
  }

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

  return (
    <HomepageTemplate
      latestPosts={mappedPosts}
      categories={categories}
      site={siteData}
      seoSettings={seo ?? null}
    />
  )
}
