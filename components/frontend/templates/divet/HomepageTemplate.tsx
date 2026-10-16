/**
 * DiVet — HomepageTemplate (v2)
 *
 * Sections (top → bottom):
 *  1. Hero — single-col text + search + decorative leaf SVG
 *  2. Categorii — 4-col grid cu imagini derivate din posts
 *  3. Animale în spotlight — asimetric 1.6fr / 1fr
 *  4. Articole recente — 3-col grid
 */

import Image from 'next/image'
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import DivetSearchHero from './DivetSearchHero'
import { resolveImageUrl, getPostUrl, formatDate } from '../fauna/utils'

const FOREST     = '#1a2e1c'
const MOSS       = '#4a8a4a'
const CREAM      = '#f6f1e6'
const CREAM_WARM = '#ede6d3'
const GOLD       = '#c4893a'
const GOLD_LIGHT = '#e8b86a'
const TEXT       = '#1a1e16'
const TEXT_MUTED = '#6b7a65'

const LEAF_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cpath d='M40 5 C20 5 5 20 5 40 C5 55 15 67 28 72 C25 65 24 55 28 46 C32 37 40 32 40 32 C40 32 48 37 52 46 C56 55 55 65 52 72 C65 67 75 55 75 40 C75 20 60 5 40 5Z' fill='%234a8a4a'/%3E%3C/svg%3E")`

// ─── Props ────────────────────────────────────────────────────────────────────

interface HomepageTemplateProps {
  latestPosts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | string | null
    featuredImage: { url: string; altText: string | null; width: number | null; height: number | null } | null
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

// ─── Category emoji fallback ──────────────────────────────────────────────────

const CAT_EMOJIS: Record<string, string> = {
  caini: '🐕', pisici: '🐈', pasari: '🦜', pesti: '🐠',
  reptile: '🦎', rozatoare: '🐹', iepuri: '🐇', cai: '🐴',
  salbatice: '🦁', mamifere: '🐘', insecte: '🦋', amfibieni: '🐸',
}

function getCatEmoji(slug: string): string {
  return CAT_EMOJIS[slug] ?? '🐾'
}

// ─── Spotlight card ───────────────────────────────────────────────────────────

function SpotlightCard({
  post,
  siteUrl,
  size,
}: {
  post: HomepageTemplateProps['latestPosts'][number]
  siteUrl: string
  size: 'large' | 'small'
}) {
  const url = getPostUrl(post)
  return (
    <Link
      href={url}
      className="group relative rounded-2xl overflow-hidden block"
      style={{ height: size === 'large' ? '460px' : '215px' }}
    >
      {post.featuredImage ? (
        <Image
          src={resolveImageUrl(post.featuredImage.url, siteUrl)}
          fill
          alt={post.featuredImage.altText ?? post.title}
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes={size === 'large' ? '(max-width: 768px) 100vw, 60vw' : '(max-width: 768px) 100vw, 30vw'}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-7xl"
          style={{ backgroundColor: FOREST }}
        >
          🐾
        </div>
      )}
      {/* Overlay gradient — pointer-events:none so clicks reach the Link */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(26,46,28,0.88) 0%, transparent 55%)' }}
      />
      <div className="absolute inset-0 flex flex-col justify-end p-6">
        {post.category && (
          <span
            className="inline-block mb-2 w-fit px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: GOLD, color: 'white' }}
          >
            {post.category.name}
          </span>
        )}
        <h3
          className="font-bold leading-snug"
          style={{
            color: CREAM,
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: size === 'large' ? '24px' : '18px',
          }}
        >
          {post.title}
        </h3>
        {size === 'large' && post.excerpt && (
          <p className="mt-2 text-sm leading-relaxed line-clamp-2" style={{ color: 'rgba(246,241,230,0.7)' }}>
            {post.excerpt}
          </p>
        )}
      </div>
    </Link>
  )
}

// ─── Recent post card ─────────────────────────────────────────────────────────

function DivetPostCard({ post, siteUrl }: { post: HomepageTemplateProps['latestPosts'][number]; siteUrl: string }) {
  const url = getPostUrl(post)
  return (
    <article
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1"
      style={{ backgroundColor: 'white', boxShadow: '0 4px 24px rgba(26,46,28,0.08)', border: '1px solid rgba(26,46,28,0.08)' }}
    >
      <Link href={url} className="block relative overflow-hidden flex-shrink-0 bg-gray-100" style={{ height: '200px' }}>
        {post.featuredImage ? (
          <Image
            src={resolveImageUrl(post.featuredImage.url, siteUrl)}
            fill
            alt={post.featuredImage.altText ?? post.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl" style={{ backgroundColor: CREAM_WARM }}>
            🐾
          </div>
        )}
        {post.category && (
          <span
            className="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: GOLD, color: 'white' }}
          >
            {post.category.name}
          </span>
        )}
      </Link>
      <div className="flex flex-col flex-1 p-5">
        <h3
          className="text-base font-bold leading-snug mb-2 line-clamp-2 transition-opacity group-hover:opacity-80"
          style={{ color: TEXT, fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          <Link href={url}>{post.title}</Link>
        </h3>
        {post.excerpt && (
          <p className="text-sm leading-relaxed line-clamp-2 mb-4 flex-1" style={{ color: TEXT_MUTED, fontFamily: '"Lora", Georgia, serif' }}>
            {post.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between mt-auto pt-3 text-xs" style={{ borderTop: `1px solid ${CREAM_WARM}`, color: TEXT_MUTED }}>
          {post.author?.name && <span className="font-medium truncate max-w-[120px]">{post.author.name}</span>}
          {post.publishedAt && (
            <time dateTime={new Date(post.publishedAt).toISOString()}>{formatDate(post.publishedAt)}</time>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DivetHomepageTemplate({
  latestPosts,
  categories,
  site,
  seoSettings,
}: HomepageTemplateProps) {
  const spotlightMain  = latestPosts[0] ?? null
  const spotlightSmall = latestPosts.slice(1, 3)
  const recentPosts    = latestPosts.slice(3, 6)

  // Derive category cover images from the first matching post per category
  const catImageMap = new Map<string, HomepageTemplateProps['latestPosts'][0]['featuredImage']>()
  for (const post of latestPosts) {
    if (post.category?.slug && post.featuredImage && !catImageMap.has(post.category.slug)) {
      catImageMap.set(post.category.slug, post.featuredImage)
    }
  }

  return (
    <DivetLayout site={site} categories={categories} seoSettings={seoSettings}>

      {/* ══ HERO ═════════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundColor: FOREST,
          backgroundImage: LEAF_BG,
          backgroundSize: '80px 80px',
          minHeight: '520px',
          display: 'flex',
          alignItems: 'center',
          padding: '80px 0',
        }}
      >
        <div className="max-w-[1200px] mx-auto px-5 w-full relative">
          <div style={{ maxWidth: '680px' }}>
            <p
              className="text-xs font-bold uppercase tracking-[0.15em] mb-5"
              style={{ color: GOLD_LIGHT }}
            >
              Enciclopedia Animală Română
            </p>
            <h1
              className="mb-8 leading-[1.1]"
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: 'clamp(40px, 6vw, 64px)',
                fontStyle: 'italic',
                fontWeight: 400,
                color: CREAM,
              }}
            >
              <strong style={{ fontStyle: 'normal', color: 'white' }}>Descoperă</strong>{' '}
              lumea <em style={{ fontWeight: 600 }}>animală</em>
            </h1>

            <DivetSearchHero />

            <div className="flex items-center gap-4 mt-6 text-sm" style={{ color: 'rgba(246,241,230,0.55)' }}>
              <span><strong style={{ color: GOLD_LIGHT }}>500+</strong> animale</span>
              <span style={{ color: 'rgba(246,241,230,0.3)' }}>·</span>
              <span><strong style={{ color: GOLD_LIGHT }}>{categories.length}</strong> categorii</span>
              <span style={{ color: 'rgba(246,241,230,0.3)' }}>·</span>
              <span>actualizat zilnic</span>
            </div>
          </div>

          {/* Decorative leaf SVG — right side, desktop only */}
          <div
            className="hidden lg:block absolute"
            style={{ right: '-20px', bottom: '-40px', opacity: 0.08, pointerEvents: 'none' }}
            aria-hidden="true"
          >
            <svg width="420" height="420" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 10 C50 10 10 50 10 100 C10 140 36 173 72 185 C66 168 64 145 72 124 C80 103 100 92 100 92 C100 92 120 103 128 124 C136 145 134 168 128 185 C164 173 190 140 190 100 C190 50 150 10 100 10Z" fill="#90b88a"/>
              <path d="M100 50 C78 50 60 68 60 90 C60 108 70 122 85 128 C82 119 82 108 87 99 C92 90 100 86 100 86 C100 86 108 90 113 99 C118 108 118 119 115 128 C130 122 140 108 140 90 C140 68 122 50 100 50Z" fill="#4a8a4a"/>
            </svg>
          </div>
        </div>
      </section>

      {/* ══ CATEGORII ════════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section style={{ backgroundColor: 'white', padding: '80px 0' }}>
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="flex items-baseline justify-between mb-10">
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', color: TEXT }}
              >
                Explorează categorii
              </h2>
              <Link href="/blog" className="text-sm font-medium" style={{ color: MOSS }}>
                Vezi toate →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((cat) => {
                const catImg = catImageMap.get(cat.slug)
                return (
                  <Link
                    key={cat.id}
                    href={`/${cat.slug}`}
                    className="group relative overflow-hidden block"
                    style={{ aspectRatio: '3/2', borderRadius: '20px' }}
                  >
                    {catImg ? (
                      <Image
                        src={resolveImageUrl(catImg.url, site.siteUrl)}
                        fill
                        alt={cat.name}
                        className="object-cover group-hover:scale-[1.06] transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center text-6xl group-hover:scale-[1.06] transition-transform duration-500"
                        style={{ backgroundColor: FOREST }}
                      >
                        {getCatEmoji(cat.slug)}
                      </div>
                    )}
                    {/* Gradient overlay — pointer-events:none so clicks reach Link */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{ background: 'linear-gradient(to top, rgba(26,46,28,0.85) 0%, rgba(26,46,28,0.1) 60%)' }}
                    />
                    <div className="absolute inset-0 flex flex-col justify-end p-4 pointer-events-none">
                      <span
                        className="text-base font-bold leading-tight"
                        style={{ color: CREAM, fontFamily: '"Playfair Display", Georgia, serif' }}
                      >
                        {cat.name}
                      </span>
                      <span className="text-xs mt-0.5" style={{ color: GOLD_LIGHT }}>
                        {cat._count.posts} articole
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ══ ANIMALE ÎN SPOTLIGHT ═════════════════════════════════════════════ */}
      {spotlightMain && (
        <section style={{ backgroundColor: CREAM_WARM, padding: '80px 0' }}>
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="flex items-baseline justify-between mb-10">
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', color: TEXT }}
              >
                Animale în spotlight
              </h2>
              <Link href="/blog" className="text-sm font-medium" style={{ color: MOSS }}>
                Toate speciile →
              </Link>
            </div>

            <div
              className="grid gap-5"
              style={{ gridTemplateColumns: spotlightSmall.length > 0 ? '1.6fr 1fr' : '1fr' }}
            >
              <SpotlightCard post={spotlightMain} siteUrl={site.siteUrl} size="large" />
              {spotlightSmall.length > 0 && (
                <div className="flex flex-col gap-5">
                  {spotlightSmall.map((post) => (
                    <SpotlightCard key={post.id} post={post} siteUrl={site.siteUrl} size="small" />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══ ARTICOLE RECENTE ═════════════════════════════════════════════════ */}
      {recentPosts.length > 0 && (
        <section style={{ backgroundColor: 'white', padding: '80px 0' }}>
          <div className="max-w-[1200px] mx-auto px-5">
            <div className="flex items-baseline justify-between mb-10">
              <h2
                className="text-3xl font-semibold"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', color: TEXT }}
              >
                Articole recente
              </h2>
              <Link href="/blog" className="text-sm font-medium" style={{ color: MOSS }}>
                Toate articolele →
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <DivetPostCard key={post.id} post={post} siteUrl={site.siteUrl} />
              ))}
            </div>
          </div>
        </section>
      )}

    </DivetLayout>
  )
}
