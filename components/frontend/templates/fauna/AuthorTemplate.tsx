/**
 * Fauna — AuthorTemplate
 *
 * Author profile page with FaunaLayout shell.
 *   - Hero card: photo, name, title, bio, badges
 *   - Posts grid using shared PostCard
 *   - Pagination
 *   - Person + BreadcrumbList JSON-LD schema
 */

import Image from 'next/image'
import Link from 'next/link'
import FaunaLayout from './FaunaLayout'
import { resolveImageUrl, getPostUrl, formatDate, PostCard, buildPaginationItems } from './utils'
import type { PostCardPost } from './utils'

// ─── Props ────────────────────────────────────────────────────────────────────

interface FaunaAuthorTemplateProps {
  author: {
    name: string | null
    slug: string | null
    title: string | null
    bio: string | null
    photo: string | null
    website: string | null
  }
  posts: PostCardPost[]
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  seoSettings?: { defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaunaAuthorTemplate({
  author,
  posts,
  pagination,
  site,
  categories = [],
  seoSettings,
}: FaunaAuthorTemplateProps) {
  const { currentPage, totalPages, totalCount } = pagination
  const authorName = author.name ?? 'Autor'
  const authorSlug = author.slug ?? ''
  const initials = authorName.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
  const canonical = `${site.siteUrl.replace(/\/$/, '')}/autor/${authorSlug}`

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${canonical}/#person`,
        name: authorName,
        url: canonical,
        ...(author.title && { jobTitle: author.title }),
        ...(author.bio && { description: author.bio }),
        ...(author.photo && {
          image: { '@type': 'ImageObject', url: resolveImageUrl(author.photo, site.siteUrl) },
        }),
        ...(author.website && { sameAs: [author.website] }),
        worksFor: { '@type': 'Organization', name: site.siteName, url: site.siteUrl },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.siteName, item: site.siteUrl },
          { '@type': 'ListItem', position: 2, name: authorName, item: canonical },
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
            <li>
              <Link href="/" className="hover:text-amber-700 transition-colors">{site.siteName}</Link>
            </li>
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="text-gray-300">&rsaquo;</span>
              <span className="text-gray-600 font-medium" aria-current="page">{authorName}</span>
            </li>
          </ol>
        </nav>

        {/* Author hero card */}
        <div className="mb-12 p-6 sm:p-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-6">

            {/* Photo */}
            <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shadow-md">
              {author.photo ? (
                <Image
                  src={resolveImageUrl(author.photo, site.siteUrl)}
                  width={112}
                  height={112}
                  alt={authorName}
                  className="w-full h-full object-cover"
                  priority
                />
              ) : (
                <div
                  className="w-full h-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-3xl font-black"
                  aria-hidden="true"
                >
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                {authorName}
              </h1>
              {author.title && (
                <p className="text-base font-semibold text-amber-600 mt-1">{author.title}</p>
              )}
              {author.bio && (
                <p className="mt-3 text-gray-600 leading-relaxed max-w-xl">{author.bio}</p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Autor verificat
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold rounded-full">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {totalCount} {totalCount === 1 ? 'articol publicat' : 'articole publicate'}
                </span>
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section heading */}
        <div className="flex items-baseline gap-3 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Articole de {authorName}</h2>
          <span className="text-sm text-gray-400">{totalCount} total</span>
        </div>

        {/* Posts grid */}
        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium">Niciun articol publicat încă.</p>
          </div>
        ) : (
          <>
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
                    href={`/autor/${authorSlug}?page=${currentPage - 1}`}
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
                        href={`/autor/${authorSlug}?page=${p}`}
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
                    href={`/autor/${authorSlug}?page=${currentPage + 1}`}
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
