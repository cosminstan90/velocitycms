/**
 * DiVet — SearchTemplate
 * Search results page wrapped in DivetLayout.
 */

import Image from 'next/image'
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import { resolveImageUrl } from '../fauna/utils'

const FOREST     = '#1a2e1c'
const MOSS       = '#4a8a4a'
const CREAM      = '#f6f1e6'
const CREAM_WARM = '#ede6d3'
const GOLD       = '#c4893a'
const TEXT       = '#1a1e16'
const TEXT_MUTED = '#6b7a65'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PostItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | string | null
  featuredImage: { url: string; altText: string | null } | null
  author: { name: string | null } | null
  category: { name: string; slug: string } | null
}

interface DivetSearchTemplateProps {
  query: string
  results: PostItem[]
  totalCount: number
  site: { siteName: string; siteUrl: string }
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  seoSettings?: { defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

// ─── Mini post card ───────────────────────────────────────────────────────────

function PostCard({ post, siteUrl }: { post: PostItem; siteUrl: string }) {
  const url = post.category ? `/${post.category.slug}/${post.slug}` : `/blog/${post.slug}`
  return (
    <article
      className="group flex flex-col rounded-2xl overflow-hidden"
      style={{ backgroundColor: 'white', boxShadow: '0 4px 24px rgba(26,46,28,0.07)', border: '1px solid rgba(26,46,28,0.07)' }}
    >
      <Link href={url} className="relative block overflow-hidden" style={{ aspectRatio: '16/9', backgroundColor: CREAM_WARM }}>
        {post.featuredImage ? (
          <Image
            src={resolveImageUrl(post.featuredImage.url, siteUrl)}
            fill
            alt={post.featuredImage.altText ?? post.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-4xl" aria-hidden="true">🐾</div>
        )}
      </Link>
      <div className="p-5 flex flex-col flex-1">
        {post.category && (
          <Link href={`/${post.category.slug}`} className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block" style={{ color: GOLD }}>
            {post.category.name}
          </Link>
        )}
        <h2 className="text-sm font-bold leading-snug line-clamp-2 flex-1" style={{ color: TEXT, fontFamily: '"Playfair Display", Georgia, serif' }}>
          <Link href={url} className="group-hover:opacity-70 transition-opacity">{post.title}</Link>
        </h2>
        {post.excerpt && (
          <p className="mt-2 text-xs leading-relaxed line-clamp-2" style={{ color: TEXT_MUTED }}>{post.excerpt}</p>
        )}
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DivetSearchTemplate({
  query,
  results,
  totalCount,
  site,
  categories = [],
  seoSettings,
}: DivetSearchTemplateProps) {
  return (
    <DivetLayout site={site} categories={categories} seoSettings={seoSettings}>
      <div className="max-w-[1200px] mx-auto px-5 py-10">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm" style={{ color: TEXT_MUTED }} aria-label="Breadcrumb">
          <Link href="/" style={{ color: TEXT_MUTED }} className="hover:underline">{site.siteName}</Link>
          <span aria-hidden="true">›</span>
          <span style={{ color: TEXT }}>Căutare</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1
            className="mb-5 leading-tight"
            style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 700, color: TEXT }}
          >
            {query ? (
              <>Rezultate pentru &ldquo;<span style={{ color: MOSS }}>{query}</span>&rdquo;</>
            ) : (
              'Caută animale'
            )}
          </h1>

          {/* Search form */}
          <form action="/cautare" method="GET" role="search" className="flex gap-2 max-w-lg">
            <label htmlFor="divet-search" className="sr-only">Caută</label>
            <div className="relative flex-1">
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: TEXT_MUTED }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="divet-search"
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Caută rase, animale, specii..."
                autoComplete="off"
                className="w-full pl-10 pr-4 py-3 text-sm rounded-xl focus:outline-none focus:ring-2"
                style={{
                  border: `1.5px solid rgba(26,46,28,0.15)`,
                  backgroundColor: 'white',
                  color: TEXT,
                  // @ts-expect-error -- CSS custom props not in CSSProperties
                  '--tw-ring-color': MOSS,
                }}
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 text-sm font-bold rounded-xl transition-opacity hover:opacity-90"
              style={{ backgroundColor: FOREST, color: CREAM }}
            >
              Caută
            </button>
          </form>
        </header>

        {/* Results */}
        {!query ? (
          <div className="text-center py-20" style={{ color: TEXT_MUTED }}>
            <p>Introdu un termen de căutare pentru a găsi articole.</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-2xl text-3xl"
              style={{ backgroundColor: CREAM_WARM }}
              aria-hidden="true"
            >
              🔍
            </div>
            <h2 className="text-lg font-bold mb-2" style={{ color: TEXT, fontFamily: '"Playfair Display", Georgia, serif' }}>
              Niciun rezultat găsit
            </h2>
            <p className="text-sm max-w-sm mx-auto mb-6" style={{ color: TEXT_MUTED }}>
              Nu am găsit articole pentru &ldquo;{query}&rdquo;. Încearcă un termen mai scurt sau mai general.
            </p>
            <div className="flex flex-wrap justify-center gap-2 text-xs" style={{ color: TEXT_MUTED }}>
              <span className="font-semibold" style={{ color: TEXT }}>Sugestii:</span>
              <span>Verifică ortografia</span>
              <span>·</span>
              <span>Încearcă sinonime</span>
              <span>·</span>
              <span>Folosește termeni mai generali</span>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm mb-6" style={{ color: TEXT_MUTED }}>
              <strong style={{ color: TEXT }}>{totalCount}</strong>{' '}
              {totalCount === 1 ? 'rezultat' : 'rezultate'} pentru &ldquo;{query}&rdquo;
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.map((p) => <PostCard key={p.id} post={p} siteUrl={site.siteUrl} />)}
            </div>
          </>
        )}
      </div>
    </DivetLayout>
  )
}
