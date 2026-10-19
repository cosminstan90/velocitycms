import Link from 'next/link'
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import EmptyState from './EmptyState'
import { LISTING_TYPES, TYPE_LABEL, cityListPath, typeListPath } from '@/lib/listings'
import type { DirectorySummary } from '@/lib/director'

const chip =
  'rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[13px] text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent'

export default function DirectoryIndexTemplate({
  site,
  summary,
}: {
  site: { siteName: string; siteUrl: string }
  summary: DirectorySummary
}) {
  return (
    <DivetLayout site={site}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: 'Director', href: '/director' }]} />
        <h1 className="mt-4 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[44px]">
          Director
        </h1>
        <p className="mt-3 max-w-[70ch] text-dv-body text-dv-ink-muted">
          Cabinete veterinare, dresori și saloane de toaletaj din România, cu date de contact, program și servicii.
        </p>

        {summary.total === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="Directorul se completează"
              description="Primele fișe apar în curând. Între timp, găsești ghiduri în enciclopedie."
              action={{ label: 'Index A–Z', href: '/index-a-z' }}
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {LISTING_TYPES.filter((t) => summary.byType[t].count > 0).map((type) => {
              const { count, cities } = summary.byType[type]
              return (
                <section key={type} className="rounded-[10px] border border-dv-border bg-dv-surface p-5">
                  <h2 className="m-0 font-dv-display text-[22px] font-semibold text-dv-ink">
                    <Link href={typeListPath(type)} className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">
                      {TYPE_LABEL[type].plural}
                    </Link>
                  </h2>
                  <p className="mt-1 mb-0 text-dv-meta text-dv-ink-subtle">{count === 1 ? '1 fișă' : `${count} fișe`}</p>
                  <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
                    {cities.map((c) => (
                      <li key={c.citySlug}>
                        <Link href={cityListPath(type, c.citySlug)} className={chip}>
                          {c.city} <span className="text-dv-ink-subtle">{c.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={typeListPath(type)}
                    className="mt-4 inline-block text-[14px] font-semibold text-dv-accent hover:text-dv-accent-hover focus-visible:outline-2 focus-visible:outline-dv-accent"
                  >
                    Vezi toate
                  </Link>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </DivetLayout>
  )
}
