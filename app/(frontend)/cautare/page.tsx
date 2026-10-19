import { prisma } from '@/lib/prisma'
import { SearchDispatcher } from '@/components/frontend/TemplateDispatcher'
import { CARD_META_KEYS } from '@/lib/fields'
import { SQL_TRANSLATE_FROM, SQL_TRANSLATE_TO, toContainsPattern } from '@/lib/search'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

const MAX_RESULTS = 24

type Props = {
  searchParams: Promise<{ q?: string }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams
  try {
    const seo = await prisma.seoSettings.findFirst()
    const siteName = seo?.siteName ?? 'Site'
    const title = q ? `Căutare: "${q}" | ${siteName}` : `Căutare | ${siteName}`
    return {
      title,
      robots: { index: false, follow: true },
    }
  } catch {
    return { title: 'Căutare' }
  }
}

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams
  const query = (q ?? '').trim()

  let site = null
  let seo = null
  let results: any[] = []
  let totalCount = 0

  try {
    site = await prisma.site.findFirst({ where: { isActive: true } })
    seo = site ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } }) : null
  } catch { /* no-op */ }

  const siteData = {
    siteName: seo?.siteName ?? site?.name ?? 'Site',
    siteUrl: seo?.siteUrl ?? `http://${site?.domain ?? 'localhost'}`,
    defaultOgImage: seo?.defaultOgImage ?? null,
  }

  if (query && site) {
    try {
      // Potrivire fara diacritice: id-urile se aleg in SQL (translate + ILIKE), restul vine prin Prisma.
      const pattern = toContainsPattern(query)
      const matches = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM "Post"
        WHERE "siteId" = ${site.id} AND status = 'PUBLISHED'
          AND (translate(title, ${SQL_TRANSLATE_FROM}, ${SQL_TRANSLATE_TO}) ILIKE ${pattern}
            OR translate(COALESCE(excerpt, ''), ${SQL_TRANSLATE_FROM}, ${SQL_TRANSLATE_TO}) ILIKE ${pattern})`
      const matchIds = matches.map((m) => m.id)
      const idFilter = { status: 'PUBLISHED' as const, siteId: site.id, id: { in: matchIds } }

      const rawPosts = await prisma.post.findMany({
        where: idFilter,
        take: MAX_RESULTS,
        orderBy: { publishedAt: 'desc' },
        include: {
          author: { select: { name: true } },
          category: { select: { name: true, slug: true, parent: { select: { name: true, slug: true } } } },
          fieldValues: {
            where: { fieldDefinition: { fieldKey: { in: [...CARD_META_KEYS] } } },
            select: { value: true, fieldDefinition: { select: { fieldKey: true } } },
          },
        },
      })

      totalCount = matchIds.length

      const imageIds = rawPosts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
      const mediaItems =
        imageIds.length > 0
          ? await prisma.media.findMany({
              where: { id: { in: imageIds } },
              select: { id: true, url: true, altText: true },
            })
          : []
      const mediaMap = new Map(mediaItems.map((m) => [m.id, m]))

      results = rawPosts.map((p) => ({
        ...p,
        featuredImage: p.featuredImageId ? (mediaMap.get(p.featuredImageId) ?? null) : null,
        author: p.author ?? null,
        category: p.category ?? null,
      }))
    } catch { /* no-op */ }
  }

  let navCategories: any[] = []
  try {
    if (site) {
      navCategories = await prisma.category.findMany({
        where: { siteId: site.id, parentId: null },
        include: { _count: { select: { posts: true } } },
        orderBy: { name: 'asc' },
      })
    }
  } catch { /* no-op */ }

  return (
    <SearchDispatcher
      template={site?.template ?? 'default'}
      query={query}
      results={results}
      totalCount={totalCount}
      site={siteData}
      seoSettings={seo ?? null}
      categories={navCategories}
    />
  )
}
