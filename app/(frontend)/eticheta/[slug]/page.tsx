import { prisma } from '@/lib/prisma'
import { ogImages } from '@/lib/default-og'
import { parsePageParam } from '@/lib/pagination'
import { TagDispatcher } from '@/components/frontend/TemplateDispatcher'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CARD_META_KEYS } from '@/lib/fields'

export const dynamic = 'force-dynamic'

const POSTS_PER_PAGE = 12

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

export async function generateStaticParams() {
  return []
}

async function getSiteData() {
  const site = await prisma.site.findFirst({ where: { isActive: true } })
  const seo = site ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } }) : null
  return {
    siteId: site?.id ?? null,
    template: site?.template ?? 'default',
    siteName: seo?.siteName ?? site?.name ?? 'Site',
    siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { siteId, siteName, siteUrl } = await getSiteData()
  if (!siteId) return { title: 'Etichetă negăsită' }

  const tag = await prisma.tag.findUnique({ where: { siteId_slug: { siteId, slug } } })
  if (!tag) return { title: 'Etichetă negăsită' }

  const title = tag.metaTitle ?? `${tag.name} | ${siteName}`
  const description = tag.metaDesc ?? tag.description ?? `Articole etichetate cu ${tag.name}`
  const canonical = `${siteUrl.replace(/\/$/, '')}/eticheta/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: ogImages(siteUrl) },
  }
}

export default async function TagPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const currentPage = parsePageParam(pageParam)
  const skip = (currentPage - 1) * POSTS_PER_PAGE

  const { siteId, template, siteName, siteUrl } = await getSiteData()
  if (!siteId) notFound()

  const tag = await prisma.tag.findUnique({ where: { siteId_slug: { siteId: siteId!, slug } } })
  if (!tag) notFound()

  const [rawPosts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'PUBLISHED', siteId: siteId!, tags: { some: { tagId: tag.id } } },
      take: POSTS_PER_PAGE,
      skip,
      orderBy: { publishedAt: 'desc' },
      include: {
        category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
        fieldValues: {
          where: { fieldDefinition: { fieldKey: { in: [...CARD_META_KEYS] } } },
          select: { value: true, fieldDefinition: { select: { fieldKey: true } } },
        },
        author: { select: { name: true } },
      },
    }),
    prisma.post.count({
      where: { status: 'PUBLISHED', siteId: siteId!, tags: { some: { tagId: tag.id } } },
    }),
  ])

  const imageIds = rawPosts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const mediaMap = new Map(
    imageIds.length
      ? (await prisma.media.findMany({ where: { id: { in: imageIds } }, select: { id: true, url: true, altText: true } })).map((m) => [m.id, m])
      : []
  )

  const posts = rawPosts.map((p) => ({
    ...p,
    featuredImage: p.featuredImageId ? (mediaMap.get(p.featuredImageId) ?? null) : null,
    author: p.author ?? null,
    category: p.category ?? null,
  }))

  let navCategories: any[] = []
  try {
    navCategories = await prisma.category.findMany({
      where: { siteId: siteId!, parentId: null },
      include: { _count: { select: { posts: true } } },
      orderBy: { name: 'asc' },
    })
  } catch { /* no-op */ }

  return (
    <TagDispatcher
      template={template}
      tag={tag}
      posts={posts}
      pagination={{ currentPage, totalPages: Math.ceil(totalCount / POSTS_PER_PAGE), totalCount }}
      site={{ siteName, siteUrl }}
      categories={navCategories}
    />
  )
}
