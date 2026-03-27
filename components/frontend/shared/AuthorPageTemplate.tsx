import Link from 'next/link'
import Image from 'next/image'
import { getTheme } from './theme'

export interface AuthorPageProps {
  template: string
  author: {
    name: string | null
    slug: string | null
    title: string | null
    bio: string | null
    photo: string | null
    website: string | null
  }
  posts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | string | null
    featuredImage: { url: string; altText: string | null } | null
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

export default function AuthorPageTemplate({ template, author, posts, pagination, site }: AuthorPageProps) {
  const t = getTheme(template)
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
        ...(author.photo && { image: { '@type': 'ImageObject', url: resolveUrl(author.photo, site.siteUrl) } }),
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
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-1.5 text-xs text-gray-400">
              <li><Link href="/" className={`${t.accentHoverText} transition-colors`}>{site.siteName}</Link></li>
              <li aria-hidden="true" className="text-gray-300">›</li>
              <li><span className="text-gray-600 font-medium" aria-current="page">{authorName}</span></li>
            </ol>
          </nav>

          {/* Author profile card */}
          <div className={`mb-12 p-6 sm:p-8 ${t.cardBg} border ${t.cardBorder} rounded-2xl shadow-sm`}>
            <div className="flex flex-col sm:flex-row items-start gap-6">

              {/* Photo */}
              <div className="flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden shadow-md">
                {author.photo ? (
                  <Image
                    src={resolveUrl(author.photo, site.siteUrl)}
                    width={96}
                    height={96}
                    alt={authorName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className={`w-full h-full ${t.accentBg} flex items-center justify-center text-white text-2xl font-black`} aria-hidden="true">
                    {initials}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                  {authorName}
                </h1>
                {author.title && (
                  <p className={`text-base font-semibold mt-1 ${t.pillText}`}>{author.title}</p>
                )}
                {author.bio && (
                  <p className="mt-3 text-gray-600 leading-relaxed max-w-xl">{author.bio}</p>
                )}

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-full">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Autor verificat
                  </span>
                  <span className={`inline-flex items-center gap-1 px-3 py-1.5 ${t.pillBg} ${t.pillText} text-xs font-semibold rounded-full border border-transparent`}>
                    {totalCount} {totalCount === 1 ? 'articol publicat' : 'articole publicate'}
                  </span>
                  {author.website && (
                    <a
                      href={author.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 text-xs font-semibold rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Articles */}
          <h2 className="text-xl font-bold text-gray-900 mb-6">Articole de {authorName}</h2>

          {posts.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">Niciun articol publicat încă.</p>
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
                        <Link href={`/${post.category.slug}`} className={`text-xs font-bold uppercase tracking-widest ${t.pillText} ${t.accentHoverText} mb-2 block transition-colors`}>
                          {post.category.name}
                        </Link>
                      )}
                      <h3 className={`font-bold text-gray-900 leading-snug mb-2 ${t.headingHover} transition-colors`}>
                        <Link href={getPostUrl(post)}>{post.title}</Link>
                      </h3>
                      {post.excerpt && (
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-3">{post.excerpt}</p>
                      )}
                      {post.publishedAt && (
                        <p className="text-xs text-gray-400">{formatDate(post.publishedAt)}</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav aria-label="Paginare" className="mt-12 flex justify-center gap-2 flex-wrap">
                  {currentPage > 1 && (
                    <Link href={`/autor/${authorSlug}?page=${currentPage - 1}`} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors">
                      ← Anterior
                    </Link>
                  )}
                  {buildPaginationItems(currentPage, totalPages).map((p, i) =>
                    p === '...' ? (
                      <span key={`e${i}`} className="px-3 py-2 text-sm text-gray-400">…</span>
                    ) : (
                      <Link
                        key={p}
                        href={`/autor/${authorSlug}?page=${p}`}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${p === currentPage ? `${t.accentBg} border-transparent ${t.accentText}` : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                        aria-current={p === currentPage ? 'page' : undefined}
                      >
                        {p}
                      </Link>
                    )
                  )}
                  {currentPage < totalPages && (
                    <Link href={`/autor/${authorSlug}?page=${currentPage + 1}`} className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:border-gray-300 transition-colors">
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
