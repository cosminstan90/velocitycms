/**
 * Fauna template shared utilities
 *
 * Single source of truth for helpers and UI primitives used across all fauna
 * template files. Import from here instead of duplicating per-template.
 */

import Image from 'next/image'
import Link from 'next/link'

// ─── URL helpers ──────────────────────────────────────────────────────────────

export function resolveImageUrl(url: string, siteUrl: string): string {
  if (url.startsWith('/')) return `${siteUrl}${url}`
  return url
}

export function getPostUrl(post: { slug: string; category: { slug: string } | null }): string {
  if (post.category) return `/${post.category.slug}/${post.slug}`
  return `/blog/${post.slug}`
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateLong(date: Date | string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

// ─── Text helpers ─────────────────────────────────────────────────────────────

export function getReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export function getAuthorInitials(name: string | null, email: string): string {
  if (name) return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
  return email[0].toUpperCase()
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export function buildPaginationItems(
  currentPage: number,
  totalPages: number,
): (number | '...')[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
    .reduce<(number | '...')[]>((acc, p, i, arr) => {
      if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])
}

// ─── Design tokens ────────────────────────────────────────────────────────────

/** Cycling colour palette for category/subcategory cards */
export const CAT_COLORS = [
  { card: 'bg-amber-50  border-amber-200  hover:bg-amber-100',   badge: 'bg-amber-500',   text: 'text-amber-900'   },
  { card: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100', badge: 'bg-emerald-600', text: 'text-emerald-900'  },
  { card: 'bg-sky-50    border-sky-200    hover:bg-sky-100',     badge: 'bg-sky-500',     text: 'text-sky-900'     },
  { card: 'bg-violet-50  border-violet-200  hover:bg-violet-100',  badge: 'bg-violet-600',  text: 'text-violet-900'  },
  { card: 'bg-rose-50   border-rose-200   hover:bg-rose-100',    badge: 'bg-rose-500',    text: 'text-rose-900'    },
  { card: 'bg-orange-50  border-orange-200  hover:bg-orange-100',  badge: 'bg-orange-500',  text: 'text-orange-900'  },
  { card: 'bg-teal-50   border-teal-200   hover:bg-teal-100',    badge: 'bg-teal-600',    text: 'text-teal-900'    },
  { card: 'bg-indigo-50  border-indigo-200  hover:bg-indigo-100',  badge: 'bg-indigo-500',  text: 'text-indigo-900'  },
]

// ─── Shared post types ────────────────────────────────────────────────────────

export interface PostCardPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | string | null
  featuredImage: { url: string; altText: string | null; width?: number | null; height?: number | null } | null
  author: { name: string | null } | null
  category: { name: string; slug: string } | null
}

// ─── PostCard component ───────────────────────────────────────────────────────

/**
 * Standard card used across Homepage, Category and Tag pages.
 * variant="wide" renders the horizontal compact layout.
 */
export function PostCard({
  post,
  siteUrl,
  variant = 'default',
  showCategory = true,
}: {
  post: PostCardPost
  siteUrl: string
  variant?: 'default' | 'wide'
  showCategory?: boolean
}) {
  const url = getPostUrl(post)

  if (variant === 'wide') {
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
          {showCategory && post.category && (
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

  return (
    <article className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300">
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
        {showCategory && post.category && (
          <span className="absolute top-3 left-3 px-2.5 py-1 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
            {post.category.name}
          </span>
        )}
      </Link>
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
            <time dateTime={new Date(post.publishedAt).toISOString()}>{formatDate(post.publishedAt)}</time>
          )}
        </div>
      </div>
    </article>
  )
}

// ─── FeaturedPostCard ─────────────────────────────────────────────────────────

/** Large hero-style card — first post on category / homepage grid */
export function FeaturedPostCard({
  post,
  siteUrl,
}: {
  post: PostCardPost
  siteUrl: string
}) {
  const url = getPostUrl(post)
  return (
    <Link
      href={url}
      className="group grid md:grid-cols-2 gap-6 bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow duration-300"
    >
      <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: '16/10', minHeight: '220px' }}>
        {post.featuredImage ? (
          <Image
            src={resolveImageUrl(post.featuredImage.url, siteUrl)}
            fill
            alt={post.featuredImage.altText ?? post.title}
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
          {post.title}
        </h2>
        {post.excerpt && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto">
          {post.author?.name && <span className="font-semibold text-gray-600">{post.author.name}</span>}
          {post.publishedAt && post.author?.name && <span className="w-1 h-1 rounded-full bg-gray-300" aria-hidden="true" />}
          {post.publishedAt && (
            <time dateTime={new Date(post.publishedAt).toISOString()}>{formatDate(post.publishedAt)}</time>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── AdSlot ───────────────────────────────────────────────────────────────────

type AdSize = 'leaderboard' | 'rectangle' | 'mobile-banner'

const AD_DIMENSIONS: Record<AdSize, { w: string; h: string; label: string }> = {
  leaderboard:    { w: 'max-w-[728px]', h: 'h-[90px]',  label: '728×90' },
  rectangle:      { w: 'max-w-[300px]', h: 'h-[250px]', label: '300×250' },
  'mobile-banner':{ w: 'max-w-[320px]', h: 'h-[50px]',  label: '320×50' },
}

export function AdSlot({
  slot,
  size = 'leaderboard',
  className = '',
}: {
  slot: string
  size?: AdSize
  className?: string
}) {
  const { w, h, label } = AD_DIMENSIONS[size]
  return (
    <div className={`flex justify-center ${className}`}>
      {/* Replace this div with your <ins class="adsbygoogle"> tag */}
      <div
        className={`w-full ${w} ${h} bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300`}
        data-ad-slot={slot}
        aria-label={`Publicitate ${label}`}
        role="complementary"
      >
        Publicitate
      </div>
    </div>
  )
}
