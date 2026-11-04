import type { Metadata } from 'next'
import DivetLayout from '@/components/frontend/templates/divet/DivetLayout'
import Breadcrumbs from '@/components/frontend/templates/divet/Breadcrumbs'
import { GLOSSARY, initialOf, sortedGlossary } from '@/lib/glossary'
import { getToolsSite } from '@/lib/tools/site'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteUrl } = await getToolsSite()
  return {
    title: `Glosar de termeni veterinari și zoologici | ${siteName}`,
    description: 'Definiții scurte pentru termeni din articolele DiVet: zoonoză, vaccin core, ectoparaziți, endemic, hibernare și altele, cu sursa acolo unde există.',
    alternates: { canonical: `${siteUrl.replace(/\/$/, '')}/glosar` },
  }
}

export default async function Page() {
  const { siteName, siteUrl } = await getToolsSite()
  const base = siteUrl.replace(/\/$/, '')
  const terms = sortedGlossary()
  const groups = new Map<string, typeof terms>()
  for (const t of terms) {
    const k = initialOf(t.term)
    groups.set(k, [...(groups.get(k) ?? []), t])
  }
  const letters = [...groups.keys()].sort()

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: siteName, item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Glosar', item: `${base}/glosar` },
        ],
      },
      {
        '@type': 'DefinedTermSet',
        '@id': `${base}/glosar#set`,
        name: 'Glosar DiVet',
        url: `${base}/glosar`,
        inLanguage: 'ro-RO',
        hasDefinedTerm: GLOSSARY.map((t) => ({
          '@type': 'DefinedTerm',
          name: t.term,
          description: t.definition,
          url: `${base}/glosar#${t.slug}`,
          inDefinedTermSet: `${base}/glosar#set`,
        })),
      },
    ],
  }

  return (
    <DivetLayout site={{ siteName, siteUrl }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\u003c') }} />
      <div className="mx-auto w-full max-w-[860px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: 'Glosar', href: '/glosar' }]} />
        <h1 className="mt-6 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-dv-ink sm:text-[44px]">Glosar</h1>
        <p className="mt-3 mb-0 max-w-[65ch] text-dv-body text-dv-ink-muted">
          Definiții scurte pentru termenii folosiți în articolele DiVet, în ordine alfabetică. Sunt făcute pentru orientare și nu înlocuiesc sfatul medicului veterinar; acolo unde definiția are o sursă, o găsești linkată.
        </p>

        <nav aria-label="Litere" className="mt-6">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
            {letters.map((l) => (
              <li key={l}>
                <a href={`#litera-${l.toLowerCase()}`} className="inline-flex size-9 items-center justify-center rounded-md border border-dv-border bg-dv-surface font-semibold hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {letters.map((l) => (
          <section key={l} id={`litera-${l.toLowerCase()}`} aria-labelledby={`litera-${l.toLowerCase()}-titlu`} className="mt-8 scroll-mt-6">
            <h2 id={`litera-${l.toLowerCase()}-titlu`} className="mb-3 font-dv-display text-dv-heading-m font-semibold text-dv-accent">{l}</h2>
            <dl className="m-0 flex flex-col gap-5">
              {groups.get(l)!.map((t) => (
                <div key={t.slug} id={t.slug} className="scroll-mt-6 border-b border-dv-border pb-5">
                  <dt className="font-dv-display text-[20px] font-semibold text-dv-ink">{t.term}</dt>
                  <dd className="m-0 mt-1 text-dv-body text-dv-ink-muted">
                    {t.definition}
                    {t.source ? (
                      <>
                        {' '}
                        <a href={t.source.href} rel="noopener" target="_blank" className="text-dv-meta text-dv-accent underline">
                          Sursă: {t.source.label}
                        </a>
                      </>
                    ) : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </DivetLayout>
  )
}
