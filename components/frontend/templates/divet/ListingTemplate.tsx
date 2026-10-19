import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import RelatedArticles from './RelatedArticles'
import type { ArticleCardProps } from './ArticleCard'
import {
  DAYS,
  DAY_LABEL,
  TYPE_LABEL,
  cityListPath,
  formatPhone,
  listingPath,
  parseOpeningHours,
  typeListPath,
  type ListingType,
} from '@/lib/listings'

type ListingView = {
  type: ListingType
  name: string
  slug: string
  citySlug: string
  city: string
  county: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  openingHours: unknown
  services: string[]
}

const link = 'text-dv-accent hover:text-dv-accent-hover focus-visible:outline-2 focus-visible:outline-dv-accent'

export default function ListingTemplate({
  site,
  listing,
  related,
}: {
  site: { siteName: string; siteUrl: string }
  listing: ListingView
  related: { group: { name: string; href: string }; cards: ArticleCardProps[] } | null
}) {
  const hours = parseOpeningHours(listing.openingHours)
  const crumbs = [
    { name: 'Acasă', href: '/' },
    { name: 'Director', href: '/director' },
    { name: TYPE_LABEL[listing.type].plural, href: typeListPath(listing.type) },
    { name: listing.city, href: cityListPath(listing.type, listing.citySlug) },
    { name: listing.name, href: listingPath(listing) },
  ]

  return (
    <DivetLayout site={site}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={crumbs} />
        <div className="mt-4 text-dv-label font-semibold uppercase text-dv-accent">{TYPE_LABEL[listing.type].singular}</div>
        <h1 className="mt-1 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[44px]">
          {listing.name}
        </h1>
        <p className="mt-2 mb-0 text-dv-body text-dv-ink-muted">
          {listing.city}, {listing.county}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            {listing.description ? (
              <p className="m-0 max-w-[70ch] whitespace-pre-line text-dv-body text-dv-ink">{listing.description}</p>
            ) : null}

            {listing.services.length > 0 ? (
              <section aria-labelledby="servicii" className="mt-8">
                <h2 id="servicii" className="m-0 font-dv-display text-[22px] font-semibold text-dv-ink">
                  Servicii
                </h2>
                <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
                  {listing.services.map((s) => (
                    <li key={s} className="rounded-full bg-dv-sunken px-3 py-1 text-[13px] text-dv-ink">
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="h-fit rounded-[10px] border border-dv-border bg-dv-surface p-5">
            <h2 className="m-0 font-dv-display text-[20px] font-semibold text-dv-ink">Contact</h2>
            <dl className="m-0 mt-3 space-y-3 text-[14px]">
              {listing.address ? (
                <div>
                  <dt className="text-dv-ink-subtle">Adresă</dt>
                  <dd className="m-0 text-dv-ink">{listing.address}, {listing.city}</dd>
                </div>
              ) : null}
              {listing.phone ? (
                <div>
                  <dt className="text-dv-ink-subtle">Telefon</dt>
                  <dd className="m-0">
                    <a href={`tel:${listing.phone}`} className={link}>
                      {formatPhone(listing.phone)}
                    </a>
                  </dd>
                </div>
              ) : null}
              {listing.email ? (
                <div>
                  <dt className="text-dv-ink-subtle">E-mail</dt>
                  <dd className="m-0 break-all">
                    <a href={`mailto:${listing.email}`} className={link}>
                      {listing.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {listing.website ? (
                <div>
                  <dt className="text-dv-ink-subtle">Site</dt>
                  <dd className="m-0 break-all">
                    <a href={listing.website} target="_blank" rel="nofollow noopener noreferrer" className={link}>
                      {listing.website.replace(/^https?:\/\//, '')}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>

            {hours.ok ? (
              <>
                <h3 className="m-0 mt-5 font-dv-display text-[16px] font-semibold text-dv-ink">Program</h3>
                <table className="mt-2 w-full text-[14px]">
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day} className="border-t border-dv-border">
                        <th scope="row" className="py-1.5 pr-3 text-left font-normal text-dv-ink-muted">
                          {DAY_LABEL[day]}
                        </th>
                        <td className="py-1.5 text-right text-dv-ink">
                          {hours.value[day].length === 0
                            ? 'Închis'
                            : hours.value[day].map((i) => `${i.from}–${i.to}`).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}
          </aside>
        </div>

        {related ? (
          <div className="mt-10">
            <RelatedArticles categoryName={related.group.name} categoryHref={related.group.href} posts={related.cards} />
          </div>
        ) : null}
      </div>
    </DivetLayout>
  )
}
