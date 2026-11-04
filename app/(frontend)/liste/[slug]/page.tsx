import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ListPage from '@/components/frontend/templates/divet/ListPage'
import { getList } from '@/lib/lists'
import { getListsOverview } from '@/lib/lists-data'
import { getToolsSite } from '@/lib/tools/site'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

async function load(slug: string) {
  const def = getList(slug)
  if (!def) return null
  const { siteId, siteName, siteUrl } = await getToolsSite()
  const overview = await getListsOverview(siteId)
  const current = overview.find((o) => o.def.slug === slug)
  // O lista care nu trece pragurile (prea putine intrari / nu filtreaza) nu exista public.
  if (!current || !current.availability.available) return null
  return { def, siteName, siteUrl, current, overview }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const data = await load(slug)
  if (!data) return { title: 'Listă negăsită' }
  const canonical = `${data.siteUrl.replace(/\/$/, '')}/liste/${slug}`
  return {
    title: `${data.def.metaTitle} | ${data.siteName}`,
    description: data.def.metaDesc,
    alternates: { canonical },
    openGraph: { title: data.def.metaTitle, description: data.def.metaDesc, url: canonical },
  }
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  const data = await load(slug)
  if (!data) notFound()
  const others = data.overview
    .filter((o) => o.availability.available && o.def.slug !== slug)
    .map((o) => ({ slug: o.def.slug, title: o.def.title, count: o.availability.count }))
  return <ListPage site={{ siteName: data.siteName, siteUrl: data.siteUrl }} def={data.def} members={data.current.members} others={others} />
}
