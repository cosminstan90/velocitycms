import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { buildPostPath } from '@/lib/seo/canonical-builder'
import { NAVIGATION_TAG, POSTS_TAG } from '@/lib/navigation'

export type HomeImage = { url: string; alt: string }

export type HomePost = {
  title: string
  /** Numele scurt al fisei, fara sufixul descriptiv ("Labrador - Rasa de caini..." -> "Labrador"). */
  shortName: string
  href: string
  image: HomeImage | null
  groupName: string
  groupSlug: string
  subName: string | null
  tldr: string | null
  meta: string | null
  publishedAt: Date | string | null
}

export type HomeGroup = {
  id: string
  name: string
  slug: string
  href: string
  count: number
  cover: HomeImage | null
  children: Array<{ name: string; href: string; count: number }>
}

export type HomeData = {
  totalPosts: number
  groups: HomeGroup[]
  featured: HomePost[]
  mosaic: HomePost[]
  latest: HomePost[]
  updatedAt: Date | string | null
}

export type HomeCategoryRow = {
  id: string
  name: string
  slug: string
  parentId: string | null
  sortOrder: number
  showInNav: boolean
}

export type HomePostRow = {
  title: string
  slug: string
  publishedAt: Date | string | null
  updatedAt: Date | string | null
  image: HomeImage | null
  category: { id: string; name: string; slug: string; parentId: string | null; parent: { name: string; slug: string } | null } | null
  tldr: string | null
  meta: string | null
}

const FEATURED = 5
const MOSAIC = 5
const LATEST = 8

export function shortName(title: string): string {
  const cut = title.split(/\s[-–—]\s/)[0]?.trim()
  return cut ? cut : title
}

function toHomePost(row: HomePostRow): HomePost {
  const cat = row.category
  const root = cat ? (cat.parent ?? cat) : null
  return {
    title: row.title,
    shortName: shortName(row.title),
    href: buildPostPath({ slug: row.slug }, cat ? { slug: cat.slug, parent: cat.parent ? { slug: cat.parent.slug } : null } : null),
    image: row.image,
    groupName: root?.name ?? '',
    groupSlug: root?.slug ?? '',
    subName: cat && cat.parent ? cat.name : null,
    tldr: row.tldr,
    meta: row.meta,
    publishedAt: row.publishedAt,
  }
}

/**
 * Functie pura: din categorii, numaratori si articole (deja sortate descrescator dupa data)
 * construieste tot ce arata homepage-ul. O pastrez separata de baza de date ca sa fie testabila.
 */
export function buildHomeData(
  categories: HomeCategoryRow[],
  countByCategory: Map<string, number>,
  posts: HomePostRow[],
): HomeData {
  const roots = categories.filter((c) => c.parentId === null && c.showInNav).sort(byOrder)
  const homePosts = posts.map(toHomePost)

  const groups: HomeGroup[] = roots
    .map((root) => {
      const kids = categories.filter((c) => c.parentId === root.id && c.showInNav).sort(byOrder)
      const childRows = kids
        .map((k) => ({ name: k.name, href: `/${root.slug}/${k.slug}`, count: countByCategory.get(k.id) ?? 0 }))
        .filter((k) => k.count > 0)
      const count = (countByCategory.get(root.id) ?? 0) + childRows.reduce((s, k) => s + k.count, 0)
      const cover = homePosts.find((p) => p.groupSlug === root.slug && p.image)?.image ?? null
      return { id: root.id, name: root.name, slug: root.slug, href: `/${root.slug}`, count, cover, children: childRows }
    })
    .filter((g) => g.count > 0)

  // "Round-robin" pe grupuri: cea mai noua fisa cu imagine din fiecare grup, apoi a doua etc.
  const withImage = homePosts.filter((p) => p.image)
  const perGroup = groups.map((g) => withImage.filter((p) => p.groupSlug === g.slug))
  const rotation: HomePost[] = []
  for (let round = 0; rotation.length < withImage.length; round++) {
    let added = false
    for (const list of perGroup) {
      if (list[round]) {
        rotation.push(list[round])
        added = true
      }
    }
    if (!added) break
  }

  const featuredPool = rotation.filter((p) => p.tldr)
  const featured = (featuredPool.length >= FEATURED ? featuredPool : rotation).slice(0, FEATURED)
  const rest = rotation.filter((p) => !featured.includes(p))
  const mosaic = (rest.length >= MOSAIC ? rest : rotation).slice(0, MOSAIC)

  const totalPosts = [...countByCategory.values()].reduce((s, n) => s + n, 0)
  const updated = posts.reduce<Date | string | null>((max, p) => {
    const d = p.updatedAt ?? p.publishedAt
    if (!d) return max
    return !max || new Date(d) > new Date(max) ? d : max
  }, null)

  return { totalPosts, groups, featured, mosaic, latest: homePosts.slice(0, LATEST), updatedAt: updated }
}

function byOrder(a: HomeCategoryRow, b: HomeCategoryRow): number {
  if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
  return a.name.localeCompare(b.name, 'ro')
}

function resolveUrl(url: string, siteUrl: string): string {
  return url.startsWith('/') ? `${siteUrl.replace(/\/$/, '')}${url}` : url
}

async function fetchHomeData(siteId: string, siteUrl: string): Promise<HomeData> {
  const [categories, counts, posts] = await Promise.all([
    prisma.category.findMany({
      where: { siteId },
      select: { id: true, name: true, slug: true, parentId: true, sortOrder: true, showInNav: true },
    }),
    prisma.post.groupBy({
      by: ['categoryId'],
      where: { siteId, status: 'PUBLISHED', categoryId: { not: null } },
      _count: { _all: true },
    }),
    prisma.post.findMany({
      where: { siteId, status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 120,
      select: {
        title: true,
        slug: true,
        publishedAt: true,
        updatedAt: true,
        featuredImageId: true,
        category: { select: { id: true, name: true, slug: true, parentId: true, parent: { select: { name: true, slug: true } } } },
        fieldValues: {
          where: { fieldDefinition: { fieldKey: { in: ['tldr', 'talie', 'greutate', 'speranta_viata'] } } },
          select: { value: true, fieldDefinition: { select: { fieldKey: true } } },
        },
      },
    }),
  ])

  const mediaIds = posts.map((p) => p.featuredImageId).filter((id): id is string => !!id)
  const media = mediaIds.length
    ? await prisma.media.findMany({ where: { id: { in: mediaIds } }, select: { id: true, url: true, altText: true } })
    : []
  const mediaById = new Map(media.map((m) => [m.id, m]))

  const rows: HomePostRow[] = posts.map((p) => {
    const m = p.featuredImageId ? mediaById.get(p.featuredImageId) : null
    const val = (key: string) => p.fieldValues.find((v) => v.fieldDefinition.fieldKey === key)?.value.trim() || null
    const meta = [val('talie'), val('greutate'), val('speranta_viata')].filter(Boolean).join(' · ')
    return {
      title: p.title,
      slug: p.slug,
      publishedAt: p.publishedAt,
      updatedAt: p.updatedAt,
      image: m ? { url: resolveUrl(m.url, siteUrl), alt: m.altText ?? p.title } : null,
      category: p.category,
      tldr: val('tldr'),
      meta: meta || null,
    }
  })

  return buildHomeData(categories, new Map(counts.map((c) => [c.categoryId as string, c._count._all])), rows)
}

/** Datele homepage-ului, cu cache; se invalideaza la publicare si la schimbarea categoriilor. */
export function getHomeData(siteId: string, siteUrl: string): Promise<HomeData> {
  return unstable_cache(() => fetchHomeData(siteId, siteUrl), ['divet-home', siteId, siteUrl], {
    revalidate: 900,
    tags: [NAVIGATION_TAG, POSTS_TAG],
  })()
}
