import Image from 'next/image'
import Link from 'next/link'

interface HomepageTemplateProps {
  latestPosts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | string | null
    featuredImage: {
      url: string
      altText: string | null
      width: number | null
      height: number | null
    } | null
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

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('ro-RO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

function resolveImageUrl(url: string, siteUrl: string): string {
  if (url.startsWith('/')) return `${siteUrl}${url}`
  return url
}

function getPostUrl(post: { slug: string; category: { name: string; slug: string } | null }): string {
  if (post.category) return `/${post.category.slug}/${post.slug}`
  return `/blog/${post.slug}`
}

export default function MinimalHomepageTemplate({
  latestPosts,
  categories,
  site,
  seoSettings,
}: HomepageTemplateProps) {
  const tagline = seoSettings?.defaultMetaDesc ?? null

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
    >
      {/* Header */}
      <header className="border-b border-gray-200 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Link href="/" className="no-underline">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              {site.siteName}
            </h1>
          </Link>
          {tagline && (
            <p className="mt-2 text-sm text-gray-500 italic">{tagline}</p>
          )}
          {/* Category nav */}
          {categories.length > 0 && (
            <nav className="mt-4 flex flex-wrap justify-center gap-4 text-xs uppercase tracking-widest text-gray-500">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="hover:text-gray-900 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* Articles list */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {latestPosts.length === 0 ? (
          <p className="text-center text-gray-400 py-16">Niciun articol publicat încă.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {latestPosts.map((post) => {
              const postUrl = getPostUrl(post)
              return (
                <article key={post.id} className="py-8 flex gap-6">
                  {/* Text content */}
                  <div className="flex-1 min-w-0">
                    {post.category && (
                      <Link
                        href={`/${post.category.slug}`}
                        className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        {post.category.name}
                      </Link>
                    )}
                    <h2 className="mt-1 text-xl font-bold text-gray-900 leading-snug">
                      <Link href={postUrl} className="hover:underline decoration-gray-300">
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt && (
                      <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                      {post.author?.name && (
                        <span>{post.author.name}</span>
                      )}
                      {post.publishedAt && post.author?.name && <span aria-hidden="true">·</span>}
                      {post.publishedAt && (
                        <time dateTime={new Date(post.publishedAt).toISOString()}>
                          {formatDate(post.publishedAt)}
                        </time>
                      )}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  {post.featuredImage && (
                    <Link href={postUrl} className="flex-shrink-0 hidden sm:block">
                      <div className="relative w-24 h-24 rounded overflow-hidden bg-gray-100">
                        <Image
                          src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
                          fill
                          alt={post.featuredImage.altText ?? post.title}
                          className="object-cover hover:scale-105 transition-transform duration-300"
                          sizes="96px"
                        />
                      </div>
                    </Link>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {/* More link */}
        <div className="mt-8 text-center">
          <Link
            href="/blog"
            className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors border-b border-gray-300 pb-0.5"
          >
            Toate articolele
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} {site.siteName}
      </footer>
    </div>
  )
}
