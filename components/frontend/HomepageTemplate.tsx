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
    month: 'short',
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

export default function HomepageTemplate({
  latestPosts,
  categories,
  site,
  seoSettings,
}: HomepageTemplateProps) {
  const heroPost = latestPosts[0] ?? null
  const gridPosts = latestPosts.slice(1)

  const heroImageUrl =
    heroPost?.featuredImage?.url
      ? resolveImageUrl(heroPost.featuredImage.url, site.siteUrl)
      : site.defaultOgImage
        ? resolveImageUrl(site.defaultOgImage, site.siteUrl)
        : null

  const tagline = seoSettings?.defaultMetaDesc ?? null

  return (
    <div
      className="bg-white min-h-screen"
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}
    >

      {/* Hero Section */}
      {heroPost && (
        <section className="relative overflow-hidden bg-slate-900" style={{ minHeight: '480px' }}>
          {/* Background image */}
          {heroImageUrl && (
            <Image
              src={heroImageUrl}
              fill
              alt={heroPost.featuredImage?.altText ?? heroPost.title}
              priority
              className="object-cover opacity-40"
              sizes="100vw"
            />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/70 to-slate-900/30" />

          {/* Hero content */}
          <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end py-16" style={{ minHeight: '480px' }}>
            {/* Category chip */}
            {heroPost.category && (
              <Link
                href={`/${heroPost.category.slug}`}
                className="self-start mb-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                {heroPost.category.name}
              </Link>
            )}

            {/* Site name / H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-3 leading-tight tracking-tight">
              {site.siteName}
            </h1>

            {/* Tagline */}
            {tagline && (
              <p className="text-lg sm:text-xl text-slate-300 mb-6 max-w-2xl leading-relaxed">
                {tagline}
              </p>
            )}

            {/* Hero post title */}
            <p className="text-xl sm:text-2xl font-semibold text-white mb-6 max-w-3xl leading-snug">
              {heroPost.title}
            </p>

            {/* CTA */}
            <div>
              <Link
                href={getPostUrl(heroPost)}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors shadow-lg"
              >
                Citește articolul
                <span aria-hidden="true">→</span>
              </Link>
            </div>

            {/* Hero meta */}
            {heroPost.publishedAt && (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
                {heroPost.author?.name && (
                  <>
                    <span>{heroPost.author.name}</span>
                    <span aria-hidden="true">·</span>
                  </>
                )}
                <time dateTime={new Date(heroPost.publishedAt).toISOString()}>
                  {formatDate(heroPost.publishedAt)}
                </time>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Latest Posts Section */}
      {gridPosts.length > 0 && (
        <section className="bg-white py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-baseline justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Ultimele articole</h2>
              <Link href="/blog" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                Vezi toate →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {gridPosts.map((post) => {
                const postUrl = getPostUrl(post)
                return (
                  <article
                    key={post.id}
                    className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Featured image — 16/9 */}
                    <Link
                      href={postUrl}
                      className="block relative overflow-hidden bg-gray-100"
                      style={{ aspectRatio: '16/9' }}
                    >
                      {post.featuredImage ? (
                        <Image
                          src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
                          fill
                          alt={post.featuredImage.altText ?? post.title}
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                      )}
                    </Link>

                    <div className="flex flex-col flex-1 p-5">
                      {/* Category label */}
                      {post.category && (
                        <Link
                          href={`/${post.category.slug}`}
                          className="text-xs font-semibold uppercase tracking-wider text-blue-600 hover:text-blue-800 transition-colors mb-2"
                        >
                          {post.category.name}
                        </Link>
                      )}

                      {/* Title */}
                      <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-2 leading-snug">
                        <Link href={postUrl} className="hover:underline">
                          {post.title}
                        </Link>
                      </h3>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Author + date */}
                      <div className="flex items-center gap-2 mt-auto pt-3 border-t border-gray-100 text-xs text-gray-400">
                        {post.author?.name && (
                          <span className="font-medium text-gray-600 truncate">{post.author.name}</span>
                        )}
                        {post.publishedAt && post.author?.name && (
                          <span aria-hidden="true">·</span>
                        )}
                        {post.publishedAt && (
                          <time dateTime={new Date(post.publishedAt).toISOString()}>
                            {formatDate(post.publishedAt)}
                          </time>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-100 py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Explorează categoriile</h2>

            <div className="flex flex-wrap gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors shadow-sm hover:shadow"
                >
                  <span className="font-medium text-gray-800 group-hover:text-blue-700 transition-colors text-sm">
                    {cat.name}
                  </span>
                  <span className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full bg-gray-100 group-hover:bg-blue-100 text-gray-500 group-hover:text-blue-600 text-xs font-semibold transition-colors">
                    {cat._count.posts}
                  </span>
                </Link>
              ))}
            </div>

            {/* Category description cards for richer presentation */}
            {categories.some((c) => c.description) && (
              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories
                  .filter((c) => c.description)
                  .map((cat) => (
                    <Link
                      key={`card-${cat.id}`}
                      href={`/${cat.slug}`}
                      className="group block border border-gray-200 rounded-xl p-5 bg-white hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                          {cat.name}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          {cat._count.posts} {cat._count.posts === 1 ? 'articol' : 'articole'}
                        </span>
                      </div>
                      {cat.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">
                          {cat.description}
                        </p>
                      )}
                    </Link>
                  ))}
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
