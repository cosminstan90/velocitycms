import { prisma } from '@/lib/prisma'
import AuthorPageTemplate from '@/components/frontend/shared/AuthorPageTemplate'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

export const revalidate = 3600

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
  const { siteName, siteUrl } = await getSiteData()

  const author = await prisma.user.findUnique({ where: { slug } })
  if (!author) return { title: 'Autor negăsit' }

  const name = author.name ?? author.email
  const title = `${name} | ${siteName}`
  const description = author.bio ?? `Articole scrise de ${name} pe ${siteName}`
  const canonical = `${siteUrl.replace(/\/$/, '')}/autor/${slug}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      images: author.photo ? [{ url: author.photo }] : [],
    },
  }
}

export default async function AuthorPage({ params, searchParams }: Props) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const currentPage = Math.max(1, parseInt(pageParam ?? '1', 10))
  const skip = (currentPage - 1) * POSTS_PER_PAGE

  const { siteId, template, siteName, siteUrl } = await getSiteData()
  if (!siteId) notFound()

  const author = await prisma.user.findUnique({ where: { slug } })
  if (!author) notFound()

  const [rawPosts, totalCount] = await Promise.all([
    prisma.post.findMany({
      where: { status: 'PUBLISHED', siteId: siteId!, authorId: author.id },
      take: POSTS_PER_PAGE,
      skip,
      orderBy: { publishedAt: 'desc' },
      include: { category: { select: { name: true, slug: true } } },
    }),
    prisma.post.count({ where: { status: 'PUBLISHED', siteId: siteId!, authorId: author.id } }),
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
  }))

  return (
    <AuthorPageTemplate
      template={template}
      author={{
        name: author.name,
        slug: author.slug,
        title: author.title,
        bio: author.bio,
        photo: author.photo,
        website: author.website,
      }}
      posts={posts}
      pagination={{ currentPage, totalPages: Math.ceil(totalCount / POSTS_PER_PAGE), totalCount }}
      site={{ siteName, siteUrl }}
    />
  )
}
