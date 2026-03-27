import Link from 'next/link'
import { getTheme } from './theme'

export interface TagPageProps {
  template: string
  tag: {
    name: string
    slug: string
    description: string | null
    metaTitle: string | null
    metaDesc: string | null
  }
  posts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | string | null
    featuredImage: { url: string; altText: string | null } | null
    author: { name: string | null } | null
    category: { name: string; slug: string } | null
  }>
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
}

function formatDate(date: Date | string | null) {
  if (!date) return ''
  return new Intl.DateTimeFormat('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
}

function getPostUrl(post: { slug: string; category: { slug: string } | null }) {
  return post.category ? `/${post.category.slug}/${post.slug}` : `/blog/${post.slug}`
}

function resolveUrl(url: string, siteUrl: string) {
  return url.startsWith('/') ? `${siteUrl}${url}` : url
}

function buildPaginationItems(currentPage: number, totalPages: number): (number | '...')[] {
  return Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
    .reduce<(number | '...')[]>((acc, p, i, arr) => {
      if (i > 0 && (arr[i - 1] as number) < p - 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])
}

export default function TagPageTemplate({ template, tag, posts, pagination, site }: TagPageProps) {
  const t = getTheme(template)
  const { currentPage, totalPages, totalCount } = pagination

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${site.siteUrl}/eticheta/${tag.slug}/#collectionpage`,
        url: `${site.siteUrl}/eticheta/${tag.slug}`,
        name: tag.metaTitle ?? tag.name,
        description: tag.metaDesc ?? tag.description ?? undefined,
        isPartOf: { '@id': `${site.siteUrl}/#website` },
        inLanguage: 'ro-RO',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.siteName, item: site.siteUrl },
          { '@type': 'ListItem', position: 2, name: tag.name, item: `${site.siteUrl}/eticheta/${tag.slug}` },
        ],
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      <div className={`min-h-screen ${t.pageBg}`} style={{ fontFamily: t.fontFamily }}>

        {/* Nav */}
        <nav className={`${t.navBg} border-b ${t.navBorder} sticky top-0 z-50 shadow-sm`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
            <Link href="/" className={`text-lg font-black ${t.navLogo} tracking-tight`}>
              {site.siteName}
            </Link>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-1.5 text-xs text-gray-400">
              <li><Link href="/" className={`${t.accentHoverText} transition-colors`}>{site.siteName}</Link></li>
              <li aria-hidden="true" className="text-gray-300">›</li>
              <li><span className="text-gray-600 font-medium" aria-current="page">#{tag.name}</span></li>
            </ol>
          </nav>

          {/* Header */}
          <header className="mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">
              #{tag.name}
            </h1>
            <span className={`inline-block px-3 py-1 ${t.pillBg} ${t.pillText} text-sm font-bold rounded-full`}>
              {totalCount} {totalCount === 1 ? 'articol' : 'articole'}
            </span>
            {(tag.description || tag.metaDesc) && (
              <p className="mt-4 text-base text-gray-600 max-w-2xl leading-relaxed">
                {tag.description ?? tag.metaDesc}
              </p>
            )}
          </header>

          {/* Grid */}
          {posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">Niciun articol cu această etichetă.</p>
              <Link href="/" className={`mt-4 inline-block text-sm font-medium underline`}>← Înapoi acasă</Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <article key={post.id} className={`${t.cardBg} rounded-2xl border ${t.cardBorder} overflow-hidden shadow-sm hover:shadow-md transition-shadow group`}>
                    {post.featuredImage && (
                      <Link href={getPostUrl(post)} className="block aspect-[16/9] overflow-hidden bg-gray-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={resolveUrl(post.featuredImage.url, site.siteUrl)}
                          alt={post.featuredImage.altText ?? post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </Link>
                    )}
                    <div className="p-5">
                      {post.category && (
                        <Link
                          href={`/${post.category.slug}`}
                          className={`text-xs font-bold uppercase tracking-widest ${t.pillText} ${t.accentHoverText} mb-2 block transition-colors`}
                        >
                          {post.category.name}
                        </Link>
                      )}
                      <h2 className={`font-bold text-gray-900 leading-snug mb-2 ${t.headingHover} transition-colors`}>
                        <Link href={getPostUrl(post)}>{post.title}</Link>
                      </h2>
                      {post.excerpt && (
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        {post.author?.name && <span>{post.author.name}</span>}
                        {post.publishedAt && <span>{formatDate(post.publishedAt)}</span>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Paginare" className="mt-12 flex justify-center gap-2 flex-wrap">
                  {currentPage > 1 && (
                    <Link href={`/eticheta/${tag.slug}?page=${currentPage - 1}`} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors">
                      ← Anterior
                    </Link>
                  )}
                  {buildPaginationItems(currentPage, totalPages).map((p, i) =>
                    p === '...' ? (
                      <span key={`e${i}`} className="px-3 py-2 text-sm text-gray-400">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={`/eticheta/${tag.slug}?page=${p}`}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${p === currentPage ? `${t.accentBg} border-transparent ${t.accentText}` : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        aria-current={p === currentPage ? 'page' : undefined}
                      >
                        {p}
                      </Link>
                    )
                  )}
                  {currentPage < totalPages && (
                    <Link href={`/eticheta/${tag.slug}?page=${currentPage + 1}`} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors">
                      Următor →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
