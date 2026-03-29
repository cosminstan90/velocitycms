'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useMemo } from 'react'
import { resolveImageUrl, getPostUrl, formatDate } from './utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | string | null
  featuredImage: {
    url: string
    altText: string | null
    width: number | null
    height: number | null
  } | null
  author: { name: string | null } | null
  category: { name: string; slug: string } | null
}

interface Subcategory {
  id: string
  name: string
  slug: string
  description: string | null
  _count: { posts: number }
}

interface CategoryPostsClientProps {
  posts: Post[]
  subcategories: Subcategory[]
  category: { name: string; slug: string; description: string | null }
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  siteUrl: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getPaginationUrl(slug: string, page: number): string {
  if (page === 1) return `/${slug}`
  return `/${slug}/pagina/${page}`
}

const SUB_PALETTE = [
  'bg-amber-50  border-amber-200  hover:bg-amber-100  text-amber-900',
  'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-900',
  'bg-sky-50    border-sky-200    hover:bg-sky-100    text-sky-900',
  'bg-violet-50  border-violet-200  hover:bg-violet-100  text-violet-900',
  'bg-rose-50   border-rose-200   hover:bg-rose-100   text-rose-900',
  'bg-orange-50  border-orange-200  hover:bg-orange-100  text-orange-900',
]

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// ─── ArticleCard ──────────────────────────────────────────────────────────────

function ArticleCard({ post, siteUrl, compact = false }: { post: Post; siteUrl: string; compact?: boolean }) {
  const url = getPostUrl(post)

  if (compact) {
    return (
      <article className="group flex gap-4 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
        <Link href={url} className="flex-shrink-0 relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
          {post.featuredImage ? (
            <Image
              src={resolveImageUrl(post.featuredImage.url, siteUrl)}
              fill
              alt={post.featuredImage.altText ?? post.title}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="96px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
              <span className="text-2xl opacity-30" aria-hidden="true">🐾</span>
            </div>
          )}
        </Link>
        <div className="flex flex-col justify-center min-w-0">
          <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1 group-hover:text-amber-700 transition-colors line-clamp-2">
            <Link href={url}>{post.title}</Link>
          </h3>
          {post.excerpt && (
            <p className="text-xs text-gray-500 line-clamp-1 mb-1">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto">
            {post.author?.name && <span>{post.author.name}</span>}
            {post.publishedAt && post.author?.name && <span aria-hidden="true">·</span>}
            {post.publishedAt && (
              <time dateTime={new Date(post.publishedAt).toISOString()}>{formatDate(post.publishedAt)}</time>
            )}
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <Link href={url} className="block relative overflow-hidden bg-gray-100 flex-shrink-0" style={{ aspectRatio: '16/10' }}>
        {post.featuredImage ? (
          <Image
            src={resolveImageUrl(post.featuredImage.url, siteUrl)}
            fill
            alt={post.featuredImage.altText ?? post.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <span className="text-3xl opacity-30" aria-hidden="true">🐾</span>
          </div>
        )}
      </Link>
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
          <Link href={url} className="hover:underline decoration-amber-300">{post.title}</Link>
        </h3>
        {post.excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3 flex-1">{post.excerpt}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 text-xs text-gray-400">
          {post.author?.name && (
            <span className="font-medium text-gray-600 truncate max-w-[120px]">{post.author.name}</span>
          )}
          {post.publishedAt && (
            <time dateTime={new Date(post.publishedAt).toISOString()}>{formatDate(post.publishedAt)}</time>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Main Client Island ───────────────────────────────────────────────────────

export default function CategoryPostsClient({
  posts,
  subcategories,
  category,
  pagination,
  siteUrl,
}: CategoryPostsClientProps) {
  const { currentPage, totalPages, totalCount } = pagination

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [activeLetter, setActiveLetter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'alpha'>('newest')

  // Sort posts client-side
  const sortedPosts = useMemo(() => {
    const copy = [...posts]
    if (sortBy === 'oldest') {
      copy.sort((a, b) => {
        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0
        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0
        return da - db
      })
    } else if (sortBy === 'alpha') {
      copy.sort((a, b) => a.title.localeCompare(b.title, 'ro'))
    }
    // 'newest' — keep server order (desc publishedAt)
    return copy
  }, [posts, sortBy])

  const featuredPost = sortedPosts[0] ?? null
  const gridPosts = sortedPosts.slice(1)
  const midAdAfter = Math.floor(gridPosts.length / 2)

  // Compute which letters have posts
  const letterSet = useMemo(() => {
    const set = new Set<string>()
    sortedPosts.forEach((p) => {
      const first = p.title.charAt(0).toUpperCase()
      if (/[A-Z]/.test(first)) set.add(first)
    })
    return set
  }, [sortedPosts])

  // Filter posts by letter
  const filteredGridPosts = useMemo(() => {
    if (!activeLetter) return gridPosts
    return sortedPosts.filter((p) => p.title.charAt(0).toUpperCase() === activeLetter)
  }, [activeLetter, gridPosts, sortedPosts])

  const showFeatured = !activeLetter && sortBy === 'newest' && featuredPost

  return (
    <>
      {/* ══ A-Z FILTER BAR ═══════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <div className="flex items-center gap-2">
            {/* All button */}
            <button
              onClick={() => setActiveLetter(null)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                !activeLetter
                  ? 'bg-amber-500 text-white'
                  : 'bg-gray-100 text-gray-500 hover:bg-amber-100 hover:text-amber-700'
              }`}
            >
              Toate
            </button>

            {/* Letter buttons — scrollable on mobile */}
            <div className="flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex gap-1 w-max">
                {ALPHABET.map((letter) => {
                  const hasItems = letterSet.has(letter)
                  return (
                    <button
                      key={letter}
                      onClick={() => hasItems && setActiveLetter(activeLetter === letter ? null : letter)}
                      disabled={!hasItems}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-colors ${
                        activeLetter === letter
                          ? 'bg-amber-500 text-white'
                          : hasItems
                            ? 'bg-gray-50 text-gray-600 hover:bg-amber-100 hover:text-amber-700'
                            : 'bg-transparent text-gray-300 cursor-not-allowed'
                      }`}
                    >
                      {letter}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* View mode toggle */}
            <div className="hidden sm:flex items-center gap-1 border-l border-gray-200 pl-3 ml-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Vizualizare grilă"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'text-amber-600 bg-amber-50' : 'text-gray-400 hover:text-gray-600'}`}
                aria-label="Vizualizare listă"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ══ SUBCATEGORY NAVIGATION ═══════════════════════════════════════════ */}
        {subcategories.length > 0 && !activeLetter && (
          <section className="mb-10">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
              Explorează subcategoriile
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {subcategories.map((sub, i) => (
                <Link
                  key={sub.id}
                  href={`/${category.slug}/${sub.slug}`}
                  className={`group flex flex-col p-4 rounded-2xl border-2 ${SUB_PALETTE[i % SUB_PALETTE.length]} transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
                >
                  <span className="font-extrabold text-sm leading-snug mb-1 group-hover:underline">
                    {sub.name}
                  </span>
                  <span className="text-xs opacity-60 mb-2">
                    {sub._count.posts} {sub._count.posts === 1 ? 'articol' : 'articole'}
                  </span>
                  {sub.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed hidden sm:block">
                      {sub.description}
                    </p>
                  )}
                  <svg className="w-3.5 h-3.5 mt-auto text-gray-400 group-hover:translate-x-0.5 group-hover:text-gray-700 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══ AD SLOT — below subcategories ════════════════════════════════════ */}
        {(subcategories.length > 0 || currentPage === 1) && !activeLetter && (
          <div className="mb-8 flex justify-center">
            <div className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300" data-ad-slot="category-top">
              Publicitate
            </div>
          </div>
        )}

        {/* ══ TWO-COLUMN LAYOUT ════════════════════════════════════════════════ */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">

          {/* ── Main content ── */}
          <div className="lg:col-span-2">

            {/* ── Toolbar: pagination info + sort ── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <p className="text-sm text-gray-500">
                {activeLetter ? (
                  <>
                    <span className="font-semibold text-gray-900">{filteredGridPosts.length}</span>
                    {' '}{filteredGridPosts.length === 1 ? 'rezultat' : 'rezultate'} pentru litera &ldquo;{activeLetter}&rdquo;
                  </>
                ) : (
                  <>
                    Pagina <span className="font-semibold text-gray-900">{currentPage}</span> din{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                    {' '}·{' '}
                    <span className="font-semibold text-gray-900">{totalCount}</span> articole
                  </>
                )}
              </p>
              {!activeLetter && (
                <div className="flex items-center gap-2">
                  <label htmlFor="sort-select" className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Sortează:
                  </label>
                  <select
                    id="sort-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'alpha')}
                    className="text-sm text-gray-700 font-medium bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-7 appearance-none cursor-pointer hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-colors"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236B7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.4rem center', backgroundSize: '1.2em' }}
                  >
                    <option value="newest">Cele mai noi</option>
                    <option value="oldest">Cele mai vechi</option>
                    <option value="alpha">Alfabetic</option>
                  </select>
                </div>
              )}
            </div>

            {/* FEATURED POST (first post, large) */}
            {showFeatured && (
              <div className="mb-8">
                <Link
                  href={getPostUrl(featuredPost)}
                  className="group grid md:grid-cols-2 gap-6 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '16/10', minHeight: '220px' }}>
                    {featuredPost.featuredImage ? (
                      <Image
                        src={resolveImageUrl(featuredPost.featuredImage.url, siteUrl)}
                        fill
                        alt={featuredPost.featuredImage.altText ?? featuredPost.title}
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-200 flex items-center justify-center">
                        <span className="text-6xl opacity-20" aria-hidden="true">🐾</span>
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col justify-center">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-1.5">
                      <span className="w-4 h-0.5 bg-amber-500 rounded-full inline-block" />
                      Articol recomandat
                    </span>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug mb-3 group-hover:text-amber-700 transition-colors">
                      {featuredPost.title}
                    </h2>
                    {featuredPost.excerpt && (
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">{featuredPost.excerpt}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto">
                      {featuredPost.author?.name && <span className="font-semibold text-gray-600">{featuredPost.author.name}</span>}
                      {featuredPost.publishedAt && featuredPost.author?.name && <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />}
                      {featuredPost.publishedAt && (
                        <time dateTime={new Date(featuredPost.publishedAt).toISOString()}>{formatDate(featuredPost.publishedAt)}</time>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
            )}

            {/* Active letter indicator */}
            {activeLetter && (
              <div className="mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-amber-500 text-white font-extrabold rounded-xl flex items-center justify-center text-lg">
                  {activeLetter}
                </span>
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {filteredGridPosts.length} {filteredGridPosts.length === 1 ? 'rezultat' : 'rezultate'}
                  </p>
                  <p className="text-xs text-gray-400">Articole care încep cu litera &ldquo;{activeLetter}&rdquo;</p>
                </div>
              </div>
            )}

            {/* POST GRID/LIST */}
            {filteredGridPosts.length > 0 && (
              <div>
                {viewMode === 'grid' ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-5 mb-6">
                      {filteredGridPosts.slice(0, midAdAfter || filteredGridPosts.length).map((post) => (
                        <ArticleCard key={post.id} post={post} siteUrl={siteUrl} />
                      ))}
                    </div>

                    {!activeLetter && gridPosts.length > 3 && (
                      <div className="mb-6 flex justify-center">
                        <div className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300" data-ad-slot="category-mid">
                          Publicitate
                        </div>
                      </div>
                    )}

                    {!activeLetter && gridPosts.slice(midAdAfter).length > 0 && (
                      <div className="grid sm:grid-cols-2 gap-5">
                        {gridPosts.slice(midAdAfter).map((post) => (
                          <ArticleCard key={post.id} post={post} siteUrl={siteUrl} />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="space-y-3">
                    {(activeLetter ? filteredGridPosts : gridPosts).map((post) => (
                      <ArticleCard key={post.id} post={post} siteUrl={siteUrl} compact />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Empty state for letter filter */}
            {activeLetter && filteredGridPosts.length === 0 && (
              <div className="text-center py-16">
                <p className="text-gray-400 text-sm">Nu sunt articole care încep cu litera &ldquo;{activeLetter}&rdquo;</p>
                <button onClick={() => setActiveLetter(null)} className="mt-3 text-amber-600 text-sm font-semibold hover:underline">
                  Arată toate articolele
                </button>
              </div>
            )}

            {/* PAGINATION */}
            {totalPages > 1 && !activeLetter && (
              <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Paginare">
                {currentPage > 1 && (
                  <Link
                    href={getPaginationUrl(category.slug, currentPage - 1)}
                    className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:border-amber-400 hover:text-amber-700 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Anterior
                  </Link>
                )}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .reduce<(number | '...')[]>((acc, p, i, arr) => {
                      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
                      acc.push(p)
                      return acc
                    }, [])
                    .map((p, i) =>
                      p === '...' ? (
                        <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">&hellip;</span>
                      ) : (
                        <Link
                          key={p}
                          href={getPaginationUrl(category.slug, p as number)}
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
                    href={getPaginationUrl(category.slug, currentPage + 1)}
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
          </div>

          {/* ── Sidebar ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-32 space-y-6">

              {/* Subcategory tree nav */}
              {subcategories.length > 0 && (
                <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Subcategorii</h2>
                  <ul className="space-y-1">
                    {subcategories.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/${category.slug}/${sub.slug}`}
                          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                        >
                          <span className="font-medium">{sub.name}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{sub._count.posts}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AD SLOT — sidebar */}
              <div className="w-full h-[250px] bg-gray-200 rounded-2xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300" data-ad-slot="category-sidebar">
                Publicitate
              </div>

              {/* SEO content block */}
              {category.description && currentPage === 1 && (
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                  <h2 className="text-sm font-extrabold text-amber-900 mb-2">Despre {category.name}</h2>
                  <p className="text-xs text-amber-800 leading-relaxed">{category.description}</p>
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Mobile SEO content block */}
        {category.description && currentPage === 1 && (
          <div className="mt-10 p-7 bg-amber-50 border border-amber-200 rounded-2xl lg:hidden">
            <h2 className="text-base font-extrabold text-amber-900 mb-3">Despre {category.name}</h2>
            <p className="text-sm text-amber-800 leading-relaxed">{category.description}</p>
          </div>
        )}
      </div>
    </>
  )
}
