/**
 * DiVet — CategoryTemplate
 *
 * Header verde cu breadcrumb + titlu italic.
 * Filter pills (subcategorii sau toate).
 * Grid 3col desktop, 2col mobil, paginare circulară.
 *
 * Nota: filtrarea client-side nu este implementată — datele vin din server.
 * Filter pills linkuiesc la subcategorii reale sau la pagina curentă.
 */

import Image from 'next/image'
import Link from 'next/link'
import DivetLayout, { LEAF_PATTERN_SVG } from './DivetLayout'
import { resolveImageUrl, getPostUrl, formatDate, buildPaginationItems } from '../fauna/utils'

const FOREST     = '#1a2e1c'
const MOSS       = '#4a8a4a'
const CREAM      = '#f6f1e6'
const CREAM_WARM = '#ede6d3'
const GOLD       = '#c4893a'
const GOLD_LIGHT = '#e8b86a'
const TEXT       = '#1a1e16'
const TEXT_MUTED = '#6b7a65'

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
    featuredImage: { url: string; altText: string | null; width: number | null; height: number | null } | null
    author: { name: string | null } | null
    category: { name: string; slug: string } | null
  }>
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  parentCategory?: { name: string; slug: string } | null
  seoSettings?: { siteName?: string; defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

// ─── Animal card ──────────────────────────────────────────────────────────────

function AnimalCard({ post, siteUrl }: { post: CategoryTemplateProps['posts'][number]; siteUrl: string }) {
  const url = getPostUrl(post)
  // Treat a short excerpt (≤ 70 chars) as a subtitle / scientific name equivalent
  const subtitle = post.excerpt && post.excerpt.length <= 70 ? post.excerpt : null
  return (
    <article
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 cursor-pointer"
      style={{
        backgroundColor: 'white',
        boxShadow: '0 4px 24px rgba(26,46,28,0.08)',
        border: '1px solid rgba(26,46,28,0.06)',
      }}
    >
      {/* Image */}
      <Link href={url} className="relative block overflow-hidden flex-shrink-0 bg-gray-100" style={{ height: '220px' }}>
        {post.featuredImage ? (
          <Image
            src={resolveImageUrl(post.featuredImage.url, siteUrl)}
            fill
            alt={post.featuredImage.altText ?? post.title}
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-5xl" style={{ backgroundColor: CREAM_WARM }}>🐾</div>
        )}
      </Link>

      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        {subtitle && (
          <p className="text-[11px] italic mb-1" style={{ color: TEXT_MUTED }}>
            {subtitle}
          </p>
        )}
        <h3
          className="font-bold leading-snug mb-3 transition-opacity group-hover:opacity-75"
          style={{ color: TEXT, fontFamily: '"Playfair Display", Georgia, serif', fontSize: '19px' }}
        >
          <Link href={url}>{post.title}</Link>
        </h3>
        {/* Tag pills */}
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {post.category && (
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: CREAM_WARM, color: FOREST }}
            >
              {post.category.name}
            </span>
          )}
          {post.author?.name && (
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: CREAM_WARM, color: TEXT_MUTED }}
            >
              {post.author.name}
            </span>
          )}
          {post.publishedAt && (
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: CREAM_WARM, color: TEXT_MUTED }}
            >
              {new Date(post.publishedAt).getFullYear()}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DivetCategoryTemplate({
  category,
  subcategories,
  posts,
  pagination,
  site,
  categories = [],
  parentCategory,
  seoSettings,
}: CategoryTemplateProps) {
  const { currentPage, totalPages, totalCount } = pagination
  const pages = buildPaginationItems(currentPage, totalPages)

  function pageHref(p: number) {
    return p === 1 ? `/${category.slug}` : `/${category.slug}?page=${p}`
  }

  return (
    <DivetLayout site={site} categories={categories} activeCategory={category.slug} seoSettings={seoSettings}>

      {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header
        className="relative overflow-hidden"
        style={{ backgroundColor: FOREST, backgroundImage: LEAF_PATTERN_SVG, padding: '60px 0 48px' }}
      >
        <div className="max-w-[1200px] mx-auto px-5">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 mb-6 text-sm" style={{ color: 'rgba(246,241,230,0.6)' }} aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors" style={{ color: 'rgba(246,241,230,0.6)' }}>Acasă</Link>
            <span aria-hidden="true">›</span>
            {parentCategory ? (
              <>
                <Link href={`/${parentCategory.slug}`} className="hover:text-white transition-colors" style={{ color: 'rgba(246,241,230,0.6)' }}>
                  {parentCategory.name}
                </Link>
                <span aria-hidden="true">›</span>
              </>
            ) : (
              <>
                <span style={{ color: 'rgba(246,241,230,0.6)' }}>Animale</span>
                <span aria-hidden="true">›</span>
              </>
            )}
            <span style={{ color: CREAM }}>{category.name}</span>
          </nav>

          {/* Title */}
          <h1
            className="mb-3"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 'clamp(36px, 5vw, 52px)',
              fontStyle: 'italic',
              fontWeight: 600,
              color: CREAM,
              lineHeight: 1.1,
            }}
          >
            {category.name}
          </h1>

          <p className="text-sm" style={{ color: 'rgba(246,241,230,0.65)' }}>
            {totalCount} {totalCount === 1 ? 'articol documentat' : 'articole documentate'}
            {(() => {
              const now    = new Date()
              const month  = now.toLocaleDateString('ro-RO', { month: 'long' })
              const year   = now.getFullYear()
              return ` · actualizat în ${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`
            })()}
          </p>
        </div>
      </header>

      {/* ══ FILTER PILLS ═════════════════════════════════════════════════════ */}
      {subcategories.length > 0 && (
        <div className="sticky top-[52px] z-30 overflow-x-auto" style={{ backgroundColor: 'white', borderBottom: `1px solid ${CREAM_WARM}` }}>
          <div className="flex gap-2 px-5 py-3 max-w-[1200px] mx-auto" style={{ minWidth: 'max-content' }}>
            <Link
              href={`/${category.slug}`}
              className="px-5 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap"
              style={{ backgroundColor: FOREST, color: CREAM }}
            >
              Toate
            </Link>
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/${category.slug}/${sub.slug}`}
                className="px-5 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap"
                style={{ border: `1px solid rgba(26,46,28,0.2)`, color: TEXT, backgroundColor: 'white' }}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ══ POSTS GRID ═══════════════════════════════════════════════════════ */}
      <section style={{ backgroundColor: CREAM_WARM, padding: '40px 0 60px' }}>
        <div className="max-w-[1200px] mx-auto px-5">

          {posts.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-lg font-semibold" style={{ color: TEXT }}>Niciun articol găsit</p>
              <p className="text-sm mt-2" style={{ color: TEXT_MUTED }}>Încearcă altă categorie sau filtru.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <AnimalCard key={post.id} post={post} siteUrl={site.siteUrl} />
              ))}
            </div>
          )}

          {/* ── Pagination ─────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 mt-14"
              aria-label="Paginare"
            >
              {/* Prev */}
              {currentPage > 1 ? (
                <Link
                  href={pageHref(currentPage - 1)}
                  className="flex items-center justify-center w-[38px] h-[38px] rounded-full transition-colors"
                  style={{ border: `1px solid rgba(26,46,28,0.2)`, color: TEXT }}
                  aria-label="Pagina anterioară"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </Link>
              ) : (
                <span className="flex items-center justify-center w-[38px] h-[38px] rounded-full opacity-30" style={{ border: `1px solid rgba(26,46,28,0.2)`, color: TEXT }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </span>
              )}

              {/* Page numbers */}
              {pages.map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="w-[38px] h-[38px] flex items-center justify-center text-sm" style={{ color: TEXT_MUTED }}>
                    ···
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={pageHref(p)}
                    className="flex items-center justify-center w-[38px] h-[38px] rounded-full text-sm font-semibold transition-colors"
                    style={
                      p === currentPage
                        ? { backgroundColor: FOREST, color: CREAM }
                        : { border: `1px solid rgba(26,46,28,0.2)`, color: TEXT }
                    }
                    aria-current={p === currentPage ? 'page' : undefined}
                  >
                    {p}
                  </Link>
                ),
              )}

              {/* Next */}
              {currentPage < totalPages ? (
                <Link
                  href={pageHref(currentPage + 1)}
                  className="flex items-center justify-center w-[38px] h-[38px] rounded-full transition-colors"
                  style={{ border: `1px solid rgba(26,46,28,0.2)`, color: TEXT }}
                  aria-label="Pagina următoare"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <span className="flex items-center justify-center w-[38px] h-[38px] rounded-full opacity-30" style={{ border: `1px solid rgba(26,46,28,0.2)`, color: TEXT }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              )}
            </nav>
          )}
        </div>
      </section>

    </DivetLayout>
  )
}
