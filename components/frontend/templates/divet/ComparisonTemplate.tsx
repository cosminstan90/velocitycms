import Image from 'next/image'
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import { BrandMark, StoryCard, formatDateLong, getPostUrl, resolveImageUrl, type NavCategoryItem, type StoryPost } from './utils'

interface ComparisonItem {
  title: string
  slug: string
  excerpt: string | null
  featuredImage: { url: string; altText: string | null } | null
  category: { name: string; slug: string } | null
}

interface ComparisonRow {
  label: string
  valueA: string
  valueB: string
  winner?: 'a' | 'b' | 'tie' | null
}

interface ComparisonTemplateProps {
  itemA: ComparisonItem
  itemB: ComparisonItem
  contentHtml: string
  comparisonRows: ComparisonRow[]
  verdict: string | null
  relatedComparisons: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    featuredImage: { url: string; altText: string | null } | null
  }>
  site: { siteName: string; siteUrl: string }
  categories?: NavCategoryItem[]
  seoSettings?: { defaultMetaDesc?: string | null } | null
  pageTitle: string
  publishedAt?: Date | string | null
  author?: { name: string | null; slug?: string | null } | null
}

function ScorePill({ winner, side }: { winner: ComparisonRow['winner']; side: 'a' | 'b' }) {
  if (winner === 'tie') {
    return (
      <span
        className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--dv-contrast)]"
        style={{ background: 'var(--dv-accent-soft)' }}
      >
        Echilibru
      </span>
    )
  }

  if (winner === side) {
    return (
      <span
        className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white"
        style={{ background: 'var(--dv-forest)' }}
      >
        Avantaj
      </span>
    )
  }

  return null
}

function ComparisonSubject({
  item,
  siteUrl,
  align = 'left',
}: {
  item: ComparisonItem
  siteUrl: string
  align?: 'left' | 'right'
}) {
  const hasLink = Boolean(item.slug)
  const Wrapper = hasLink ? Link : 'div'
  const wrapperProps = hasLink ? { href: getPostUrl(item), className: 'group block' } : { className: 'group block' }

  return (
    <Wrapper {...wrapperProps}>
      <div className="divet-card overflow-hidden rounded-[30px]">
        <div className="relative min-h-[260px] overflow-hidden">
          {item.featuredImage ? (
            <Image
              src={resolveImageUrl(item.featuredImage.url, siteUrl)}
              fill
              alt={item.featuredImage.altText ?? item.title}
              sizes="(max-width: 768px) 100vw, 42vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority
            />
          ) : (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                background:
                  'radial-gradient(circle at top left, var(--dv-accent-soft), transparent 34%), radial-gradient(circle at bottom right, var(--dv-forest-soft), transparent 38%), linear-gradient(135deg, var(--dv-bg-strong), var(--dv-surface-strong))',
              }}
            >
              <BrandMark className="h-20 w-20 opacity-90" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
          <div className={`absolute bottom-0 left-0 right-0 p-6 ${align === 'right' ? 'text-right' : ''}`}>
            {item.category && (
              <p className="divet-kicker text-[11px] font-semibold text-white/70">{item.category.name}</p>
            )}
            <h2 className="divet-display mt-3 text-4xl leading-tight text-white sm:text-[2.7rem]">{item.title}</h2>
            {item.excerpt && (
              <p className={`mt-3 max-w-lg text-sm leading-7 text-white/80 ${align === 'right' ? 'ml-auto' : ''}`}>
                {item.excerpt}
              </p>
            )}
          </div>
        </div>
      </div>
    </Wrapper>
  )
}

export default function DivetComparisonTemplate({
  itemA,
  itemB,
  contentHtml,
  comparisonRows,
  verdict,
  relatedComparisons,
  site,
  categories = [],
  seoSettings,
  pageTitle,
  publishedAt,
  author,
}: ComparisonTemplateProps) {
  const relatedStories: StoryPost[] = relatedComparisons.map((comparison) => ({
    id: comparison.id,
    title: comparison.title,
    slug: comparison.slug,
    excerpt: comparison.excerpt,
    publishedAt: null,
    featuredImage: comparison.featuredImage,
    author: null,
    category: { name: 'Comparatie', slug: 'comparatie' },
  }))

  return (
    <DivetLayout site={site} categories={categories} seoSettings={seoSettings}>
      <section className="border-b border-[color:var(--dv-border)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--dv-muted)]">
              <li><Link href="/" className="transition-colors hover:text-[color:var(--dv-contrast)]">{site.siteName}</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/comparatie" className="transition-colors hover:text-[color:var(--dv-contrast)]">Comparatii</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-[color:var(--dv-muted-strong)]" aria-current="page">{pageTitle}</li>
            </ol>
          </nav>

          <div className="mx-auto max-w-4xl text-center">
            <p className="divet-kicker text-[11px] font-semibold">Comparatie editoriala</p>
            <h1 className="divet-display mt-4 text-5xl leading-[0.95] text-[color:var(--dv-contrast)] sm:text-6xl lg:text-[5.2rem]">
              {pageTitle}
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[color:var(--dv-muted-strong)] sm:text-lg">
              O pagina de comparatie ar trebui sa raspunda rapid la intrebarea “care mi se potriveste mai bine?”, fara sa piarda farmecul unui articol bun.
            </p>
            {(publishedAt || author?.name) && (
              <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-[color:var(--dv-muted-strong)]">
                {author?.name && <span>{author.name}</span>}
                {publishedAt && <time dateTime={new Date(publishedAt).toISOString()}>{formatDateLong(publishedAt)}</time>}
              </div>
            )}
          </div>

          <div className="relative mt-10 grid gap-6 lg:grid-cols-2">
            <ComparisonSubject item={itemA} siteUrl={site.siteUrl} />
            <ComparisonSubject item={itemB} siteUrl={site.siteUrl} align="right" />
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:flex">
              <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/20 text-xl font-black text-white shadow-2xl"
                style={{ background: 'linear-gradient(135deg, var(--dv-accent), var(--dv-accent-strong))' }}>
                VS
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-14">
          <div className="min-w-0 space-y-8">
            {comparisonRows.length > 0 && (
              <section className="divet-card overflow-hidden rounded-[32px]">
                <div className="border-b border-[color:var(--dv-border)] px-6 py-5 sm:px-8">
                  <p className="divet-kicker text-[11px] font-semibold">Diferente cheie</p>
                  <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">Tabelul de comparatie</h2>
                </div>

                <div className="hidden divide-y divide-[color:var(--dv-border)] lg:block">
                  {comparisonRows.map((row, index) => (
                    <div key={`${row.label}-${index}`} className="grid grid-cols-[0.92fr_1fr_1fr] gap-4 px-8 py-5">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--dv-contrast)]">{row.label}</p>
                      </div>
                      <div className="rounded-[22px] border border-[color:var(--dv-border)] px-4 py-4" style={row.winner === 'a' || row.winner === 'tie' ? { background: 'color-mix(in srgb, var(--dv-forest-soft) 50%, transparent)' } : undefined}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--dv-muted)]">{itemA.title}</p>
                          <ScorePill winner={row.winner} side="a" />
                        </div>
                        <p className="text-sm leading-7 text-[color:var(--dv-muted-strong)]">{row.valueA}</p>
                      </div>
                      <div className="rounded-[22px] border border-[color:var(--dv-border)] px-4 py-4" style={row.winner === 'b' || row.winner === 'tie' ? { background: 'color-mix(in srgb, var(--dv-accent-soft) 48%, transparent)' } : undefined}>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--dv-muted)]">{itemB.title}</p>
                          <ScorePill winner={row.winner} side="b" />
                        </div>
                        <p className="text-sm leading-7 text-[color:var(--dv-muted-strong)]">{row.valueB}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 p-5 lg:hidden">
                  {comparisonRows.map((row, index) => (
                    <div key={`${row.label}-${index}`} className="rounded-[26px] border border-[color:var(--dv-border)] p-4">
                      <p className="text-sm font-semibold text-[color:var(--dv-contrast)]">{row.label}</p>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[20px] border border-[color:var(--dv-border)] p-4" style={row.winner === 'a' || row.winner === 'tie' ? { background: 'color-mix(in srgb, var(--dv-forest-soft) 46%, transparent)' } : undefined}>
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--dv-muted)]">{itemA.title}</p>
                            <ScorePill winner={row.winner} side="a" />
                          </div>
                          <p className="text-sm leading-7 text-[color:var(--dv-muted-strong)]">{row.valueA}</p>
                        </div>
                        <div className="rounded-[20px] border border-[color:var(--dv-border)] p-4" style={row.winner === 'b' || row.winner === 'tie' ? { background: 'color-mix(in srgb, var(--dv-accent-soft) 46%, transparent)' } : undefined}>
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--dv-muted)]">{itemB.title}</p>
                            <ScorePill winner={row.winner} side="b" />
                          </div>
                          <p className="text-sm leading-7 text-[color:var(--dv-muted-strong)]">{row.valueB}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(verdict || contentHtml) && (
              <section className="space-y-8">
                {verdict && (
                  <div className="divet-card rounded-[32px] p-7 sm:p-8">
                    <p className="divet-kicker text-[11px] font-semibold">Verdict</p>
                    <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">Pe cine alegi?</h2>
                    <p className="mt-4 text-base leading-8 text-[color:var(--dv-muted-strong)]">{verdict}</p>
                  </div>
                )}

                {contentHtml && (
                  <div className="rounded-[34px] border border-[color:var(--dv-border)] bg-[color:var(--dv-surface-strong)] px-6 py-8 sm:px-8 sm:py-10">
                    <div className="divet-prose max-w-none" dangerouslySetInnerHTML={{ __html: contentHtml }} />
                  </div>
                )}
              </section>
            )}

            {relatedStories.length > 0 && (
              <section>
                <div className="mb-7">
                  <p className="divet-kicker text-[11px] font-semibold">Mai departe</p>
                  <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">Alte comparatii din acelasi univers</h2>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                  {relatedStories.map((story) => (
                    <StoryCard key={story.id} post={story} siteUrl={site.siteUrl} />
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <div className="divet-card rounded-[30px] p-6">
              <p className="divet-kicker text-[11px] font-semibold">Cand te ajuta pagina asta</p>
              <div className="mt-4 space-y-3 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                <p>Cand esti intre doua rase si vrei o decizie mai rapida.</p>
                <p>Cand ai nevoie sa vezi diferentele esentiale una langa alta.</p>
                <p>Cand vrei sa continui apoi spre articolul detaliat al fiecareia.</p>
              </div>
            </div>

            <div className="divet-card-soft rounded-[30px] p-6">
              <p className="divet-kicker text-[11px] font-semibold">Navigare rapida</p>
              <div className="mt-4 space-y-3">
                {itemA.slug ? (
                  <Link href={getPostUrl(itemA)} className="block rounded-[20px] border border-[color:var(--dv-border)] px-4 py-3 text-sm font-semibold text-[color:var(--dv-contrast)] transition-colors hover:text-[color:var(--dv-accent-strong)]">
                    Vezi profilul complet pentru {itemA.title}
                  </Link>
                ) : (
                  <div className="rounded-[20px] border border-[color:var(--dv-border)] px-4 py-3 text-sm font-semibold text-[color:var(--dv-muted-strong)]">
                    {itemA.title}
                  </div>
                )}
                {itemB.slug ? (
                  <Link href={getPostUrl(itemB)} className="block rounded-[20px] border border-[color:var(--dv-border)] px-4 py-3 text-sm font-semibold text-[color:var(--dv-contrast)] transition-colors hover:text-[color:var(--dv-accent-strong)]">
                    Vezi profilul complet pentru {itemB.title}
                  </Link>
                ) : (
                  <div className="rounded-[20px] border border-[color:var(--dv-border)] px-4 py-3 text-sm font-semibold text-[color:var(--dv-muted-strong)]">
                    {itemB.title}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>
    </DivetLayout>
  )
}
