/**
 * Fauna — CategoryTemplate
 *
 * Used for:
 *   - Root category pages  e.g. /rase-caini
 *   - Subcategory pages    e.g. /rase-caini/rase-mici
 *   - The /blog listing
 *
 * Design: SEO-first category page.
 *   - H1 + rich intro paragraph (description) for keyword targeting
 *   - Subcategory navigation tiles (intermediary pages that rank)
 *   - First post rendered large (featured) for CTR
 *   - Remaining posts in a clean 2-3 column card grid
 *   - Pagination
 *   - Ad slots between rows and in-sidebar
 *   - Footer with category nav
 */

import Image from 'next/image'
import Link from 'next/link'

// ─── Props ────────────────────────────────────────────────────────────────────

interface CategoryTemplateProps {
  category: {
    id: string
    name: string
    slug: string
    description: string | null
    metaTitle: string | null
    metaDesc: string | null
  }
  subcategories: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    _count: { posts: number }
  }>
  posts: Array<{
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
  }>
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  parentCategory?: { name: string; slug: string } | null
  seoSettings?: { siteName?: string; defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveImageUrl(url: string, siteUrl: string): string {
  if (url.startsWith('/')) return `${siteUrl}${url}`
  return url
}

function getPostUrl(post: { slug: string; category: { slug: string } | null }): string {
  if (post.category) return `/${post.category.slug}/${post.slug}`
  return `/blog/${post.slug}`
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function getPaginationUrl(slug: string, page: number): string {
  if (page === 1) return `/${slug}`
  return `/${slug}/pagina/${page}`
}

// Sub-category card palette (cycles)
const SUB_PALETTE = [
  'bg-amber-50  border-amber-200  hover:bg-amber-100  text-amber-900',
  'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-900',
  'bg-sky-50    border-sky-200    hover:bg-sky-100    text-sky-900',
  'bg-violet-50  border-violet-200  hover:bg-violet-100  text-violet-900',
  'bg-rose-50   border-rose-200   hover:bg-rose-100   text-rose-900',
  'bg-orange-50  border-orange-200  hover:bg-orange-100  text-orange-900',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function ArticleCard({
  post,
  siteUrl,
}: {
  post: CategoryTemplateProps['posts'][number]
  siteUrl: string
}) {
  const url = getPostUrl(post)
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaunaCategoryTemplate({
  category,
  subcategories,
  posts,
  pagination,
  site,
  parentCategory,
  seoSettings,
}: CategoryTemplateProps) {
  const { currentPage, totalPages, totalCount } = pagination
  const featuredPost = posts[0] ?? null
  const gridPosts    = posts.slice(1)                // remaining posts in grid
  const midAdAfter   = Math.floor(gridPosts.length / 2) // insert ad midway

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}>

      {/* ══ TOP NAV ══════════════════════════════════════════════════════════ */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-black text-gray-900 tracking-tight">
            {site.siteName}
          </Link>
          {parentCategory && (
            <Link
              href={`/${parentCategory.slug}`}
              className="text-xs font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors"
            >
              {parentCategory.name}
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ══ BREADCRUMB ═══════════════════════════════════════════════════════ */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
            <li>
              <Link href="/" className="hover:text-amber-700 hover:underline transition-colors">{site.siteName}</Link>
            </li>
            {parentCategory && (
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-gray-300">›</span>
                <Link href={`/${parentCategory.slug}`} className="hover:text-amber-700 hover:underline transition-colors">
                  {parentCategory.name}
                </Link>
              </li>
            )}
            <li className="flex items-center gap-1.5">
              <span aria-hidden="true" className="text-gray-300">›</span>
              <span className="text-gray-600 font-medium" aria-current="page">{category.name}</span>
            </li>
          </ol>
        </nav>

        {/* ══ CATEGORY HEADER — H1 + description (SEO) ════════════════════════ */}
        <header className="mb-8">
          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
              {category.metaTitle ?? category.name}
            </h1>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm font-bold rounded-full">
              {totalCount} {totalCount === 1 ? 'articol' : 'articole'}
            </span>
          </div>

          {/* SEO intro paragraph — write rich content here in the admin for keyword ranking */}
          {(category.metaDesc ?? category.description) && (
            <p className="text-gray-600 leading-relaxed max-w-3xl text-[15px]">
              {category.metaDesc ?? category.description}
            </p>
          )}
        </header>

        {/* ══ SUBCATEGORY NAVIGATION ═══════════════════════════════════════════
            These are the "intermediary pages" — each is its own rankable URL.
            Write a description for each subcategory in the admin for SEO value.
        ══════════════════════════════════════════════════════════════════════ */}
        {subcategories.length > 0 && (
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
                  <svg
                    className="w-3.5 h-3.5 mt-auto text-gray-400 group-hover:translate-x-0.5 group-hover:text-gray-700 transition-all"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ══ AD SLOT — below subcategories ════════════════════════════════════ */}
        {(subcategories.length > 0 || currentPage === 1) && (
          <div className="mb-8 flex justify-center">
            {/* GOOGLE ADSENSE — replace with <ins> tag */}
            <div
              className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300"
              data-ad-slot="category-top"
            >
              Publicitate
            </div>
          </div>
        )}

        {/* ══ FEATURED POST (first post, large) ═══════════════════════════════ */}
        {featuredPost && (
          <div className="mb-8">
            <Link
              href={getPostUrl(featuredPost)}
              className="group grid md:grid-cols-2 gap-6 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              {/* Image */}
              <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '16/10', minHeight: '220px' }}>
                {featuredPost.featuredImage ? (
                  <Image
                    src={resolveImageUrl(featuredPost.featuredImage.url, site.siteUrl)}
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

              {/* Content */}
              <div className="p-6 flex flex-col justify-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-3 flex items-center gap-1.5">
                  <span className="w-4 h-0.5 bg-amber-500 rounded-full inline-block" />
                  Articol recomandat
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-snug mb-3 group-hover:text-amber-700 transition-colors">
                  {featuredPost.title}
                </h2>
                {featuredPost.excerpt && (
                  <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">
                    {featuredPost.excerpt}
                  </p>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto">
                  {featuredPost.author?.name && (
                    <span className="font-semibold text-gray-600">{featuredPost.author.name}</span>
                  )}
                  {featuredPost.publishedAt && featuredPost.author?.name && (
                    <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />
                  )}
                  {featuredPost.publishedAt && (
                    <time dateTime={new Date(featuredPost.publishedAt).toISOString()}>
                      {formatDate(featuredPost.publishedAt)}
                    </time>
                  )}
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ══ POST GRID ════════════════════════════════════════════════════════ */}
        {gridPosts.length > 0 && (
          <div>
            {/* First half of grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
              {gridPosts.slice(0, midAdAfter).map((post) => (
                <ArticleCard key={post.id} post={post} siteUrl={site.siteUrl} />
              ))}
            </div>

            {/* Mid-content ad (only shown if we have enough posts) */}
            {gridPosts.length > 3 && (
              <div className="mb-6 flex justify-center">
                {/* GOOGLE ADSENSE — replace with <ins> tag */}
                <div
                  className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300"
                  data-ad-slot="category-mid"
                >
                  Publicitate
                </div>
              </div>
            )}

            {/* Second half of grid */}
            {gridPosts.slice(midAdAfter).length > 0 && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {gridPosts.slice(midAdAfter).map((post) => (
                  <ArticleCard key={post.id} post={post} siteUrl={site.siteUrl} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ PAGINATION ═══════════════════════════════════════════════════════ */}
        {totalPages > 1 && (
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

            {/* Page numbers */}
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
                    <span key={`ellipsis-${i}`} className="px-2 text-gray-400 text-sm">…</span>
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

        {/* ══ SEO CONTENT BLOCK (bottom) ════════════════════════════════════════
            This block ranks for long-tail keywords.
            The description is editable in Admin → Categories → Edit.
            Write 150-300 words of genuinely useful intro content.
        ══════════════════════════════════════════════════════════════════════ */}
        {category.description && currentPage === 1 && (
          <div className="mt-14 p-7 bg-amber-50 border border-amber-200 rounded-2xl">
            <h2 className="text-base font-extrabold text-amber-900 mb-3">
              Despre {category.name}
            </h2>
            <p className="text-sm text-amber-800 leading-relaxed">{category.description}</p>
          </div>
        )}

      </div>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════════ */}
      <footer className="mt-16 bg-gray-900 text-gray-500 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-lg font-black text-white">{site.siteName}</Link>
          <p className="text-xs">© {new Date().getFullYear()} {site.siteName} · Toate drepturile rezervate</p>
        </div>
      </footer>
    </div>
  )
}
