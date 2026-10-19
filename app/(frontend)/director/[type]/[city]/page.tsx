import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { listPublished, loadDirectorySite } from '@/lib/director'
import { TYPE_LABEL, cityListPath, typeFromSegment } from '@/lib/listings'
import { parsePageParam } from '@/lib/pagination'
import DirectoryListTemplate from '@/components/frontend/templates/divet/DirectoryListTemplate'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ type: string; city: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type: segment, city: citySlug } = await params
  const type = typeFromSegment(segment)
  const ctx = await loadDirectorySite()
  if (!type || !ctx) return {}
  const { rows } = await listPublished({ siteId: ctx.site.id, type, citySlug, page: 1 })
  if (rows.length === 0) return {}
  const label = TYPE_LABEL[type].plural
  const base = ctx.siteData.siteUrl.replace(/\/$/, '')
  return {
    title: `${label} în ${rows[0].city} | ${ctx.siteData.siteName}`,
    description: `${label} în ${rows[0].city}: date de contact, program și servicii.`,
    alternates: { canonical: `${base}${cityListPath(type, citySlug)}` },
  }
}

export default async function DirectoryCityPage({ params, searchParams }: Props) {
  const { type: segment, city: citySlug } = await params
  const type = typeFromSegment(segment)
  if (!type) notFound()
  const ctx = await loadDirectorySite()
  if (!ctx) notFound()

  const page = parsePageParam((await searchParams).page)
  const { rows, cards, total, totalPages } = await listPublished({ siteId: ctx.site.id, type, citySlug, page })
  // Un oras fara fise publicate nu exista pentru vizitator.
  if (total === 0 || page > totalPages) notFound()
  const cityName = rows[0]?.city ?? citySlug

  return (
    <DirectoryListTemplate
      site={ctx.siteData}
      type={type}
      city={{ name: cityName, slug: citySlug }}
      cards={cards}
      total={total}
      page={page}
      totalPages={totalPages}
      basePath={cityListPath(type, citySlug)}
    />
  )
}
