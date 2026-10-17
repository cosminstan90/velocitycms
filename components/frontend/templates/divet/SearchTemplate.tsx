import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import ArticleCard from './ArticleCard'
import EmptyState from './EmptyState'
import SearchForm from './SearchForm'
import { cardMeta } from '@/lib/fields'
import { buildPostPath } from '@/lib/seo/canonical-builder'
import { resolveImageUrl } from '../fauna/utils'

interface PostItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | string | null
  featuredImage: { url: string; altText: string | null } | null
  author: { name: string | null } | null
  category: { name: string; slug: string; parent?: { name: string; slug: string } | null } | null
  fieldValues?: Array<{ value: string; fieldDefinition: { fieldKey: string } }>
}

interface DivetSearchTemplateProps {
  query: string
  results: PostItem[]
  totalCount: number
  site: { siteName: string; siteUrl: string }
  // LEGACY: ignorate
  categories?: unknown
  seoSettings?: unknown
}

export default function DivetSearch({ query, results, totalCount, site }: DivetSearchTemplateProps) {
  const countLine =
    totalCount > results.length
      ? `Se afișează primele ${results.length} din ${totalCount}`
      : totalCount === 1
        ? '1 rezultat'
        : `${totalCount} rezultate`

  return (
    <DivetLayout site={{ siteName: site.siteName, siteUrl: site.siteUrl }}>
      <div className="mx-auto w-full max-w-[1100px] px-4 pb-12 md:px-10">
        <div className="pt-6">
          <Breadcrumbs
            items={[
              { name: 'Acasă', href: '/' },
              { name: 'Căutare', href: '/cautare' },
            ]}
          />
        </div>
        <h1 className="mt-6 mb-5 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-dv-ink sm:text-[44px]">
          {query ? `Rezultate pentru „${query}"` : 'Căutare'}
        </h1>
        <SearchForm inputId="dv-search-q" defaultValue={query} />

        {!query ? (
          <p className="mt-6 text-dv-body text-dv-ink-muted">Scrie numele unei rase sau al unei specii.</p>
        ) : results.length > 0 ? (
          <section className="mt-8" aria-label="Rezultate">
            <p className="mt-0 mb-5 text-dv-meta text-dv-ink-muted">{countLine}</p>
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {results.map((p) => (
                <ArticleCard
                  key={p.id}
                  href={buildPostPath({ slug: p.slug }, p.category)}
                  title={p.title}
                  kicker={p.category?.name ?? null}
                  meta={cardMeta(p.fieldValues ?? [])}
                  image={
                    p.featuredImage
                      ? { url: resolveImageUrl(p.featuredImage.url, site.siteUrl), alt: p.featuredImage.altText ?? p.title }
                      : null
                  }
                />
              ))}
            </div>
          </section>
        ) : (
          <div className="mt-8">
            <EmptyState
              title={`Nu am găsit nimic pentru „${query}"`}
              description={'Căutarea ține cont de diacritice: încearcă „câini" în loc de „caini", un termen mai scurt sau răsfoiește după grup.'}
              action={{ label: 'Vezi toate articolele', href: '/index-a-z' }}
            />
          </div>
        )}
      </div>
    </DivetLayout>
  )
}
