/**
 * Fauna — HomepageTemplate
 *
 * Design concept: editorial nature magazine.
 * Warm amber primary (#D97706), clean white backgrounds, photography-first.
 * Ad slots are marked with data-ad-slot — swap placeholder divs for AdSense <ins> tags.
 */

import Image from 'next/image'
import Link from 'next/link'

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomepageTemplateProps {
  latestPosts: Array<{
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
  categories: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    _count: { posts: number }
  }>
  site: { siteName: string; siteUrl: string; defaultOgImage: string | null }
  seoSettings: { defaultMetaTitle: string | null; defaultMetaDesc: string | null } | null
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

// Cycling palette for category explorer cards
const CAT_COLORS = [
  { card: 'bg-amber-50  border-amber-200  hover:bg-amber-100',  badge: 'bg-amber-500',  text: 'text-amber-900'  },
  { card: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100', badge: 'bg-emerald-600', text: 'text-emerald-900' },
  { card: 'bg-sky-50    border-sky-200    hover:bg-sky-100',    badge: 'bg-sky-500',    text: 'text-sky-900'    },
  { card: 'bg-violet-50  border-violet-200  hover:bg-violet-100',  badge: 'bg-violet-600', text: 'text-violet-900' },
  { card: 'bg-rose-50   border-rose-200   hover:bg-rose-100',   badge: 'bg-rose-500',   text: 'text-rose-900'   },
  { card: 'bg-orange-50  border-orange-200  hover:bg-orange-100',  badge: 'bg-orange-500', text: 'text-orange-900' },
  { card: 'bg-teal-50   border-teal-200   hover:bg-teal-100',   badge: 'bg-teal-600',   text: 'text-teal-900'   },
  { card: 'bg-indigo-50  border-indigo-200  hover:bg-indigo-100',  badge: 'bg-indigo-500', text: 'text-indigo-900' },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function PostCard({
  post,
  siteUrl,
}: {
  post: HomepageTemplateProps['latestPosts'][number]
  siteUrl: string
}) {
  const url = getPostUrl(post)
  return (
    <article className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      <Link href={url} className="block relative overflow-hidden bg-gray-100 flex-shrink-0" style={{ aspectRatio: '16/9' }}>
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
            <span className="text-4xl opacity-30" aria-hidden="true">🐾</span>
          </div>
        )}
        {post.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            {post.category.name}
          </span>
        )}
      </Link>

      {/* Body */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-base font-bold text-gray-900 leading-snug mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
          <Link href={url} className="hover:underline decoration-amber-300">{post.title}</Link>
        </h3>
        {post.excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4 flex-1">{post.excerpt}</p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 text-xs text-gray-400">
          {post.author?.name && (
            <span className="font-medium text-gray-600 truncate max-w-[120px]">{post.author.name}</span>
          )}
          {post.publishedAt && (
            <time dateTime={new Date(post.publishedAt).toISOString()}>
              {formatDate(post.publishedAt)}
            </time>
          )}
        </div>
      </div>
    </article>
  )
}

function PostCardWide({
  post,
  siteUrl,
}: {
  post: HomepageTemplateProps['latestPosts'][number]
  siteUrl: string
}) {
  const url = getPostUrl(post)
  return (
    <article className="group flex gap-5 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4">
      {/* Thumbnail */}
      <Link href={url} className="flex-shrink-0 relative w-28 h-28 rounded-xl overflow-hidden bg-gray-100">
        {post.featuredImage ? (
          <Image
            src={resolveImageUrl(post.featuredImage.url, siteUrl)}
            fill
            alt={post.featuredImage.altText ?? post.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="112px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
            <span className="text-2xl opacity-30" aria-hidden="true">🐾</span>
          </div>
        )}
      </Link>
      <div className="flex flex-col justify-center min-w-0">
        {post.category && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
            {post.category.name}
          </span>
        )}
        <h3 className="text-sm font-bold text-gray-900 leading-snug mb-1 group-hover:text-amber-700 transition-colors line-clamp-2">
          <Link href={url}>{post.title}</Link>
        </h3>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaunaHomepageTemplate({
  latestPosts,
  categories,
  site,
  seoSettings,
}: HomepageTemplateProps) {
  const heroPost   = latestPosts[0] ?? null
  const gridPosts  = latestPosts.slice(1, 4)   // cards below hero (up to 3)
  const sidePosts  = latestPosts.slice(4)       // compact list (up to 2)
  const tagline    = seoSettings?.defaultMetaDesc ?? null

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}>

      {/* ══ NAVIGATION ═══════════════════════════════════════════════════════════ */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo / site name */}
            <Link href="/" className="flex-shrink-0 flex items-center gap-2">
              <span className="text-xl font-black text-gray-900 tracking-tight leading-none">
                {site.siteName}
              </span>
            </Link>

            {/* Desktop category nav */}
            <nav className="hidden md:flex items-center gap-0.5 overflow-hidden">
              {categories.slice(0, 7).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors whitespace-nowrap"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Mobile: horizontal scrollable category strip */}
        <div className="md:hidden overflow-x-auto border-t border-gray-100 scrollbar-hide">
          <div className="flex gap-2 px-4 py-2 w-max">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/${cat.slug}`}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-amber-100 hover:text-amber-800 rounded-full transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <main>

        {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
        {heroPost && (
          <section className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

              {/* Site tagline — only on homepage, good for branding + SEO */}
              {tagline && (
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 mb-6 text-center">
                  {tagline}
                </p>
              )}

              <Link
                href={getPostUrl(heroPost)}
                className="group grid md:grid-cols-5 gap-8 lg:gap-12 items-center"
              >
                {/* Image — 3 of 5 columns */}
                <div className="md:col-span-3 relative rounded-2xl overflow-hidden bg-gray-100" style={{ aspectRatio: '16/10' }}>
                  {heroPost.featuredImage ? (
                    <Image
                      src={resolveImageUrl(heroPost.featuredImage.url, site.siteUrl)}
                      fill
                      alt={heroPost.featuredImage.altText ?? heroPost.title}
                      priority
                      className="object-cover group-hover:scale-103 transition-transform duration-700"
                      sizes="(max-width: 768px) 100vw, 60vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-100 via-orange-100 to-amber-200 flex items-center justify-center">
                      <span className="text-8xl opacity-20" aria-hidden="true">🐾</span>
                    </div>
                  )}
                  {heroPost.category && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 bg-amber-500 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-md">
                        {heroPost.category.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Text — 2 of 5 columns */}
                <div className="md:col-span-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-0.5 bg-amber-500 rounded-full" />
                    <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                      Articol recomandat
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight mb-4 group-hover:text-amber-700 transition-colors">
                    {heroPost.title}
                  </h1>

                  {heroPost.excerpt && (
                    <p className="text-gray-500 leading-relaxed mb-5 line-clamp-3 text-[15px]">
                      {heroPost.excerpt}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-sm text-gray-400 mb-6">
                    {heroPost.author?.name && (
                      <span className="font-semibold text-gray-700">{heroPost.author.name}</span>
                    )}
                    {heroPost.publishedAt && heroPost.author?.name && (
                      <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />
                    )}
                    {heroPost.publishedAt && (
                      <time dateTime={new Date(heroPost.publishedAt).toISOString()}>
                        {formatDate(heroPost.publishedAt)}
                      </time>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-2 px-5 py-3 bg-amber-500 group-hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors text-sm shadow-sm shadow-amber-200">
                    Citește articolul
                    <svg className="w-4 h-4 translate-x-0 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            </div>
          </section>
        )}

        {/* ══ AD SLOT — leaderboard below hero ════════════════════════════════ */}
        <div className="bg-gray-100 border-y border-gray-200 py-3">
          <div className="max-w-7xl mx-auto px-4 flex justify-center">
            {/* GOOGLE ADSENSE — replace this div with your <ins> tag */}
            <div
              className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300"
              data-ad-slot="homepage-leaderboard-top"
            >
              Publicitate
            </div>
          </div>
        </div>

        {/* ══ LATEST ARTICLES GRID ════════════════════════════════════════════ */}
        {gridPosts.length > 0 && (
          <section className="bg-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">Ultimele articole</h2>
                  <div className="mt-1 w-10 h-1 bg-amber-500 rounded-full" />
                </div>
                <Link
                  href="/blog"
                  className="text-sm font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1.5 group"
                >
                  Toate articolele
                  <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gridPosts.map((post) => (
                  <PostCard key={post.id} post={post} siteUrl={site.siteUrl} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ BROWSE BY CATEGORY ══════════════════════════════════════════════ */}
        {categories.length > 0 && (
          <section className="bg-gradient-to-b from-amber-50 to-white py-14 border-y border-amber-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-extrabold text-gray-900">Explorează după tip</h2>
                <p className="mt-2 text-gray-500 text-sm max-w-lg mx-auto">
                  Găsește informații complete despre rasele și speciile care te interesează.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                {categories.map((cat, i) => {
                  const c = CAT_COLORS[i % CAT_COLORS.length]
                  return (
                    <Link
                      key={cat.id}
                      href={`/${cat.slug}`}
                      className={`group relative flex flex-col p-6 rounded-2xl border-2 ${c.card} transition-all duration-200 hover:shadow-lg hover:-translate-y-1`}
                    >
                      {/* Article count badge */}
                      <span className={`self-start mb-3 px-2.5 py-0.5 ${c.badge} text-white text-[10px] font-bold rounded-full`}>
                        {cat._count.posts} articole
                      </span>

                      <span className={`text-base font-extrabold ${c.text} leading-tight mb-1`}>
                        {cat.name}
                      </span>

                      {cat.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-1">
                          {cat.description}
                        </p>
                      )}

                      {/* Arrow */}
                      <svg
                        className="w-4 h-4 mt-3 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-1 transition-all"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* ══ COMPACT MORE POSTS ══════════════════════════════════════════════ */}
        {sidePosts.length > 0 && (
          <section className="bg-white py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-base font-bold text-gray-500 uppercase tracking-wider mb-5">
                Mai citește
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {sidePosts.map((post) => (
                  <PostCardWide key={post.id} post={post} siteUrl={site.siteUrl} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ AD SLOT — before footer ══════════════════════════════════════════ */}
        <div className="bg-gray-50 border-t border-gray-100 py-6">
          <div className="max-w-7xl mx-auto px-4 flex justify-center">
            {/* GOOGLE ADSENSE — replace with <ins> tag */}
            <div
              className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300"
              data-ad-slot="homepage-leaderboard-bottom"
            >
              Publicitate
            </div>
          </div>
        </div>

      </main>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-3 gap-8 pb-8 border-b border-gray-800">
            {/* Brand */}
            <div>
              <span className="block text-2xl font-black text-white mb-3">{site.siteName}</span>
              {seoSettings?.defaultMetaDesc && (
                <p className="text-sm leading-relaxed text-gray-500">{seoSettings.defaultMetaDesc}</p>
              )}
            </div>
            {/* Category links */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="text-sm text-gray-500 hover:text-white transition-colors py-1"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
          <p className="pt-6 text-xs text-center text-gray-600">
            © {new Date().getFullYear()} {site.siteName} · Toate drepturile rezervate
          </p>
        </div>
      </footer>
    </div>
  )
}
