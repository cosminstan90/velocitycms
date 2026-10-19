import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTypeFacets, listPublished, loadDirectorySite, resolveCounty } from '@/lib/director'
import { TYPE_LABEL, typeFromSegment, typeListPath } from '@/lib/listings'
import { parsePageParam } from '@/lib/pagination'
import { slugify } from '@/lib/slugify'
import DirectoryListTemplate from '@/components/frontend/templates/divet/DirectoryListTemplate'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ type: string }>
  searchParams: Promise<{ page?: string | string[]; judet?: string | string[]; serviciu?: string | string[] }>
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const type = typeFromSegment((await params).type)
  const ctx = await loadDirectorySite()
  if (!type || !ctx) return {}
  const label = TYPE_LABEL[type].plural
  const base = ctx.siteData.siteUrl.replace(/\/$/, '')
  const { total } = await listPublished({ siteId: ctx.site.id, type, page: 1 })
  return {
    title: `${label} din România | ${ctx.siteData.siteName}`,
    description: `${label} din România: date de contact, program și servicii.`,
    alternates: { canonical: `${base}${typeListPath(type)}` },
    robots: total === 0 ? { index: false, follow: true } : undefined,
  }
}

export default async function DirectoryTypePage({ params, searchParams }: Props) {
  const type = typeFromSegment((await params).type)
  if (!type) notFound()
  const ctx = await loadDirectorySite()
  if (!ctx) notFound()

  const sp = await searchParams
  const facets = await getTypeFacets(ctx.site.id, type)
  const county = resolveCounty(facets.counties, one(sp.judet))
  const serviceParam = one(sp.serviciu)
  const serviceSlug = facets.services.some((s) => s.slug === serviceParam) ? serviceParam : undefined
  const page = parsePageParam(sp.page)

  const { cards, total, totalPages } = await listPublished({
    siteId: ctx.site.id,
    type,
    county,
    serviceSlug,
    page,
  })

  const qs = new URLSearchParams()
  if (county) qs.set('judet', slugify(county))
  if (serviceSlug) qs.set('serviciu', serviceSlug)
  const query = qs.toString()
  const basePath = `${typeListPath(type)}${query ? `?${query}` : ''}`

  return (
    <DirectoryListTemplate
      site={ctx.siteData}
      type={type}
      cards={cards}
      total={total}
      page={page}
      totalPages={totalPages}
      basePath={basePath}
      facets={facets}
      selected={{ county, serviceSlug }}
    />
  )
}
