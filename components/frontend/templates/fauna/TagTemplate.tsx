/**
 * Fauna — TagTemplate
 *
 * Tag listing page with FaunaLayout shell.
 *   - Tag header: name, description, post count
 *   - Posts grid using shared PostCard
 *   - Pagination
 *   - CollectionPage + BreadcrumbList JSON-LD
 */

import Link from 'next/link'
import FaunaLayout from './FaunaLayout'
import { PostCard, buildPaginationItems } from './utils'
import type { PostCardPost } from './utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface FaunaTagTemplateProps {
  tag: {
    name: string
    slug: string
    description: string | null
    metaTitle: string | null
    metaDesc: string | null
  }
  posts: PostCardPost[]
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  seoSettings?: { defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaunaTagTemplate({
  tag,
  posts,
  pagination,
  site,
  categories = [],
  seoSettings,
}: FaunaTagTemplateProps) {
  const { currentPage, totalPages, totalCount } = pagination
  const tagUrl = `${site.siteUrl.replace(/\/$/, '')}/eticheta/${tag.slug}`

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${tagUrl}/#collectionpage`,
        url: tagUrl,
        name: tag.metaTitle ?? `#${tag.name}`,
        description: tag.metaDesc ?? tag.description ?? undefined,
        isPartOf: { '@id': `${site.siteUrl}/#website` },
        inLanguage: 'ro-RO',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.siteName, item: site.siteUrl },
          { '@type': 'ListItem', position: 2, name: `#${tag.name}`, item: tagUrl },
        ],
      },
    ],
  }

  const paginationItems = buildPaginationItems(currentPage, totalPages)

  return (
    <FaunaLayout site={site} categories={categories} seoSettings={seoSettings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      {/* Tag hero */}
      <section className="bg-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/50">
              <li>
                <Link href="/" className="hover:text-white transition-colors">{site.siteName}</Link>
              </li>
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-white/30">&rsaquo;</span>
                <span className="text-white/80 font-medium" aria-current="page">#{tag.name}</span>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              #{tag.name}
            </h1>
            <span className="px-3 py-1 bg-amber-500/90 text-white text-sm font-bold rounded-full shadow-sm">
              {totalCount} {totalCount === 1 ? 'articol' : 'articole'}
            </span>
          </div>

          {(tag.description || tag.metaDesc) && (
            <p className="text-white/70 leading-relaxed max-w-2xl text-[15px]">
              {tag.description ?? tag.metaDesc}
            </p>
          )}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg font-medium">
              Niciun articol cu eticheta &ldquo;{tag.name}&rdquo;.
            </p>
            <Link href="/" className="mt-4 inline-block text-amber-600 font-semibold text-sm hover:underline">
              ← Înapoi acasă
            </Link>
          </div>
        ) : (
          <>
            {/* Pagination info */}
            <p className="text-sm text-gray-500 mb-6">
              Pagina <span className="font-semibold text-gray-900">{currentPage}</span>
              {totalPages > 1 && (
                <> din <span className="font-semibold text-gray-900">{totalPages}</span></>
              )}
              {' '}· <span className="font-semibold text-gray-900">{totalCount}</span> articole
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} siteUrl={site.siteUrl} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <nav aria-label="Paginare" className="mt-12 flex items-center justify-center gap-2">
                {currentPage > 1 && (
                  <Link
                    href={`/eticheta/${tag.slug}?page=${currentPage - 1}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-amber-400 hover:text-amber-700 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Anterior
                  </Link>
                )}
                <div className="flex items-center gap-1">
                  {paginationItems.map((p, i) =>
                    p === '...' ? (
                      <span key={`e${i}`} className="px-2 text-gray-400 text-sm">&hellip;</span>
                    ) : (
                      <Link
                        key={p}
                        href={`/eticheta/${tag.slug}?page=${p}`}
                        className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-colors ${
                          p === currentPage
                            ? 'bg-amber-500 text-white shadow-sm shadow-amber-200'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-amber-400 hover:text-amber-700'
                        }`}
                        aria-current={p === currentPage ? 'page' : undefined}
                      >
                        {p}
                      </Link>
                    )
                  )}
                </div>
                {currentPage < totalPages && (
                  <Link
                    href={`/eticheta/${tag.slug}?page=${currentPage + 1}`}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-amber-400 hover:text-amber-700 transition-colors shadow-sm"
                  >
                    Următor
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </FaunaLayout>
  )
}
