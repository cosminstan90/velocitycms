import Link from 'next/link'
import DivetLayout from './DivetLayout'
import { StoryCard, type NavCategoryItem, type StoryPost } from './utils'

interface DivetSearchTemplateProps {
  query: string
  results: StoryPost[]
  totalCount: number
  site: { siteName: string; siteUrl: string }
  categories?: NavCategoryItem[]
  seoSettings?: { defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

export default function DivetSearchTemplate({
  query,
  results,
  totalCount,
  site,
  categories = [],
  seoSettings,
}: DivetSearchTemplateProps) {
  const leadResult = results[0] ?? null
  const secondaryResults = results.slice(1)

  return (
    <DivetLayout site={site} categories={categories} seoSettings={seoSettings}>
      <section className="border-b border-[color:var(--dv-border)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-7">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--dv-muted)]">
              <li><Link href="/" className="transition-colors hover:text-[color:var(--dv-contrast)]">{site.siteName}</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-[color:var(--dv-muted-strong)]" aria-current="page">Cautare</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="divet-kicker text-[11px] font-semibold">Gaseste rapid ce te intereseaza</p>
              <h1 className="divet-display mt-4 text-5xl leading-[0.94] text-[color:var(--dv-contrast)] sm:text-6xl">
                {query ? `Rezultate pentru "${query}"` : 'Cauta in DiVet'}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[color:var(--dv-muted-strong)]">
                {query
                  ? `${totalCount} rezultate gata de rasfoit. DiVet trebuie sa te duca la raspuns in cateva secunde, nu sa te piarda in zgomot.`
                  : 'Scrie un nume de rasa, o specie, un tip de caine sau un subiect precum ingrijire, nutritie ori comportament.'}
              </p>
            </div>

            <form
              action="/cautare"
              method="get"
              className="divet-card flex flex-col gap-4 rounded-[32px] p-5 sm:flex-row sm:items-center sm:p-6"
              role="search"
            >
              <div className="relative flex-1">
                <svg className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--dv-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.2-5.2m1.2-4.8a6 6 0 11-12 0 6 6 0 0112 0Z" />
                </svg>
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="caini mici, pug, dresaj, pisici..."
                  className="divet-input h-14 w-full rounded-full pl-12 pr-4 text-sm outline-none"
                />
              </div>
              <button type="submit" className="divet-button rounded-full px-6 py-3 text-sm font-semibold">
                Cauta acum
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {!query ? (
            <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
              <div className="divet-card rounded-[32px] p-8">
                <p className="divet-kicker text-[11px] font-semibold">Unde sa incepi</p>
                <h2 className="divet-display mt-4 text-4xl text-[color:var(--dv-contrast)]">Cauta dupa intentie, nu doar dupa cuvant</h2>
                <p className="mt-4 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                  In loc sa te limitezi la un nume de rasa, cauta si dupa nevoi: caini de apartament, caini de vanatoare, animale potrivite pentru copii sau ghiduri de ingrijire.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {categories.slice(0, 8).map((category) => (
                  <Link key={category.id} href={`/${category.slug}`} className="divet-card-soft rounded-[24px] p-5 transition-transform duration-300 hover:-translate-y-1">
                    <p className="divet-display text-2xl text-[color:var(--dv-contrast)]">{category.name}</p>
                    <p className="mt-2 text-sm text-[color:var(--dv-muted-strong)]">{category._count?.posts ?? 0} articole</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="divet-card rounded-[32px] p-8 text-center sm:p-12">
              <p className="divet-kicker text-[11px] font-semibold">Nimic aici inca</p>
              <h2 className="divet-display mt-4 text-4xl text-[color:var(--dv-contrast)]">Nu am gasit rezultate pentru &quot;{query}&quot;</h2>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                Incearca termeni mai generali, cauta dupa specie sau categorie si evita formularea prea lunga.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {categories.slice(0, 6).map((category) => (
                  <Link key={category.id} href={`/${category.slug}`} className="divet-chip rounded-full px-4 py-2 text-sm">
                    {category.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {leadResult && (
                <StoryCard post={leadResult} siteUrl={site.siteUrl} variant="row" priority />
              )}
              {secondaryResults.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {secondaryResults.map((result) => (
                    <StoryCard key={result.id} post={result} siteUrl={site.siteUrl} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </DivetLayout>
  )
}
