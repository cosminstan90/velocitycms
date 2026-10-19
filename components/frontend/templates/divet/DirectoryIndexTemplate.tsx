import Link from 'next/link'
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import ListingCard, { type ListingCardProps } from './ListingCard'
import { LISTING_TYPES, TYPE_LABEL, cityListPath, typeListPath } from '@/lib/listings'
import type { DirectorySummary } from '@/lib/director'

const chip =
  'rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[13px] text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent'

export default function DirectoryIndexTemplate({
  site,
  summary,
  search,
}: {
  site: { siteName: string; siteUrl: string }
  summary: DirectorySummary
  /** Prezent doar cand exista un text cautat (`?q=`). */
  search?: {
    q: string
    cards: ListingCardProps[]
    total: number
    page: number
    totalPages: number
    basePath: string
  }
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

        {summary.total > 0 ? (
          <form action="/director" method="get" role="search" className="mt-6 flex w-full max-w-[640px] flex-wrap gap-2">
            <label htmlFor="director-q" className="sr-only">
              Caută în director
            </label>
            <input
              id="director-q"
              name="q"
              type="search"
              minLength={2}
              maxLength={80}
              required
              defaultValue={search?.q ?? ''}
              placeholder="Caută după nume, oraș, județ sau serviciu"
              className="h-11 min-w-0 flex-1 basis-56 rounded-[7px] border border-dv-border bg-dv-surface px-4 text-[15px] text-dv-ink placeholder:text-dv-ink-subtle focus-visible:outline-2 focus-visible:outline-dv-accent"
            />
            <button
              type="submit"
              className="h-11 min-w-11 rounded-[7px] bg-dv-accent px-6 font-semibold text-dv-accent-on focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dv-accent"
            >
              Caută
            </button>
          </form>
        ) : null}

        {search ? (
          <div className="mt-6">
            <p className="m-0 text-dv-meta text-dv-ink-subtle">
              {search.total === 1 ? '1 rezultat' : `${search.total} rezultate`} pentru „{search.q}”
            </p>
            <div className="mt-4">
              {search.cards.length === 0 ? (
                <EmptyState
                  title="Niciun rezultat"
                  description="Încearcă alt nume, alt oraș sau un serviciu, ori răsfoiește directorul pe tipuri."
                  action={{ label: 'Înapoi la director', href: '/director' }}
                />
              ) : (
                <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                  {search.cards.map((c) => (
                    <ListingCard key={c.href} {...c} />
                  ))}
                </div>
              )}
            </div>
            <Pagination currentPage={search.page} totalPages={search.totalPages} basePath={search.basePath} />
          </div>
        ) : null}

        {search ? null : summary.total === 0 ? (
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
