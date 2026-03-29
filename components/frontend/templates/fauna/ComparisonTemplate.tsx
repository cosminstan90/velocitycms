/**
 * Fauna — ComparisonTemplate
 *
 * Side-by-side comparison of two animals/breeds.
 * Used for pages like: /comparatie/labrador-vs-golden-retriever
 *
 * Features:
 *  - Dual hero header with both animals' photos
 *  - Visual comparison table with characteristics
 *  - Color-coded advantage indicators
 *  - Verdict/summary section
 *  - Related comparisons grid
 *  - Ad slots integrated naturally
 *  - Mobile-optimised stacked layout
 *  - SEO: H1, breadcrumbs, schema-ready
 */

import Image from 'next/image'
import Link from 'next/link'
import FaunaLayout from './FaunaLayout'
import { resolveImageUrl, getPostUrl, formatDateLong } from './utils'

// ─── Props ────────────────────────────────────────────────────────────────────

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
  /** 'a' = left wins, 'b' = right wins, 'tie' = equal, null = no judgement */
  winner?: 'a' | 'b' | 'tie' | null
}

interface ComparisonTemplateProps {
  itemA: ComparisonItem
  itemB: ComparisonItem
  /** Main HTML content (editor-written comparison prose) */
  contentHtml: string
  /** Structured comparison rows for the table */
  comparisonRows: ComparisonRow[]
  /** Summary verdict text */
  verdict: string | null
  /** Related comparison pages */
  relatedComparisons: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    featuredImage: { url: string; altText: string | null } | null
  }>
  site: { siteName: string; siteUrl: string }
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  seoSettings?: { defaultMetaDesc?: string | null } | null
  /** Full page title (e.g., "Labrador vs Golden Retriever") */
  pageTitle: string
  publishedAt?: Date | string | null
  author?: { name: string | null; slug?: string | null } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Winner badge colours
function getWinnerClasses(winner: ComparisonRow['winner'], side: 'a' | 'b'): string {
  if (!winner || winner === 'tie') return ''
  if (winner === side) return 'bg-emerald-50 text-emerald-700 font-bold'
  return ''
}

function getWinnerIcon(winner: ComparisonRow['winner'], side: 'a' | 'b'): React.ReactNode {
  if (!winner) return null
  if (winner === 'tie') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 font-bold uppercase tracking-wider">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8" />
        </svg>
        Egal
      </span>
    )
  }
  if (winner === side) {
    return (
      <svg className="w-4 h-4 text-emerald-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    )
  }
  return null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaunaComparisonTemplate({
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
  return (
    <FaunaLayout site={site} categories={categories} seoSettings={seoSettings}>

      {/* ══ DUAL HERO ═══════════════════════════════════════════════════════ */}
      <section className="bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 to-gray-900" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/50">
              <li><Link href="/" className="hover:text-white transition-colors">{site.siteName}</Link></li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-white/30">&rsaquo;</span>
                <Link href="/comparatie" className="hover:text-white transition-colors">Comparații</Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-white/30">&rsaquo;</span>
                <span className="text-white/80 font-medium" aria-current="page">{pageTitle}</span>
              </li>
            </ol>
          </nav>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white text-center mb-10 leading-tight">
            {pageTitle}
          </h1>

          {/* VS cards */}
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Item A */}
            <div className="group relative bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-amber-400/40 transition-colors">
              <div className="relative aspect-[4/3] bg-gray-800">
                {itemA.featuredImage ? (
                  <Image
                    src={resolveImageUrl(itemA.featuredImage.url, site.siteUrl)}
                    fill
                    alt={itemA.featuredImage.altText ?? itemA.title}
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 40vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600/30 to-orange-600/30 flex items-center justify-center">
                    <span className="text-6xl opacity-30" aria-hidden="true">🐾</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-5">
                <Link href={getPostUrl(itemA)} className="text-lg font-extrabold text-white hover:text-amber-300 transition-colors block mb-1">
                  {itemA.title}
                </Link>
                {itemA.category && (
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                    {itemA.category.name}
                  </span>
                )}
              </div>
            </div>

            {/* VS divider */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden sm:flex">
              <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-900/30 rotate-3">
                <span className="text-white font-black text-xl -rotate-3">VS</span>
              </div>
            </div>
            {/* Mobile VS */}
            <div className="sm:hidden flex justify-center -my-3 relative z-10">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-black text-sm">VS</span>
              </div>
            </div>

            {/* Item B */}
            <div className="group relative bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-amber-400/40 transition-colors">
              <div className="relative aspect-[4/3] bg-gray-800">
                {itemB.featuredImage ? (
                  <Image
                    src={resolveImageUrl(itemB.featuredImage.url, site.siteUrl)}
                    fill
                    alt={itemB.featuredImage.altText ?? itemB.title}
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 40vw"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-600/30 to-orange-600/30 flex items-center justify-center">
                    <span className="text-6xl opacity-30" aria-hidden="true">🐾</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>
              <div className="p-5">
                <Link href={getPostUrl(itemB)} className="text-lg font-extrabold text-white hover:text-amber-300 transition-colors block mb-1">
                  {itemB.title}
                </Link>
                {itemB.category && (
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                    {itemB.category.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Meta */}
          {(publishedAt || author) && (
            <div className="flex items-center justify-center gap-3 mt-8 text-xs text-white/50">
              {author?.name && (
                <>
                  <span className="font-medium text-white/70">{author.name}</span>
                  <span className="w-1 h-1 rounded-full bg-white/30" aria-hidden="true" />
                </>
              )}
              {publishedAt && (
                <time dateTime={new Date(publishedAt).toISOString()}>{formatDateLong(publishedAt)}</time>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ══ AD SLOT — below hero ═════════════════════════════════════════════ */}
      <div className="bg-gray-100 border-y border-gray-200 py-3">
        <div className="max-w-7xl mx-auto px-4 flex justify-center">
          <div className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300" data-ad-slot="comparison-top">
            Publicitate
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ══ COMPARISON TABLE ══════════════════════════════════════════════ */}
        {comparisonRows.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6 flex items-center gap-3">
              <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Comparație detaliată
            </h2>

            {/* Desktop table */}
            <table className="hidden sm:table w-full bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th scope="col" className="px-5 py-3 text-left text-xs font-bold uppercase tracking-widest text-gray-400 w-1/3">
                    Caracteristică
                  </th>
                  <th scope="col" className="px-5 py-3 text-center text-xs font-bold uppercase tracking-widest text-amber-700 w-1/3 border-x border-gray-200">
                    {itemA.title}
                  </th>
                  <th scope="col" className="px-5 py-3 text-center text-xs font-bold uppercase tracking-widest text-amber-700 w-1/3">
                    {itemB.title}
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr key={i} className={`${i < comparisonRows.length - 1 ? 'border-b border-gray-100' : ''} ${i % 2 === 1 ? 'bg-gray-50/50' : ''}`}>
                    <th scope="row" className="px-5 py-4 font-semibold text-gray-700 text-left">
                      {row.label}
                    </th>
                    <td className={`px-5 py-4 text-gray-600 text-center border-x border-gray-100 ${getWinnerClasses(row.winner, 'a')}`}>
                      <span className="inline-flex items-center justify-center gap-2">
                        {getWinnerIcon(row.winner, 'a')}
                        {row.valueA}
                      </span>
                    </td>
                    <td className={`px-5 py-4 text-gray-600 text-center ${getWinnerClasses(row.winner, 'b')}`}>
                      <span className="inline-flex items-center justify-center gap-2">
                        {getWinnerIcon(row.winner, 'b')}
                        {row.valueB}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="sm:hidden space-y-3">
              {comparisonRows.map((row, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">{row.label}</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-xl bg-gray-50 ${getWinnerClasses(row.winner, 'a')}`}>
                      <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">{itemA.title}</p>
                      <p className="text-sm text-gray-700 font-medium flex items-center gap-1.5">
                        {getWinnerIcon(row.winner, 'a')}
                        {row.valueA}
                      </p>
                    </div>
                    <div className={`p-3 rounded-xl bg-gray-50 ${getWinnerClasses(row.winner, 'b')}`}>
                      <p className="text-[10px] font-bold text-amber-600 uppercase mb-1">{itemB.title}</p>
                      <p className="text-sm text-gray-700 font-medium flex items-center gap-1.5">
                        {getWinnerIcon(row.winner, 'b')}
                        {row.valueB}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ══ VERDICT ════════════════════════════════════════════════════════ */}
        {verdict && (
          <section className="mb-12 p-6 sm:p-8 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center shadow-sm shadow-amber-200">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-amber-900 mb-2">Verdictul nostru</h2>
                <p className="text-amber-800 leading-relaxed">{verdict}</p>
              </div>
            </div>
          </section>
        )}

        {/* ══ AD SLOT — mid content ══════════════════════════════════════════ */}
        <div className="mb-10 flex justify-center">
          <div className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300" data-ad-slot="comparison-mid">
            Publicitate
          </div>
        </div>

        {/* ══ PROSE CONTENT ══════════════════════════════════════════════════ */}
        {contentHtml && (
          <article
            className="prose prose-lg max-w-none mb-12
              prose-headings:font-extrabold prose-headings:text-gray-900 prose-headings:scroll-mt-24
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8
              prose-p:text-gray-700 prose-p:leading-relaxed
              prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900
              prose-img:rounded-xl prose-img:shadow-sm
              prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 prose-blockquote:rounded-r-xl prose-blockquote:py-1
              prose-ul:text-gray-700 prose-ol:text-gray-700
              prose-li:my-1
              prose-table:text-sm"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        )}

        {/* ══ QUICK LINKS TO INDIVIDUAL ARTICLES ═════════════════════════════ */}
        <section className="mb-12 grid sm:grid-cols-2 gap-4">
          {[itemA, itemB].map((item) => (
            <Link
              key={item.slug}
              href={getPostUrl(item)}
              className="group flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all"
            >
              {item.featuredImage && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                  <Image
                    src={resolveImageUrl(item.featuredImage.url, site.siteUrl)}
                    fill
                    alt={item.featuredImage.altText ?? item.title}
                    className="object-cover"
                    sizes="64px"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Citește mai mult</p>
                <p className="text-sm font-extrabold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-1">
                  {item.title}
                </p>
                {item.excerpt && (
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{item.excerpt}</p>
                )}
              </div>
              <svg className="w-5 h-5 text-gray-300 group-hover:text-amber-500 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </section>

        {/* ══ AD SLOT — before related ═══════════════════════════════════════ */}
        <div className="mb-10 flex justify-center">
          <div className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300" data-ad-slot="comparison-bottom">
            Publicitate
          </div>
        </div>

        {/* ══ RELATED COMPARISONS ════════════════════════════════════════════ */}
        {relatedComparisons.length > 0 && (
          <section>
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">Alte comparații</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedComparisons.map((comp) => (
                <Link
                  key={comp.id}
                  href={`/comparatie/${comp.slug}`}
                  className="group bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-lg transition-shadow"
                >
                  {comp.featuredImage && (
                    <div className="relative aspect-video bg-gray-100">
                      <Image
                        src={resolveImageUrl(comp.featuredImage.url, site.siteUrl)}
                        fill
                        alt={comp.featuredImage.altText ?? comp.title}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                      <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                          VS
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-amber-700 transition-colors line-clamp-2">
                      {comp.title}
                    </h3>
                    {comp.excerpt && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{comp.excerpt}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </FaunaLayout>
  )
}
