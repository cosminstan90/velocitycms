/**
 * DiVet — AuthorTemplate
 * Author profile page wrapped in DivetLayout.
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

interface DivetAuthorTemplateProps {
  author: {
    name: string | null
    slug: string | null
    title: string | null
    bio: string | null
    photo: string | null
    website: string | null
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

export default function DivetAuthorTemplate({
  author,
  posts,
  pagination,
  site,
  categories = [],
  seoSettings,
}: DivetAuthorTemplateProps) {
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
        ...(author.photo && { image: { '@type': 'ImageObject', url: resolveImageUrl(author.photo, site.siteUrl) } }),
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

  return (
    <DivetLayout site={site} categories={categories} seoSettings={seoSettings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      <div className="max-w-[1200px] mx-auto px-5 py-10">

        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-sm" style={{ color: TEXT_MUTED }} aria-label="Breadcrumb">
          <Link href="/" style={{ color: TEXT_MUTED }} className="hover:underline">{site.siteName}</Link>
          <span aria-hidden="true">›</span>
          <span style={{ color: TEXT }} aria-current="page">{authorName}</span>
        </nav>

        {/* Author card */}
        <div className="mb-12 p-6 sm:p-8 rounded-2xl" style={{ backgroundColor: CREAM_WARM, border: '1px solid rgba(26,46,28,0.08)' }}>
          <div className="flex flex-col sm:flex-row items-start gap-6">

            {/* Photo */}
            <div className="flex-shrink-0 w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden" style={{ border: `2px solid rgba(26,46,28,0.1)` }}>
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
                  className="w-full h-full flex items-center justify-center text-2xl font-bold"
                  style={{ backgroundColor: FOREST, color: CREAM }}
                  aria-hidden="true"
                >
                  {initials}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1
                className="leading-tight mb-1"
                style={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 700, color: TEXT }}
              >
                {authorName}
              </h1>
              {author.title && (
                <p className="text-sm font-semibold mb-3" style={{ color: GOLD }}>{author.title}</p>
              )}
              {author.bio && (
                <p className="text-sm leading-relaxed max-w-xl" style={{ color: TEXT_MUTED, fontFamily: '"Lora", Georgia, serif' }}>
                  {author.bio}
                </p>
              )}

              {/* Badges */}
              <div className="flex flex-wrap gap-2 mt-4">
                <span
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'rgba(74,138,74,0.12)', color: MOSS, border: `1px solid rgba(74,138,74,0.2)` }}
                >
                  ✓ Autor verificat
                </span>
                <span
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'white', color: TEXT_MUTED, border: '1px solid rgba(26,46,28,0.1)' }}
                >
                  📝 {totalCount} {totalCount === 1 ? 'articol publicat' : 'articole publicate'}
                </span>
                {author.website && (
                  <a
                    href={author.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold transition-opacity hover:opacity-70"
                    style={{ backgroundColor: 'white', color: TEXT_MUTED, border: '1px solid rgba(26,46,28,0.1)' }}
                  >
                    🌐 Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Articles section */}
        <h2
          className="text-xl font-bold mb-6"
          style={{ fontFamily: '"Playfair Display", Georgia, serif', color: TEXT }}
        >
          Articole de {authorName}
        </h2>

        {posts.length === 0 ? (
          <div className="text-center py-20" style={{ color: TEXT_MUTED }}>
            <p>Niciun articol publicat încă.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((p) => <PostCard key={p.id} post={p} siteUrl={site.siteUrl} />)}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Paginare" className="mt-12 flex items-center justify-center gap-2 flex-wrap">
                {currentPage > 1 && (
                  <Link
                    href={`/autor/${authorSlug}?page=${currentPage - 1}`}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold"
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
                      href={`/autor/${authorSlug}?page=${p}`}
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold"
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
                    href={`/autor/${authorSlug}?page=${currentPage + 1}`}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold"
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
