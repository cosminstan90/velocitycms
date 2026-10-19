import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { SQL_TRANSLATE_FROM, SQL_TRANSLATE_TO, toContainsPattern } from '@/lib/search'
import { toCardProps } from '@/lib/post-card'
import {
  LISTING_TYPES,
  TYPE_ARTICLE_GROUP,
  TYPE_LABEL,
  TYPE_SEGMENT,
  cityListPath,
  formatPhone,
  listingPath,
  typeListPath,
  type ListingType,
} from '@/lib/listings'
import type { ListingCardProps } from '@/components/frontend/templates/divet/ListingCard'
import type { ArticleCardProps } from '@/components/frontend/templates/divet/ArticleCard'

export const PAGE_SIZE = 12

// ── Functii pure ─────────────────────────────────────────────────────────────

export function buildListingWhere(args: {
  siteId: string
  type: ListingType
  citySlug?: string
  county?: string
  /** Toate scrierile aceluiasi judet (variante); are prioritate fata de `county`. */
  counties?: string[]
  serviceSlug?: string
}): Prisma.ListingWhereInput {
  const { siteId, type, citySlug, county, counties, serviceSlug } = args
  return {
    siteId,
    type,
    status: 'PUBLISHED',
    ...(citySlug && { citySlug }),
    ...(counties && counties.length > 0 ? { county: { in: counties } } : county ? { county } : {}),
    ...(serviceSlug && { services: { some: { service: { slug: serviceSlug } } } }),
  }
}

/** Judetul din lista care corespunde parametrului din URL (slug, fara diacritice), sau undefined. */
export function resolveCounty(counties: string[], param: string | undefined): string | undefined {
  if (!param) return undefined
  const wanted = slugify(param)
  if (!wanted) return undefined
  return counties.find((c) => slugify(c) === wanted)
}

/** Toate scrierile din lista care au acelasi slug ca parametrul din URL. */
export function countyVariants(counties: string[], param: string | undefined): string[] {
  if (!param) return []
  const wanted = slugify(param)
  if (!wanted) return []
  return counties.filter((c) => slugify(c) === wanted)
}

/** Taie descrierea la <= max caractere, la limita de cuvant, dupa colapsarea spatiilor. */
export function metaDescription(text: string | null | undefined, fallback: string, max = 155): string {
  const clean = (text ?? '').replace(/\s+/g, ' ').trim() || fallback
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max + 1)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : clean.slice(0, max)).replace(/[\s,;:.\-–]+$/, '')
}

export const SEARCH_MIN = 2
export const SEARCH_MAX = 80

/** Textul cautat din `?q=`: prima valoare, spatii colapsate, minim 2 si maxim 80 de caractere; altfel null. */
export function normalizeSearchQuery(raw: string | string[] | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw
  if (typeof value !== 'string') return null
  const clean = value.replace(/\s+/g, ' ').trim()
  if (clean.length < SEARCH_MIN) return null
  return clean.slice(0, SEARCH_MAX).trim()
}

export type CityCount = { citySlug: string; city: string; count: number }

/** Un rand pe citySlug: numarari insumate, numele afisat = varianta cea mai frecventa. */
export function mergeCities(rows: CityCount[]): CityCount[] {
  const bySlug = new Map<string, { total: number; names: Map<string, number> }>()
  for (const r of rows) {
    const e = bySlug.get(r.citySlug) ?? { total: 0, names: new Map<string, number>() }
    e.total += r.count
    e.names.set(r.city, (e.names.get(r.city) ?? 0) + r.count)
    bySlug.set(r.citySlug, e)
  }
  return [...bySlug].map(([citySlug, e]) => ({
    citySlug,
    city: [...e.names].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ro'))[0][0],
    count: e.total,
  }))
}

export type DirectorySummary = {
  total: number
  byType: Record<ListingType, { count: number; cities: CityCount[] }>
}

export function summarizeDirectory(
  rows: Array<{ type: ListingType; citySlug: string; city: string; _count: { _all: number } }>,
  citiesPerType = 6,
): DirectorySummary {
  const byType = Object.fromEntries(LISTING_TYPES.map((t) => [t, { count: 0, cities: [] as CityCount[] }])) as DirectorySummary['byType']
  const raw = Object.fromEntries(LISTING_TYPES.map((t) => [t, [] as CityCount[]])) as Record<ListingType, CityCount[]>
  let total = 0
  for (const r of rows) {
    const n = r._count._all
    total += n
    byType[r.type].count += n
    raw[r.type].push({ citySlug: r.citySlug, city: r.city, count: n })
  }
  for (const t of LISTING_TYPES) {
    byType[t].cities = mergeCities(raw[t])
    byType[t].cities.sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, 'ro'))
    byType[t].cities = byType[t].cities.slice(0, citiesPerType)
  }
  return { total, byType }
}

type CardSource = {
  type: ListingType
  citySlug: string
  slug: string
  name: string
  city: string
  county: string
  phone: string | null
  services: Array<{ service: { name: string } }>
}

export function listingCard(l: CardSource): ListingCardProps {
  return {
    href: listingPath(l),
    name: l.name,
    kicker: TYPE_LABEL[l.type].singular,
    location: `${l.city}, ${l.county}`,
    phone: l.phone ? formatPhone(l.phone) : null,
    services: l.services.map((s) => s.service.name),
  }
}

/** Caile din sitemap: /director apare doar cand exista fise publicate, la fel tipurile si orasele. */
export function buildDirectoryPaths(
  listings: Array<{ type: ListingType; citySlug: string; slug: string; updatedAt: Date }>,
): Array<{ path: string; lastModified: Date; priority: number }> {
  if (listings.length === 0) return []
  const newest = (items: Array<{ updatedAt: Date }>) =>
    items.reduce((max, i) => (i.updatedAt > max ? i.updatedAt : max), items[0].updatedAt)

  const out = [{ path: '/director', lastModified: newest(listings), priority: 0.7 }]
  for (const type of LISTING_TYPES) {
    const ofType = listings.filter((l) => l.type === type)
    if (ofType.length === 0) continue
    out.push({ path: typeListPath(type), lastModified: newest(ofType), priority: 0.7 })
    const citySlugs = [...new Set(ofType.map((l) => l.citySlug))]
    for (const citySlug of citySlugs) {
      const inCity = ofType.filter((l) => l.citySlug === citySlug)
      out.push({ path: cityListPath(type, citySlug), lastModified: newest(inCity), priority: 0.6 })
      for (const l of inCity) out.push({ path: listingPath(l), lastModified: l.updatedAt, priority: 0.6 })
    }
  }
  return out
}

// ── Incarcatoare Prisma (folosite de paginile publice) ───────────────────────

/** Site-ul activ si datele lui de afisare; null daca nu exista sau nu foloseste template-ul `divet`. */
export async function loadDirectorySite() {
  const site = await prisma.site.findFirst({ where: { isActive: true } })
  if (!site || site.template !== 'divet') return null
  const seo = await prisma.seoSettings.findFirst({ where: { siteId: site.id } })
  return {
    site,
    siteData: {
      siteName: seo?.siteName ?? site.name,
      siteUrl: seo?.siteUrl ?? `http://${site.domain}`,
    },
  }
}

export async function getDirectorySummary(siteId: string): Promise<DirectorySummary> {
  const rows = await prisma.listing.groupBy({
    by: ['type', 'citySlug', 'city'],
    where: { siteId, status: 'PUBLISHED' },
    _count: { _all: true },
  })
  return summarizeDirectory(rows)
}

export type TypeFacets = {
  cities: CityCount[]
  /** Judete afisate in filtru: o singura scriere pe slug. */
  counties: string[]
  /** Toate scrierile salvate (inclusiv variantele), pentru filtrare. */
  rawCounties: string[]
  services: Array<{ slug: string; name: string; count: number }>
}

export async function getTypeFacets(siteId: string, type: ListingType): Promise<TypeFacets> {
  const where = { siteId, type, status: 'PUBLISHED' as const }
  const [cityRows, countyRows, services] = await Promise.all([
    prisma.listing.groupBy({ by: ['citySlug', 'city'], where, _count: { _all: true } }),
    prisma.listing.groupBy({ by: ['county'], where, _count: { _all: true } }),
    prisma.listingService.findMany({
      where: { siteId, type },
      orderBy: { name: 'asc' },
      select: {
        slug: true,
        name: true,
        _count: { select: { listings: { where: { listing: { status: 'PUBLISHED' } } } } },
      },
    }),
  ])
  return {
    cities: mergeCities(cityRows.map((r) => ({ citySlug: r.citySlug, city: r.city, count: r._count._all })))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, 'ro')),
    counties: mergeCities(countyRows.map((r) => ({ citySlug: slugify(r.county), city: r.county, count: r._count._all })))
      .map((r) => r.city)
      .sort((a, b) => a.localeCompare(b, 'ro')),
    rawCounties: countyRows.map((r) => r.county),
    services: services
      .map((s) => ({ slug: s.slug, name: s.name, count: s._count.listings }))
      .filter((s) => s.count > 0),
  }
}

export async function listPublished(args: {
  siteId: string
  type: ListingType
  citySlug?: string
  county?: string
  counties?: string[]
  serviceSlug?: string
  page: number
}) {
  const where = buildListingWhere(args)
  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      skip: (args.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { services: { include: { service: { select: { name: true } } } } },
    }),
    prisma.listing.count({ where }),
  ])
  return { rows, cards: rows.map(listingCard), total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

/** Cautare fara diacritice in fisele publicate: nume, oras, judet, adresa sau numele unui serviciu legat. */
export async function searchListings(args: { siteId: string; q: string; page: number }) {
  const pattern = toContainsPattern(args.q)
  const matches = await prisma.$queryRaw<{ id: string }[]>`
    SELECT l."id" FROM "Listing" l
    WHERE l."siteId" = ${args.siteId} AND l."status" = 'PUBLISHED'
      AND (translate(l."name", ${SQL_TRANSLATE_FROM}, ${SQL_TRANSLATE_TO}) ILIKE ${pattern}
        OR translate(l."city", ${SQL_TRANSLATE_FROM}, ${SQL_TRANSLATE_TO}) ILIKE ${pattern}
        OR translate(l."county", ${SQL_TRANSLATE_FROM}, ${SQL_TRANSLATE_TO}) ILIKE ${pattern}
        OR translate(COALESCE(l."address", ''), ${SQL_TRANSLATE_FROM}, ${SQL_TRANSLATE_TO}) ILIKE ${pattern}
        OR EXISTS (
          SELECT 1 FROM "ListingServiceLink" k
          JOIN "ListingService" s ON s."id" = k."serviceId"
          WHERE k."listingId" = l."id"
            AND translate(s."name", ${SQL_TRANSLATE_FROM}, ${SQL_TRANSLATE_TO}) ILIKE ${pattern}))
    ORDER BY l."featured" DESC, l."name" ASC, l."id" ASC`
  const total = matches.length
  const ids = matches.slice((args.page - 1) * PAGE_SIZE, args.page * PAGE_SIZE).map((m) => m.id)
  const found =
    ids.length === 0
      ? []
      : await prisma.listing.findMany({
          where: { id: { in: ids }, siteId: args.siteId, status: 'PUBLISHED' },
          include: { services: { include: { service: { select: { name: true } } } } },
        })
  const order = new Map(ids.map((id, i) => [id, i]))
  const rows = found.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
  return { rows, cards: rows.map(listingCard), total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export function countPublished(args: Parameters<typeof buildListingWhere>[0]) {
  return prisma.listing.count({ where: buildListingWhere(args) })
}

export function getPublishedListing(args: { siteId: string; type: ListingType; citySlug: string; slug: string }) {
  return prisma.listing.findFirst({
    where: { ...args, status: 'PUBLISHED' },
    include: { services: { include: { service: { select: { name: true } } } } },
  })
}

/** Ultimele articole din grupul legat de tip (sanatate / caini), ca carduri; gol cand nu exista grupul. */
export async function getRelatedArticles(
  siteId: string,
  type: ListingType,
  siteUrl: string,
): Promise<{ group: { name: string; href: string }; cards: ArticleCardProps[] } | null> {
  const groupSlug = TYPE_ARTICLE_GROUP[type]
  const group = await prisma.category.findFirst({
    where: { siteId, slug: groupSlug, parentId: null },
    select: { id: true, name: true, slug: true },
  })
  if (!group) return null
  const posts = await prisma.post.findMany({
    where: { siteId, status: 'PUBLISHED', category: { OR: [{ id: group.id }, { parentId: group.id }] } },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    select: {
      title: true,
      slug: true,
      category: { select: { name: true, slug: true, parent: { select: { slug: true } } } },
    },
  })
  return {
    group: { name: group.name, href: `/${group.slug}` },
    cards: posts.map((p) => toCardProps({ ...p, featuredImage: null }, siteUrl)),
  }
}

export { TYPE_SEGMENT }
