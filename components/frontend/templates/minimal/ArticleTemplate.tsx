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

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function getReadingTime(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function resolveImageUrl(url: string, siteUrl: string): string {
  if (url.startsWith('/')) return `${siteUrl}${url}`
  return url
}

function getRelatedPostUrl(post: { slug: string; category: { name: string; slug: string } | null }): string {
  if (post.category) return `/${post.category.slug}/${post.slug}`
  return `/blog/${post.slug}`
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

interface H2Entry { text: string; id: string }

function extractH2s(html: string): H2Entry[] {
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi
  const entries: H2Entry[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const rawText = match[1].replace(/<[^>]+>/g, '').trim()
    if (rawText) entries.push({ text: rawText, id: slugifyId(rawText) })
  }
  return entries
}

function injectH2Ids(html: string, h2s: H2Entry[]): string {
  let result = html
  for (const { text, id } of h2s) {
    result = result.replace(
      new RegExp(`<h2([^>]*)>((?:(?!<\\/h2>)[\\s\\S])*?${text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:(?!<\\/h2>)[\\s\\S])*?)<\\/h2>`, 'i'),
      (_, attrs: string, inner: string) => {
        if (/\bid\s*=/.test(attrs)) return `<h2${attrs}>${inner}</h2>`
        return `<h2${attrs} id="${id}">${inner}</h2>`
      }
    )
  }
  return result
}

export default function MinimalArticleTemplate({
  post,
  relatedPosts,
  site,
  subCategory,
  breadcrumbExtra,
}: ArticleTemplateProps) {
  const h2s = extractH2s(post.contentHtml)
  const enrichedHtml = h2s.length >= 3 ? injectH2Ids(post.contentHtml, h2s) : post.contentHtml
  const readingTime = getReadingTime(post.contentHtml)

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
    >
      {/* Minimal site header */}
      <header className="border-b border-gray-200 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
            {site.siteName}
          </Link>
          {post.category && (
            <Link
              href={`/${post.category.slug}`}
              className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors"
            >
              {post.category.name}
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-gray-400 flex flex-wrap gap-1">
          <Link href="/" className="hover:text-gray-700 transition-colors">{site.siteName}</Link>
          {post.category && (
            <>
              <span aria-hidden="true">›</span>
              <Link href={`/${post.category.slug}`} className="hover:text-gray-700 transition-colors">
                {post.category.name}
              </Link>
            </>
          )}
          {subCategory && post.category && (
            <>
              <span aria-hidden="true">›</span>
              <Link href={`/${post.category.slug}/${subCategory.slug}`} className="hover:text-gray-700 transition-colors">
                {subCategory.name}
              </Link>
            </>
          )}
          {breadcrumbExtra?.map((extra) => (
            <>
              <span aria-hidden="true">›</span>
              <Link href={extra.href} className="hover:text-gray-700 transition-colors">{extra.name}</Link>
            </>
          ))}
          <span aria-hidden="true">›</span>
          <span className="text-gray-600 truncate max-w-[200px]" aria-current="page">{post.title}</span>
        </nav>

        {/* Article header */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 leading-tight mb-4">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="text-lg text-gray-600 leading-relaxed mb-4 italic">{post.excerpt}</p>
          )}
          <div className="flex items-center gap-2 text-xs text-gray-400 border-t border-gray-100 pt-4">
            {post.author?.name && <span>{post.author.name}</span>}
            {post.publishedAt && post.author?.name && <span aria-hidden="true">·</span>}
            {post.publishedAt && (
              <time dateTime={new Date(post.publishedAt).toISOString()}>
                {formatDate(post.publishedAt)}
              </time>
            )}
            <span aria-hidden="true">·</span>
            <span>{readingTime} min citire</span>
          </div>
        </header>

        {/* Featured image */}
        {post.featuredImage && (
          <div className="mb-8 -mx-4 sm:-mx-6">
            {post.featuredImage.width && post.featuredImage.height ? (
              <Image
                src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
                width={post.featuredImage.width}
                height={post.featuredImage.height}
                alt={post.featuredImage.altText ?? post.title}
                priority
                className="w-full object-cover"
              />
            ) : (
              <div className="relative w-full aspect-video overflow-hidden">
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

        {/* Table of contents */}
        {h2s.length >= 3 && (
          <nav aria-label="Cuprins" className="mb-8 border-l-2 border-gray-200 pl-4">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">Cuprins</p>
            <ol className="space-y-1">
              {h2s.map((h2, i) => (
                <li key={h2.id}>
                  <a href={`#${h2.id}`} className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                    {i + 1}. {h2.text}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Content */}
        <article
          className="prose prose-gray max-w-none prose-headings:scroll-mt-24 prose-a:text-gray-900 prose-a:underline hover:prose-a:no-underline"
          dangerouslySetInnerHTML={{ __html: enrichedHtml }}
        />

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-100 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400">Etichete:</span>
            {post.tags.map(({ tag }) => (
              <Link
                key={tag.id}
                href={`/eticheta/${tag.slug}`}
                className="text-xs px-2 py-0.5 border border-gray-200 rounded text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                {tag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Author */}
        {post.author && (
          <div className="mt-10 pt-6 border-t border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Autor</p>
            <p className="font-semibold text-gray-900">{post.author.name ?? post.author.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">Contributor la {site.siteName}</p>
          </div>
        )}

        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-6">Articole similare</p>
            <div className="space-y-4">
              {relatedPosts.map((related) => (
                <div key={related.id} className="flex items-start gap-4">
                  {related.featuredImage && (
                    <Link href={getRelatedPostUrl(related)} className="flex-shrink-0">
                      <div className="relative w-16 h-16 overflow-hidden rounded bg-gray-100">
                        <Image
                          src={resolveImageUrl(related.featuredImage.url, site.siteUrl)}
                          fill
                          alt={related.featuredImage.altText ?? related.title}
                          className="object-cover"
                          sizes="64px"
                        />
                      </div>
                    </Link>
                  )}
                  <div>
                    <Link href={getRelatedPostUrl(related)} className="text-sm font-semibold text-gray-900 hover:underline leading-snug">
                      {related.title}
                    </Link>
                    {related.publishedAt && (
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(related.publishedAt)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 mt-8">
        © {new Date().getFullYear()} {site.siteName}
      </footer>
    </div>
  )
}
