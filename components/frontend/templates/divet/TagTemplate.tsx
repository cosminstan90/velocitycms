/**
 * DiVet — TagTemplate
 * Tag listing page wrapped in DivetLayout.
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

interface DivetTagTemplateProps {
  tag: {
    name: string
    slug: string
    description: string | null
    metaTitle: string | null
    metaDesc: string | null
  }
  posts: PostItem[]
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  seoSettings?: { defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

// ─── Mini post card ───────────────────────────────────────────────────────────

function PostCard({ post, siteUrl }: { post: PostItem; siteUrl: string }) {
  const url = post.category ? `/${post.category.slug}/${post.slug}` : `/blog/${post.slug}`
  return (
    <article
      className="group flex flex-col rounded-2xl overflow-hidden transition-shadow duration-300"
      style={{ backgroundColor: 'white', boxShadow: '0 4px 24px rgba(26,46,28,0.07)', border: '1px solid rgba(26,46,28,0.07)' }}
    >
      <Link href={url} className="relative block overflow-hidden flex-shrink-0" style={{ aspectRatio: '16/9', backgroundColor: CREAM_WARM }}>
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
          <Link
            href={`/${post.category.slug}`}
            className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block"
            style={{ color: GOLD }}
          >
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

function buildPages(current: number, total: number): (number | '...')[] {
  return Array.from({ length: total }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === total || Math.abs(p - current) <= 1)
    .reduce<(number | '...')[]>((acc, p, i, arr) => {
      if (i > 0 && (arr[i - 1] as number) < p - 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DivetTagTemplate({
  tag,
  posts,
  pagination,
  site,
  categories = [],
  seoSettings,
}: DivetTagTemplateProps) {
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

  return (
    <DivetLayout site={site} categories={categories} seoSettings={seoSettings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      {/* Header */}
      <section style={{ backgroundColor: FOREST, padding: '56px 0 48px' }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <nav className="mb-5 flex items-center gap-2 text-sm" style={{ color: 'rgba(246,241,230,0.5)' }} aria-label="Breadcrumb">
            <Link href="/" style={{ color: 'rgba(246,241,230,0.5)' }} className="hover:opacity-100 transition-opacity">{site.siteName}</Link>
            <span aria-hidden="true">›</span>
            <span style={{ color: CREAM }}># {tag.name}</span>
          </nav>
          <div className="flex flex-wrap items-baseline gap-4 mb-3">
            <h1
              className="leading-tight"
              style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, color: CREAM }}
            >
              #{tag.name}
            </h1>
            <span
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ backgroundColor: GOLD, color: 'white' }}
            >
              {totalCount} {totalCount === 1 ? 'articol' : 'articole'}
            </span>
          </div>
          {(tag.description || tag.metaDesc) && (
            <p className="max-w-2xl text-sm leading-relaxed" style={{ color: 'rgba(246,241,230,0.7)', fontFamily: '"Lora", Georgia, serif' }}>
              {tag.description ?? tag.metaDesc}
            </p>
          )}
        </div>
      </section>

      {/* Posts */}
      <div className="max-w-[1200px] mx-auto px-5 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-base" style={{ color: TEXT_MUTED }}>Niciun articol cu eticheta &ldquo;{tag.name}&rdquo;.</p>
            <Link href="/" className="mt-4 inline-block text-sm font-semibold underline" style={{ color: MOSS }}>← Înapoi acasă</Link>
          </div>
        ) : (
          <>
            <p className="text-sm mb-6" style={{ color: TEXT_MUTED }}>
              Pagina <strong style={{ color: TEXT }}>{currentPage}</strong>
              {totalPages > 1 && <> din <strong style={{ color: TEXT }}>{totalPages}</strong></>}
              {' '}· <strong style={{ color: TEXT }}>{totalCount}</strong> articole
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => <PostCard key={p.id} post={p} siteUrl={site.siteUrl} />)}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Paginare" className="mt-12 flex items-center justify-center gap-2 flex-wrap">
                {currentPage > 1 && (
                  <Link
                    href={`/eticheta/${tag.slug}?page=${currentPage - 1}`}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{ backgroundColor: 'white', border: `1px solid rgba(26,46,28,0.15)`, color: TEXT }}
                  >
                    ← Anterior
                  </Link>
                )}
                {buildPages(currentPage, totalPages).map((p, i) =>
                  p === '...' ? (
                    <span key={`e${i}`} className="px-2 text-sm" style={{ color: TEXT_MUTED }}>…</span>
                  ) : (
                    <Link
                      key={p}
                      href={`/eticheta/${tag.slug}?page=${p}`}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-colors"
                      style={p === currentPage
                        ? { backgroundColor: FOREST, color: CREAM }
                        : { backgroundColor: 'white', border: `1px solid rgba(26,46,28,0.15)`, color: TEXT }}
                      aria-current={p === currentPage ? 'page' : undefined}
                    >
                      {p}
                    </Link>
                  )
                )}
                {currentPage < totalPages && (
                  <Link
                    href={`/eticheta/${tag.slug}?page=${currentPage + 1}`}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                    style={{ backgroundColor: 'white', border: `1px solid rgba(26,46,28,0.15)`, color: TEXT }}
                  >
                    Următor →
                  </Link>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </DivetLayout>
  )
}
