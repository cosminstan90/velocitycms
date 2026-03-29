/**
 * Route: /comparatie
 *
 * Lists all comparison posts. Uses CategoryDispatcher with the "comparatie" category.
 */

import { prisma } from '@/lib/prisma'
import { CategoryDispatcher } from '@/components/frontend/TemplateDispatcher'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

const POSTS_PER_PAGE = 12

type Props = {
  searchParams: Promise<{ page?: string }>
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await prisma.site.findFirst({ where: { isActive: true } })
  const seo = site ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } }) : null
  const siteName = seo?.siteName ?? site?.name ?? 'Site'
  return {
    title: `Comparații Animale | ${siteName}`,
    description: `Compară rase de animale. Află diferențele și asemănările dintre cele mai populare rase.`,
  }
}

export default async function ComparisonsListPage({ searchParams }: Props) {
  const { page: pageStr } = await searchParams
  const currentPage = Math.max(1, parseInt(pageStr ?? '1', 10) || 1)

  const site = await prisma.site.findFirst({ where: { isActive: true } })
  if (!site) notFound()

  const seo = await prisma.seoSettings.findFirst({ where: { siteId: site.id } })

  // Find the "comparatie" category
  const category = await prisma.category.findFirst({
    where: { slug: 'comparatie', siteId: site.id },
  })

  if (!category) notFound()

  const [totalCount, posts] = await Promise.all([
    prisma.post.count({ where: { siteId: site.id, status: 'PUBLISHED', categoryId: category.id } }),
    prisma.post.findMany({
      where: { siteId: site.id, status: 'PUBLISHED', categoryId: category.id },
      skip: (currentPage - 1) * POSTS_PER_PAGE,
      take: POSTS_PER_PAGE,
      orderBy: { publishedAt: 'desc' },
      include: {
        author: { select: { name: true } },
        category: { select: { name: true, slug: true } },
      },
    }),
  ])

  // Fetch featured images
  const imageIds = posts.map((p) => (p as any).featuredImageId).filter((id): id is string => !!id)
  const mediaItems = imageIds.length > 0
    ? await prisma.media.findMany({ where: { id: { in: imageIds } }, select: { id: true, url: true, altText: true, width: true, height: true } })
    : []
  const mediaMap = new Map(mediaItems.map((m) => [m.id, m]))

  const mappedPosts = posts.map((p: any) => {
    const media = p.featuredImageId ? mediaMap.get(p.featuredImageId) ?? null : null
    return {
      ...p,
      featuredImage: media ? { url: media.url, altText: media.altText ?? null, width: media.width ?? null, height: media.height ?? null } : null,
    }
  })

  // All root categories for nav
  const categories = await prisma.category.findMany({
    where: { siteId: site.id, parentId: null },
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' },
  })

  const siteName = seo?.siteName ?? site.name ?? 'Site'
  const siteUrl = seo?.siteUrl ?? `http://${site.domain ?? 'localhost'}`

  return (
    <CategoryDispatcher
      template={site.template ?? 'default'}
      category={{
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description,
        metaTitle: category.metaTitle,
        metaDesc: category.metaDesc,
      }}
      subcategories={[]}
      posts={mappedPosts}
      pagination={{
        currentPage,
        totalPages: Math.ceil(totalCount / POSTS_PER_PAGE),
        totalCount,
      }}
      site={{ siteName, siteUrl }}
      categories={categories}
      seoSettings={seo}
    />
  )
}
