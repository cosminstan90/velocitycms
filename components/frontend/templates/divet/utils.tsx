import Image from 'next/image'
import Link from 'next/link'

export interface NavCategoryItem {
  id: string
  name: string
  slug: string
  description?: string | null
  _count?: { posts: number }
}

export interface StoryPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | string | null
  featuredImage: {
    url: string
    altText: string | null
    width?: number | null
    height?: number | null
  } | null
  author: { name: string | null } | null
  category: { name: string; slug: string } | null
}

export function resolveImageUrl(url: string, siteUrl: string): string {
  if (url.startsWith('/')) return `${siteUrl}${url}`
  return url
}

export function getPostUrl(post: { slug: string; category: { slug: string } | null }): string {
  if (post.category) return `/${post.category.slug}/${post.slug}`
  return `/blog/${post.slug}`
}

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

export function getReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 210))
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

export function BrandMark({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg viewBox="0 0 72 72" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="divet-mark" x1="14" x2="58" y1="14" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--dv-accent)" />
          <stop offset="1" stopColor="var(--dv-forest)" />
        </linearGradient>
      </defs>
      <rect x="6" y="6" width="60" height="60" rx="22" fill="url(#divet-mark)" />
      <path d="M23 43c0-6.1 5.8-11 13-11s13 4.9 13 11c0 4.8-3.8 8.6-8.4 8.6H31.4C26.8 51.6 23 47.8 23 43Z" fill="#FFF6EA" />
      <circle cx="26.5" cy="27.5" r="4.7" fill="#FFF6EA" />
      <circle cx="35.5" cy="23.5" r="4.7" fill="#FFF6EA" />
      <circle cx="45.5" cy="27.5" r="4.7" fill="#FFF6EA" />
      <path d="M43 17c6 2 11 8 11 16-7 0-13-4.8-14-11.7 1.1-2 1.8-3 3-4.3Z" fill="#DDF0E2" opacity=".88" />
    </svg>
  )
}

function StoryFallback({ title, compact = false }: { title: string; compact?: boolean }) {
  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background:
          'radial-gradient(circle at top left, var(--dv-accent-soft), transparent 34%), radial-gradient(circle at bottom right, var(--dv-forest-soft), transparent 36%), linear-gradient(135deg, var(--dv-bg-strong), var(--dv-surface-strong))',
      }}
    >
      <div className="flex items-center gap-3 rounded-full px-4 py-3 text-[color:var(--dv-contrast)]">
        <BrandMark className={compact ? 'h-9 w-9' : 'h-11 w-11'} />
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-[color:var(--dv-muted)]">DiVet</p>
          <p className="max-w-[10rem] text-sm font-semibold leading-tight">{title}</p>
        </div>
      </div>
    </div>
  )
}

export function StoryCard({
  post,
  siteUrl,
  variant = 'stacked',
  priority = false,
  showCategory = true,
}: {
  post: StoryPost
  siteUrl: string
  variant?: 'stacked' | 'row'
  priority?: boolean
  showCategory?: boolean
}) {
  const url = getPostUrl(post)
  const meta = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--dv-muted)]">
      {post.author?.name && <span>{post.author.name}</span>}
      {post.publishedAt && (
        <time dateTime={new Date(post.publishedAt).toISOString()}>{formatDate(post.publishedAt)}</time>
      )}
    </div>
  )

  if (variant === 'row') {
    return (
      <article className="group divet-card overflow-hidden rounded-[28px] transition-transform duration-300 hover:-translate-y-1">
        <Link href={url} className="grid gap-0 md:grid-cols-[220px_minmax(0,1fr)]">
          <div className="relative min-h-[220px] overflow-hidden md:min-h-full">
            {post.featuredImage ? (
              <Image
                src={resolveImageUrl(post.featuredImage.url, siteUrl)}
                fill
                alt={post.featuredImage.altText ?? post.title}
                sizes="(max-width: 768px) 100vw, 240px"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority={priority}
              />
            ) : (
              <StoryFallback title={post.title} compact />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black/10" />
          </div>
          <div className="flex min-w-0 flex-col justify-between gap-4 p-6">
            <div>
              {showCategory && post.category && (
                <span className="divet-kicker text-[11px] font-semibold">{post.category.name}</span>
              )}
              <h3 className="divet-display mt-3 text-2xl leading-tight text-[color:var(--dv-contrast)]">
                {post.title}
              </h3>
              {post.excerpt && (
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                  {post.excerpt}
                </p>
              )}
            </div>
            {meta}
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className="group divet-card overflow-hidden rounded-[28px] transition-transform duration-300 hover:-translate-y-1">
      <Link href={url} className="flex h-full flex-col">
        <div className="relative aspect-[16/11] overflow-hidden">
          {post.featuredImage ? (
            <Image
              src={resolveImageUrl(post.featuredImage.url, siteUrl)}
              fill
              alt={post.featuredImage.altText ?? post.title}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={priority}
            />
          ) : (
            <StoryFallback title={post.title} />
          )}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/25 to-transparent" />
          {showCategory && post.category && (
            <span className="absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur"
              style={{ background: 'color-mix(in srgb, var(--dv-forest) 72%, transparent)' }}>
              {post.category.name}
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-4 p-6">
          <div>
            <h3 className="divet-display text-[1.65rem] leading-tight text-[color:var(--dv-contrast)]">
              {post.title}
            </h3>
            {post.excerpt && (
              <p className="mt-3 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                {post.excerpt}
              </p>
            )}
          </div>
          <div className="mt-auto border-t border-[color:var(--dv-border)] pt-4">{meta}</div>
        </div>
      </Link>
    </article>
  )
}
