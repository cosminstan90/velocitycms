import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDirectorySummary, loadDirectorySite } from '@/lib/director'
import DirectoryIndexTemplate from '@/components/frontend/templates/divet/DirectoryIndexTemplate'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await loadDirectorySite()
  if (!ctx) return {}
  const summary = await getDirectorySummary(ctx.site.id)
  const base = ctx.siteData.siteUrl.replace(/\/$/, '')
  return {
    title: `Director: veterinari, dresori și toaletaj | ${ctx.siteData.siteName}`,
    description:
      'Cabinete veterinare, dresori și saloane de toaletaj din România, cu date de contact, program și servicii.',
    alternates: { canonical: `${base}/director` },
    robots: summary.total === 0 ? { index: false, follow: true } : undefined,
  }
}

export default async function DirectoryPage() {
  const ctx = await loadDirectorySite()
  if (!ctx) notFound()
  const summary = await getDirectorySummary(ctx.site.id)
  return <DirectoryIndexTemplate site={ctx.siteData} summary={summary} />
}
