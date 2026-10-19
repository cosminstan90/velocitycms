import Link from 'next/link'
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import ListingCard, { type ListingCardProps } from './ListingCard'
import { TYPE_LABEL, cityListPath, typeListPath, type ListingType } from '@/lib/listings'
import { slugify } from '@/lib/slugify'
import type { CityCount, TypeFacets } from '@/lib/director'

const chip =
  'rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[13px] text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent'
const field =
  'min-h-11 rounded-md border border-dv-border bg-dv-surface px-3 text-[14px] text-dv-ink focus-visible:outline-2 focus-visible:outline-dv-accent'

export default function DirectoryListTemplate({
  site,
  type,
  city,
  cards,
  total,
  page,
  totalPages,
  basePath,
  facets,
  selected,
}: {
  site: { siteName: string; siteUrl: string }
  type: ListingType
  /** Prezent doar pe pagina unui oras. */
  city?: { name: string; slug: string }
  cards: ListingCardProps[]
  total: number
  page: number
  totalPages: number
  /** Calea curenta, cu filtrele active in query (pentru paginare). */
  basePath: string
  /** Prezent doar pe pagina tipului (filtre si orase). */
  facets?: TypeFacets
  selected?: { county?: string; serviceSlug?: string }
}) {
  const label = TYPE_LABEL[type].plural
  const crumbs = [
    { name: 'Acasă', href: '/' },
    { name: 'Director', href: '/director' },
    { name: label, href: typeListPath(type) },
    ...(city ? [{ name: city.name, href: cityListPath(type, city.slug) }] : []),
  ]
  const filtered = !!selected?.county || !!selected?.serviceSlug
  const cities: CityCount[] = facets?.cities ?? []

  return (
    <DivetLayout site={site}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-4 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[44px]">
          {city ? `${label} în ${city.name}` : label}
        </h1>
        <p className="mt-2 mb-0 text-dv-meta text-dv-ink-subtle">{total === 1 ? '1 fișă' : `${total} fișe`}</p>

        {facets ? (
          <form method="get" action={typeListPath(type)} className="mt-5 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-[13px] text-dv-ink-muted">
              Județ
              <select name="judet" defaultValue={selected?.county ? slugify(selected.county) : ''} className={field}>
                <option value="">Toate</option>
                {facets.counties.map((c) => (
                  <option key={c} value={slugify(c)}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            {facets.services.length > 0 ? (
              <label className="flex flex-col gap-1 text-[13px] text-dv-ink-muted">
                Serviciu
                <select name="serviciu" defaultValue={selected?.serviceSlug ?? ''} className={field}>
                  <option value="">Toate</option>
                  {facets.services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name} ({s.count})
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button
              type="submit"
              className="min-h-11 rounded-md bg-dv-accent px-5 text-[14px] font-semibold text-dv-accent-on focus-visible:outline-2 focus-visible:outline-dv-accent"
            >
              Filtrează
            </button>
            {filtered ? (
              <Link href={typeListPath(type)} className="min-h-11 content-center text-[14px] text-dv-accent">
                Șterge filtrele
              </Link>
            ) : null}
          </form>
        ) : null}

        {cities.length > 0 ? (
          <nav aria-label="Orașe" className="mt-5 flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link key={c.citySlug} href={cityListPath(type, c.citySlug)} className={chip}>
                {c.city} <span className="text-dv-ink-subtle">{c.count}</span>
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="mt-6">
          {cards.length === 0 ? (
            <EmptyState
              title={filtered || page > 1 ? 'Nicio fișă pentru această selecție' : `Încă nu avem ${label.toLowerCase()}`}
              description={filtered ? 'Încearcă alte filtre.' : 'Revino curând: directorul se completează.'}
              action={{ label: 'Înapoi la director', href: '/director' }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <ListingCard key={c.href} {...c} />
              ))}
            </div>
          )}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} basePath={basePath} />
      </div>
    </DivetLayout>
  )
}
