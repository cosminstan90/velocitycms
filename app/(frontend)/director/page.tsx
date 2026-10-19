import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDirectorySummary, loadDirectorySite, normalizeSearchQuery, searchListings } from '@/lib/director'
import { parsePageParam } from '@/lib/pagination'
import DirectoryIndexTemplate from '@/components/frontend/templates/divet/DirectoryIndexTemplate'

export const dynamic = 'force-dynamic'

type Props = {
  searchParams: Promise<{ q?: string | string[]; page?: string | string[] }>
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const ctx = await loadDirectorySite()
  if (!ctx) return {}
  const q = normalizeSearchQuery((await searchParams).q)
  const summary = await getDirectorySummary(ctx.site.id)
  const base = ctx.siteData.siteUrl.replace(/\/$/, '')
  return {
    title: `Director: veterinari, dresori și toaletaj | ${ctx.siteData.siteName}`,
    description:
      'Cabinete veterinare, dresori și saloane de toaletaj din România, cu date de contact, program și servicii.',
    alternates: { canonical: `${base}/director` },
    robots: q || summary.total === 0 ? { index: false, follow: true } : undefined,
  }
}

export default async function DirectoryPage({ searchParams }: Props) {
  const ctx = await loadDirectorySite()
  if (!ctx) notFound()
  const sp = await searchParams
  const summary = await getDirectorySummary(ctx.site.id)
  const q = summary.total > 0 ? normalizeSearchQuery(sp.q) : null

  if (!q) return <DirectoryIndexTemplate site={ctx.siteData} summary={summary} />

  const page = parsePageParam(sp.page)
  const { cards, total, totalPages } = await searchListings({ siteId: ctx.site.id, q, page })
  if (total > 0 && page > totalPages) notFound()

  return (
    <DirectoryIndexTemplate
      site={ctx.siteData}
      summary={summary}
      search={{
        q,
        cards,
        total,
        page,
        totalPages,
        basePath: `/director?${new URLSearchParams({ q }).toString()}`,
      }}
    />
  )
}
