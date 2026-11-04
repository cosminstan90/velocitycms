import Link from 'next/link'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import DivetLayout from '@/components/frontend/templates/divet/DivetLayout'
import Breadcrumbs from '@/components/frontend/templates/divet/Breadcrumbs'
import { buildCollectionSchema } from '@/lib/seo/collection-schema'
import { getListsOverview } from '@/lib/lists-data'
import { getToolsSite } from '@/lib/tools/site'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteUrl } = await getToolsSite()
  return {
    title: `Liste de rase: mici, mari, pentru apartament | ${siteName}`,
    description: 'Liste de rase de câini și de pisici filtrate după criterii din fișele DiVet: talie, nivel de energie, ușurință la dresaj.',
    alternates: { canonical: `${siteUrl.replace(/\/$/, '')}/liste` },
  }
}

export default async function Page() {
  const { siteId, siteName, siteUrl } = await getToolsSite()
  const available = (await getListsOverview(siteId)).filter((o) => o.availability.available)
  if (available.length === 0) notFound()

  const schema = buildCollectionSchema({
    siteUrl,
    siteName,
    path: '/liste',
    name: 'Liste de rase',
    description: 'Liste de rase filtrate după criterii din fișele DiVet.',
    items: available.map((o) => ({ name: o.def.title, path: `/liste/${o.def.slug}` })),
  })
  return (
    <DivetLayout site={{ siteName, siteUrl }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\u003c') }} />
      <div className="mx-auto w-full max-w-[860px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: 'Liste', href: '/liste' }]} />
        <h1 className="mt-6 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-dv-ink sm:text-[44px]">Liste de rase</h1>
        <p className="mt-3 mb-0 max-w-[65ch] text-dv-body text-dv-ink-muted">
          Listele se generează din câmpurile fișelor DiVet (talie, nivel de energie, ușurință la dresaj) și apar doar când au suficiente rase ca să fie utile.
        </p>
        <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2">
          {available.map((o) => (
            <li key={o.def.slug} className="rounded-[10px] border border-dv-border bg-dv-surface p-5">
              <h2 className="m-0 font-dv-display text-dv-heading-m font-semibold text-dv-ink">
                <Link href={`/liste/${o.def.slug}`} className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">{o.def.title}</Link>
              </h2>
              <p className="mt-2 mb-0 text-dv-meta text-dv-ink-subtle">{o.availability.count} rase</p>
              <p className="mt-1 mb-0 text-dv-body text-dv-ink-muted">{o.def.criteria}</p>
            </li>
          ))}
        </ul>
      </div>
    </DivetLayout>
  )
}
