import Image from 'next/image'
import Link from 'next/link'

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
    featuredImage: { url: string; width: number | null; height: number | null; altText: string | null } | null
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

function slugifyId(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function formatDate(date: Date | string): string {
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
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email[0].toUpperCase()
}

interface H2Entry {
  text: string
  id: string
}

function extractH2s(html: string): H2Entry[] {
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi
  const entries: H2Entry[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const rawText = match[1].replace(/<[^>]+>/g, '').trim()
    if (rawText) {
      entries.push({ text: rawText, id: slugifyId(rawText) })
    }
  }
  return entries
}

function injectH2Ids(html: string, h2s: H2Entry[]): string {
  let result = html
  for (const { text, id } of h2s) {
    // Match h2 tags that contain this text (strip inner tags for matching)
    result = result.replace(
      new RegExp(
        `<h2([^>]*)>((?:(?!<\/h2>)[\s\S])*?${escapeRegex(text)}(?:(?!<\/h2>)[\s\S])*?)<\/h2>`,
        'i'
      ),
      (_, attrs: string, inner: string) => {
        if (/\bid\s*=/.test(attrs)) return `<h2${attrs}>${inner}</h2>`
        return `<h2${attrs} id="${id}">${inner}</h2>`
      }
    )
  }
  return result
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function resolveImageUrl(url: string, siteUrl: string): string {
  if (url.startsWith('/')) return `${siteUrl}${url}`
  return url
}

function getRelatedPostUrl(post: { slug: string; category: { name: string; slug: string } | null }): string {
  if (post.category) return `/${post.category.slug}/${post.slug}`
  return `/blog/${post.slug}`
}

export default function ArticleTemplate({
  post,
  relatedPosts,
  site,
  subCategory,
  breadcrumbExtra,
}: ArticleTemplateProps) {
  const h2s = extractH2s(post.contentHtml)
  const enrichedHtml = h2s.length >= 3 ? injectH2Ids(post.contentHtml, h2s) : post.contentHtml
  const readingTime = getReadingTime(post.contentHtml)
  const authorInitials = getAuthorInitials(post.author?.name ?? null, post.author?.email ?? '')

  const breadcrumbs: { name: string; href: string | null }[] = [
    { name: site.siteName, href: '/' },
  ]
  if (post.category) {
    breadcrumbs.push({ name: post.category.name, href: `/${post.category.slug}` })
  }
  if (subCategory) {
    breadcrumbs.push({
      name: subCategory.name,
      href: post.category ? `/${post.category.slug}/${subCategory.slug}` : `/${subCategory.slug}`,
    })
  }
  if (breadcrumbExtra) {
    for (const extra of breadcrumbExtra) {
      breadcrumbs.push({ name: extra.name, href: extra.href })
    }
  }
  breadcrumbs.push({ name: post.title, href: null })

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
            {breadcrumbs.map((crumb, index) => (
              <li key={index} className="flex items-center gap-1">
                {index > 0 && <span aria-hidden="true" className="text-gray-400">›</span>}
                {crumb.href !== null ? (
                  <Link href={crumb.href} className="hover:text-gray-700 hover:underline transition-colors">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className="text-gray-700 font-medium truncate max-w-[200px]" aria-current="page">
                    {crumb.name}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Category label */}
        {post.category && (
          <div className="mb-3">
            <Link
              href={`/${post.category.slug}`}
              className="text-xs font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors"
            >
              {post.category.name}
            </Link>
          </div>
        )}

        {/* H1 Title */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
          {post.title}
        </h1>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">{post.excerpt}</p>
        )}

        {/* Author byline */}
        <div className="flex items-center gap-3 mb-6 py-4 border-y border-gray-100">
          {/* Avatar placeholder */}
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-semibold"
            aria-hidden="true"
          >
            {authorInitials}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-gray-500">
            {post.author?.name && (
              <span className="font-medium text-gray-700">{post.author.name}</span>
            )}
            {post.publishedAt && (
              <>
                <span aria-hidden="true">·</span>
                <time dateTime={new Date(post.publishedAt).toISOString()}>
                  {formatDate(post.publishedAt)}
                </time>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{readingTime} min citire</span>
          </div>
        </div>

        {/* Featured Image */}
        {post.featuredImage && (
          <div className="mb-8">
            {post.featuredImage.width && post.featuredImage.height ? (
              <Image
                src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
                width={post.featuredImage.width}
                height={post.featuredImage.height}
                alt={post.featuredImage.altText ?? post.title}
                priority
                className="rounded-xl w-full object-cover"
              />
            ) : (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden">
                <Image
                  src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
                  fill
                  alt={post.featuredImage.altText ?? post.title}
                  priority
                  className="object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* Table of Contents */}
        {h2s.length >= 3 && (
          <nav
            aria-label="Cuprins"
            className="mb-8 border border-gray-200 rounded-xl p-5 bg-gray-50"
          >
            <p className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
              Cuprins
            </p>
            <ol className="space-y-1.5 text-sm">
              {h2s.map((h2, index) => (
                <li key={h2.id}>
                  <a
                    href={`#${h2.id}`}
                    className="flex items-baseline gap-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <span className="text-xs text-gray-400 tabular-nums w-4 text-right flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span>{h2.text}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Article Content */}
        <article
          className="prose prose-lg max-w-none prose-headings:scroll-mt-24 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: enrichedHtml }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-gray-500">Etichete:</span>
              {post.tags.map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={`/eticheta/${tag.slug}`}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Author Bio Box */}
        {post.author && (
          <div className="mt-10 border border-gray-200 rounded-xl p-6 bg-gray-50">
            <div className="flex items-start gap-4">
              <div
                className="flex-shrink-0 w-14 h-14 rounded-full bg-slate-700 flex items-center justify-center text-white text-lg font-semibold"
                aria-hidden="true"
              >
                {authorInitials}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                  Despre autor
                </p>
                <p className="font-semibold text-gray-900">
                  {post.author.name ?? post.author.email}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  Scrie pe {site.siteName}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Articole similare</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedPosts.map((related) => {
                const relatedUrl = getRelatedPostUrl(related)
                return (
                  <article key={related.id} className="group">
                    <Link href={relatedUrl} className="block">
                      {related.featuredImage ? (
                        <div className="relative overflow-hidden rounded-lg mb-3" style={{ height: '70px' }}>
                          <Image
                            src={resolveImageUrl(related.featuredImage.url, site.siteUrl)}
                            fill
                            alt={related.featuredImage.altText ?? related.title}
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        </div>
                      ) : (
                        <div className="h-[70px] rounded-lg mb-3 bg-gray-100" />
                      )}
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2 mb-1">
                        {related.title}
                      </h3>
                      {related.publishedAt && (
                        <time
                          dateTime={new Date(related.publishedAt).toISOString()}
                          className="text-xs text-gray-400"
                        >
                          {formatDate(related.publishedAt)}
                        </time>
                      )}
                    </Link>
                  </article>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
