/**
 * Fauna — SearchTemplate
 *
 * Search results page with FaunaLayout shell.
 *   - Search bar with current query pre-filled
 *   - Results grid using shared PostCard
 *   - "No results" state with search tips
 */

import Link from 'next/link'
import FaunaLayout from './FaunaLayout'
import { PostCard } from './utils'
import type { PostCardPost } from './utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface FaunaSearchTemplateProps {
  query: string
  results: PostCardPost[]
  totalCount: number
  site: { siteName: string; siteUrl: string }
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  seoSettings?: { defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaunaSearchTemplate({
  query,
  results,
  totalCount,
  site,
  categories = [],
  seoSettings,
}: FaunaSearchTemplateProps) {
  return (
    <FaunaLayout site={site} categories={categories} seoSettings={seoSettings}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Search header */}
        <header className="mb-8">
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
              <li>
                <Link href="/" className="hover:text-amber-700 transition-colors">{site.siteName}</Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-gray-300">&rsaquo;</span>
                <span className="text-gray-600 font-medium">Căutare</span>
              </li>
            </ol>
          </nav>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-5">
            {query ? (
              <>Rezultate pentru &ldquo;<span className="text-amber-600">{query}</span>&rdquo;</>
            ) : (
              'Caută articole'
            )}
          </h1>

          {/* Search form */}
          <form action="/cautare" method="GET" role="search" className="flex gap-2 max-w-xl">
            <label htmlFor="search-input" className="sr-only">Caută</label>
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="search-input"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Caută rase, animale, sfaturi..."
                autoComplete="off"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white shadow-sm"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-xl shadow-sm transition-colors"
            >
              Caută
            </button>
          </form>
        </header>

        {/* Results */}
        {!query ? (
          <div className="text-center py-16">
            <p className="text-gray-400 text-base">Introdu un termen de căutare pentru a găsi articole.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-2xl flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Niciun rezultat găsit</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Nu am găsit articole pentru &ldquo;{query}&rdquo;. Încearcă un termen mai scurt sau mai general.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400 max-w-sm mx-auto">
              <span className="font-semibold text-gray-600">Sugestii:</span>
              <span>Verifică ortografia</span>
              <span>·</span>
              <span>Încearcă sinonime</span>
              <span>·</span>
              <span>Folosește termeni mai generali</span>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-semibold text-gray-900">{totalCount}</span>{' '}
              {totalCount === 1 ? 'rezultat' : 'rezultate'} pentru &ldquo;{query}&rdquo;
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {results.map((post) => (
                <PostCard key={post.id} post={post} siteUrl={site.siteUrl} />
              ))}
            </div>
          </>
        )}
      </div>
    </FaunaLayout>
  )
}
