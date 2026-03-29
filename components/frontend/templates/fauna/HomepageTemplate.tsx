/**
 * Fauna — HomepageTemplate
 *
 * Design concept: editorial nature magazine.
 * Warm amber primary (#D97706), clean white backgrounds, photography-first.
 * Ad slots are marked with data-ad-slot — swap placeholder divs for AdSense <ins> tags.
 *
 * Features (v2):
 *  - Uses shared FaunaLayout for nav + footer
 *  - Hero featured article with CTA
 *  - Latest articles grid
 *  - Category explorer with color-coded cards
 *  - "Did you know?" fun fact highlight
 *  - Newsletter CTA section
 *  - Compact "more posts" row
 *  - Strategic ad slots
 */

import Image from 'next/image'
import Link from 'next/link'
import FaunaLayout from './FaunaLayout'
import { resolveImageUrl, getPostUrl, formatDate, CAT_COLORS, PostCard } from './utils'
import NewsletterForm from './NewsletterForm'

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

// Fun fact pool — shown randomly on page load
const FUN_FACTS = [
  'Un delfin doarme cu un ochi deschis, pentru a rămâne vigilent.',
  'Câinii pot înțelege până la 250 de cuvinte și gesturi.',
  'Pisicile petrec 70% din viață dormind.',
  'Un colibri își poate bate aripile de 80 de ori pe secundă.',
  'Elefanții sunt singurii animale care nu pot sări.',
  'O caracatiță are trei inimi și sânge albastru.',
  'Flamingo sunt roz datorită dietei lor bogate în creveți.',
  'Hipopotamii produc un "lapte" roz care acționează ca protecție solară.',
]

// ─── Sub-components ───────────────────────────────────────────────────────────

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
  const funFact    = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)]

  return (
    <FaunaLayout site={site} categories={categories} seoSettings={seoSettings}>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      {heroPost && (
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

            {/* Site tagline */}
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

      {/* ══ "DID YOU KNOW?" FUN FACT STRIP ══════════════════════════════════ */}
      <section className="bg-emerald-700 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center">
            <svg className="w-6 h-6 text-emerald-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <p className="text-emerald-200 text-[10px] font-bold uppercase tracking-widest mb-0.5">Știai că?</p>
            <p className="text-white text-sm sm:text-base font-medium leading-snug">{funFact}</p>
          </div>
        </div>
      </section>

      {/* ══ BROWSE BY CATEGORY ══════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="bg-gradient-to-b from-amber-50 to-white py-14 border-y border-amber-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-extrabold text-gray-900">Explorează după categorie</h2>
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

      {/* ══ NEWSLETTER CTA ══════════════════════════════════════════════════ */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-3xl p-8 sm:p-12 text-center shadow-lg shadow-amber-200/30">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
              Abonează-te la newsletter
            </h2>
            <p className="text-amber-100 text-sm sm:text-base max-w-md mx-auto mb-6 leading-relaxed">
              Primește cele mai noi articole despre animale, direct în inbox. Fără spam, doar curiozități.
            </p>
            <NewsletterForm />
          </div>
        </div>
      </section>

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
          <div
            className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300"
            data-ad-slot="homepage-leaderboard-bottom"
          >
            Publicitate
          </div>
        </div>
      </div>

    </FaunaLayout>
  )
}
