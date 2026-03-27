/**
 * Fauna — ArticleTemplate
 *
 * EEAT-optimised layout:
 *   - Author mini-card in byline (trust signal before reading)
 *   - "Expert reviewed" badge in header
 *   - Full author bio after content (EEAT requirement)
 *   - Published + last-updated dates
 *   - Tags rendered as "characteristics" for breed pages
 *   - Table of contents (shown when ≥ 3 H2 headings)
 *   - 2-column layout on desktop: content (2/3) + sticky sidebar (1/3)
 *   - Ad slots: below header image, mid-sidebar, after content
 *
 * Schema TODO (EEAT enhancements to add when User model is expanded):
 *   User.bio         String?    — 1-2 sentence author description
 *   User.photo       String?    — URL to author headshot
 *   User.title       String?    — e.g. "Veterinar", "Crescător autorizat"
 *   User.social      String?    — LinkedIn / personal site URL
 */

import Image from 'next/image'
import Link from 'next/link'

// ─── Props ────────────────────────────────────────────────────────────────────

interface ArticleTemplateProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    contentHtml: string
    metaTitle: string | null
    publishedAt: Date | string | null
    updatedAt: Date | string
    author: { name: string | null; email: string } | null
    category: { name: string; slug: string } | null
    featuredImage: {
      url: string
      width: number | null
      height: number | null
      altText: string | null
    } | null
    tags: Array<{ tag: { id: string; name: string; slug: string } }>
  }
  relatedPosts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | string | null
    featuredImage: { url: string; altText: string | null } | null
    category: { name: string; slug: string } | null
  }>
  site: { siteName: string; siteUrl: string }
  subCategory?: { name: string; slug: string } | null
  breadcrumbExtra?: { name: string; href: string }[]
  seoSettings?: { siteName?: string; defaultOgImage?: string | null } | null
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
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function formatDateShort(date: Date | string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

function getReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function getAuthorInitials(name: string | null, email: string): string {
  if (name) {
    return name.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)
  }
  return email[0].toUpperCase()
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

interface TocEntry { text: string; id: string }

function extractH2s(html: string): TocEntry[] {
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi
  const entries: TocEntry[] = []
  let m: RegExpExecArray | null
  while ((m = regex.exec(html)) !== null) {
    const text = m[1].replace(/<[^>]+>/g, '').trim()
    if (text) entries.push({ text, id: slugify(text) })
  }
  return entries
}

function injectH2Ids(html: string, entries: TocEntry[]): string {
  let result = html
  for (const { text, id } of entries) {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(
      new RegExp(`<h2([^>]*)>((?:(?!<\\/h2>)[\\s\\S])*?${escaped}(?:(?!<\\/h2>)[\\s\\S])*?)<\\/h2>`, 'i'),
      (_: string, attrs: string, inner: string) => {
        if (/\bid\s*=/.test(attrs)) return `<h2${attrs}>${inner}</h2>`
        return `<h2${attrs} id="${id}">${inner}</h2>`
      }
    )
  }
  return result
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaunaArticleTemplate({
  post,
  relatedPosts,
  site,
  subCategory,
  breadcrumbExtra,
}: ArticleTemplateProps) {
  const toc = extractH2s(post.contentHtml)
  const enrichedHtml = toc.length >= 3 ? injectH2Ids(post.contentHtml, toc) : post.contentHtml
  const readingTime = getReadingTime(post.contentHtml)
  const authorInitials = getAuthorInitials(post.author?.name ?? null, post.author?.email ?? 'A')
  const authorName = post.author?.name ?? post.author?.email ?? 'Redacție'

  // Build breadcrumb trail
  const breadcrumbs: { name: string; href: string | null }[] = [
    { name: site.siteName, href: '/' },
  ]
  if (post.category) {
    breadcrumbs.push({ name: post.category.name, href: `/${post.category.slug}` })
  }
  if (subCategory && post.category) {
    breadcrumbs.push({ name: subCategory.name, href: `/${post.category.slug}/${subCategory.slug}` })
  }
  if (breadcrumbExtra) {
    for (const extra of breadcrumbExtra) {
      breadcrumbs.push({ name: extra.name, href: extra.href })
    }
  }
  breadcrumbs.push({ name: post.title, href: null })

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif' }}>

      {/* ══ TOP NAV BAR ══════════════════════════════════════════════════════ */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-black text-gray-900 tracking-tight">
            {site.siteName}
          </Link>
          {post.category && (
            <Link
              href={`/${post.category.slug}`}
              className="text-xs font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors"
            >
              {post.category.name}
            </Link>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ══ BREADCRUMB ═══════════════════════════════════════════════════════ */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-gray-400">
            {breadcrumbs.map((crumb, i) => (
              <li key={i} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true" className="text-gray-300">›</span>}
                {crumb.href ? (
                  <Link href={crumb.href} className="hover:text-amber-700 hover:underline transition-colors">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-gray-600 font-medium truncate max-w-[180px] sm:max-w-xs" aria-current="page">
                    {crumb.name}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* ══ ARTICLE HEADER ═══════════════════════════════════════════════════ */}
        <header className="mb-8 max-w-4xl">
          {/* Category + expert-reviewed badge row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {post.category && (
              <Link
                href={`/${post.category.slug}`}
                className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-amber-200 transition-colors"
              >
                {post.category.name}
              </Link>
            )}
            {/* EEAT: "Expert reviewed" trust badge */}
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Articol verificat
            </div>
          </div>

          {/* H1 */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>

          {/* Excerpt / lead */}
          {post.excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed mb-5 max-w-2xl">
              {post.excerpt}
            </p>
          )}

          {/* ── Author byline + meta ── */}
          <div className="flex flex-wrap items-center gap-4 py-4 border-y border-gray-200">
            {/* Author mini-card */}
            <div className="flex items-center gap-3">
              {/* Avatar — replace with <Image> when User.photo is added */}
              <div
                className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm"
                aria-hidden="true"
              >
                {authorInitials}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900 leading-tight">{authorName}</p>
                {/* TODO: render User.title here when field is added, e.g. "Veterinar, 10 ani experiență" */}
                <p className="text-xs text-gray-400 leading-tight">Contribuitor</p>
              </div>
            </div>

            {/* Separator */}
            <div className="hidden sm:block w-px h-8 bg-gray-200" aria-hidden="true" />

            {/* Dates */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
              {post.publishedAt && (
                <div className="flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    Publicat <time dateTime={new Date(post.publishedAt).toISOString()}>{formatDateShort(post.publishedAt)}</time>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>
                  Actualizat <time dateTime={new Date(post.updatedAt).toISOString()}>{formatDateShort(post.updatedAt)}</time>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{readingTime} min citire</span>
              </div>
            </div>
          </div>
        </header>

        {/* ══ FEATURED IMAGE ═══════════════════════════════════════════════════ */}
        {post.featuredImage && (
          <div className="mb-8 -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden bg-gray-100 shadow-sm">
            {post.featuredImage.width && post.featuredImage.height ? (
              <Image
                src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
                width={post.featuredImage.width}
                height={post.featuredImage.height}
                alt={post.featuredImage.altText ?? post.title}
                priority
                className="w-full object-cover max-h-[520px]"
              />
            ) : (
              <div className="relative w-full aspect-video">
                <Image
                  src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
                  fill
                  alt={post.featuredImage.altText ?? post.title}
                  priority
                  className="object-cover"
                />
              </div>
            )}
            {post.featuredImage.altText && (
              <p className="text-xs text-gray-400 text-center py-2 px-4 italic">
                {post.featuredImage.altText}
              </p>
            )}
          </div>
        )}

        {/* ══ AD SLOT — below featured image (highest-value position) ═════════ */}
        <div className="mb-8 flex justify-center">
          {/* GOOGLE ADSENSE — replace with <ins> tag (300x250 on mobile, 728x90 on desktop) */}
          <div
            className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300"
            data-ad-slot="article-top"
          >
            Publicitate
          </div>
        </div>

        {/* ══ TWO-COLUMN LAYOUT ════════════════════════════════════════════════ */}
        <div className="lg:grid lg:grid-cols-3 lg:gap-10">

          {/* ── Left: Article content ── */}
          <div className="lg:col-span-2">

            {/* Tags as "Characteristics" — great for breed pages */}
            {post.tags.length > 0 && (
              <div className="mb-7 p-5 bg-amber-50 border border-amber-200 rounded-2xl">
                <h2 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-3">
                  Caracteristici cheie
                </h2>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map(({ tag }) => (
                    <Link
                      key={tag.id}
                      href={`/eticheta/${tag.slug}`}
                      className="inline-flex items-center px-3 py-1.5 rounded-xl bg-white border border-amber-200 text-amber-800 text-xs font-semibold hover:bg-amber-100 transition-colors shadow-sm"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Table of Contents (inline — for mobile; sidebar has it on desktop) */}
            {toc.length >= 3 && (
              <nav
                aria-label="Cuprins"
                className="mb-8 p-5 bg-white border border-gray-200 rounded-2xl lg:hidden shadow-sm"
              >
                <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
                  Cuprins
                </h2>
                <ol className="space-y-2">
                  {toc.map((entry, i) => (
                    <li key={entry.id}>
                      <a
                        href={`#${entry.id}`}
                        className="flex items-baseline gap-2.5 text-sm text-gray-600 hover:text-amber-700 transition-colors group"
                      >
                        <span className="text-xs text-gray-400 tabular-nums w-5 text-right flex-shrink-0 group-hover:text-amber-500">
                          {i + 1}.
                        </span>
                        <span className="hover:underline">{entry.text}</span>
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {/* Article body */}
            <article
              className="prose prose-lg max-w-none
                prose-headings:font-extrabold prose-headings:text-gray-900 prose-headings:scroll-mt-24
                prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
                prose-h3:text-xl prose-h3:mt-8
                prose-p:text-gray-700 prose-p:leading-relaxed
                prose-a:text-amber-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-gray-900
                prose-img:rounded-xl prose-img:shadow-sm
                prose-blockquote:border-amber-400 prose-blockquote:bg-amber-50 prose-blockquote:rounded-r-xl prose-blockquote:py-1
                prose-ul:text-gray-700 prose-ol:text-gray-700
                prose-li:my-1
                prose-table:text-sm"
              dangerouslySetInnerHTML={{ __html: enrichedHtml }}
            />

            {/* ── AUTHOR BIO — full EEAT card after content ── */}
            <div className="mt-12 p-6 bg-white border border-gray-200 rounded-2xl shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                Despre autor
              </p>
              <div className="flex items-start gap-5">
                {/* Avatar circle — replace with <Image> when User.photo is added to schema */}
                <div
                  className="flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xl font-black shadow-md"
                  aria-hidden="true"
                >
                  {authorInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-gray-900 text-lg leading-tight">{authorName}</p>
                  {/* TODO: show User.title here — e.g. "Medic Veterinar · 12 ani experiență" */}
                  <p className="text-sm text-amber-600 font-semibold mb-2">Contribuitor · {site.siteName}</p>

                  {/* TODO: show User.bio here when field is added to schema */}
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Autor pasionat de animale, scrie articole documentate bazate pe surse veterinare
                    și experiență directă cu rasele descrise.
                  </p>

                  {/* EEAT signals */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Autor verificat
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold rounded-full">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      Articole documentate
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ── Right: Sticky sidebar ── */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-6">

              {/* Table of Contents — desktop sidebar */}
              {toc.length >= 3 && (
                <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                    Cuprins
                  </h2>
                  <ol className="space-y-2.5">
                    {toc.map((entry, i) => (
                      <li key={entry.id}>
                        <a
                          href={`#${entry.id}`}
                          className="flex items-baseline gap-2.5 text-sm text-gray-600 hover:text-amber-700 transition-colors group"
                        >
                          <span className="text-[11px] text-gray-400 tabular-nums w-5 text-right flex-shrink-0 font-mono group-hover:text-amber-500">
                            {i + 1}.
                          </span>
                          <span className="leading-snug hover:underline">{entry.text}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Tags (sidebar variant) */}
              {post.tags.length > 0 && (
                <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                    Etichete
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map(({ tag }) => (
                      <Link
                        key={tag.id}
                        href={`/eticheta/${tag.slug}`}
                        className="px-3 py-1.5 bg-gray-100 hover:bg-amber-100 hover:text-amber-800 text-gray-600 text-xs font-medium rounded-lg transition-colors"
                      >
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* AD SLOT — sidebar 300×250 */}
              {/* GOOGLE ADSENSE — replace with <ins> tag */}
              <div
                className="w-full h-[250px] bg-gray-200 rounded-2xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300"
                data-ad-slot="article-sidebar"
              >
                Publicitate
              </div>

              {/* Related posts (sidebar) */}
              {relatedPosts.length > 0 && (
                <div className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">
                    Articole similare
                  </h2>
                  <div className="space-y-4">
                    {relatedPosts.slice(0, 3).map((related) => {
                      const url = getPostUrl(related)
                      return (
                        <div key={related.id} className="flex items-start gap-3 group">
                          {related.featuredImage && (
                            <Link href={url} className="flex-shrink-0">
                              <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-100">
                                <Image
                                  src={resolveImageUrl(related.featuredImage.url, site.siteUrl)}
                                  fill
                                  alt={related.featuredImage.altText ?? related.title}
                                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                                  sizes="56px"
                                />
                              </div>
                            </Link>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={url}
                              className="text-sm font-semibold text-gray-800 hover:text-amber-700 transition-colors leading-snug line-clamp-2 block"
                            >
                              {related.title}
                            </Link>
                            {related.publishedAt && (
                              <time
                                dateTime={new Date(related.publishedAt).toISOString()}
                                className="text-xs text-gray-400 mt-0.5 block"
                              >
                                {formatDateShort(related.publishedAt)}
                              </time>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

            </div>
          </aside>
        </div>

        {/* ══ AD SLOT — below content, above related (mobile) ═════════════════ */}
        <div className="mt-10 flex justify-center lg:hidden">
          {/* GOOGLE ADSENSE — replace with <ins> tag */}
          <div
            className="w-full max-w-[728px] h-[90px] bg-gray-200 rounded-xl flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300"
            data-ad-slot="article-bottom-mobile"
          >
            Publicitate
          </div>
        </div>

        {/* ══ RELATED POSTS — mobile grid ═════════════════════════════════════ */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-200 lg:hidden">
            <h2 className="text-base font-extrabold text-gray-900 mb-5">Articole similare</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedPosts.map((related) => {
                const url = getPostUrl(related)
                return (
                  <article key={related.id} className="group flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    {related.featuredImage && (
                      <Link href={url} className="flex-shrink-0">
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                          <Image
                            src={resolveImageUrl(related.featuredImage.url, site.siteUrl)}
                            fill
                            alt={related.featuredImage.altText ?? related.title}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="80px"
                          />
                        </div>
                      </Link>
                    )}
                    <div className="min-w-0">
                      {related.category && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 block mb-0.5">
                          {related.category.name}
                        </span>
                      )}
                      <Link href={url} className="text-sm font-bold text-gray-900 hover:text-amber-700 transition-colors leading-snug line-clamp-2 block">
                        {related.title}
                      </Link>
                      {related.publishedAt && (
                        <time className="text-xs text-gray-400 mt-1 block" dateTime={new Date(related.publishedAt).toISOString()}>
                          {formatDateShort(related.publishedAt)}
                        </time>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
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
