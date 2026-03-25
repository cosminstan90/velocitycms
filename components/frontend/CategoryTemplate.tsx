import Image from 'next/image'
import Link from 'next/link'

interface CategoryTemplateProps {
  category: {
    id: string
    name: string
    slug: string
    description: string | null
    metaTitle: string | null
    metaDesc: string | null
  }
  subcategories: Array<{
    id: string
    name: string
    slug: string
    description: string | null
    _count: { posts: number }
  }>
  posts: Array<{
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
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  parentCategory?: { name: string; slug: string } | null
  seoSettings?: { siteName?: string; defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
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

function getPaginationUrl(categorySlug: string, page: number): string {
  if (page === 1) return `/${categorySlug}`
  return `/${categorySlug}/pagina/${page}`
}

function getPageNumbers(currentPage: number, totalPages: number): (number | '...')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const pages: (number | '...')[] = [1]
  if (currentPage > 3) pages.push('...')
  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (currentPage < totalPages - 2) pages.push('...')
  pages.push(totalPages)
  return pages
}

export default function CategoryTemplate({
  category,
  subcategories,
  posts,
  pagination,
  site,
  parentCategory,
}: CategoryTemplateProps) {
  const { currentPage: page, totalPages, totalCount: total } = pagination

  return (
    <div className="bg-white min-h-screen">

      {/* Category Hero */}
      <div className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
              <li>
                <Link href="/" className="hover:text-gray-700 hover:underline transition-colors">
                  {site.siteName}
                </Link>
              </li>
              {parentCategory && (
                <li className="flex items-center gap-1">
                  <span aria-hidden="true" className="text-gray-400">›</span>
                  <Link
                    href={`/${parentCategory.slug}`}
                    className="hover:text-gray-700 hover:underline transition-colors"
                  >
                    {parentCategory.name}
                  </Link>
                </li>
              )}
              <li className="flex items-center gap-1">
                <span aria-hidden="true" className="text-gray-400">›</span>
                <span className="text-gray-700 font-medium" aria-current="page">
                  {category.name}
                </span>
              </li>
            </ol>
          </nav>

          <h1 className="text-4xl font-bold text-gray-900 mb-3">{category.name}</h1>

          {category.description && (
            <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
              {category.description}
            </p>
          )}

          <p className="mt-3 text-sm text-gray-400">
            {total} {total === 1 ? 'articol' : 'articole'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Subcategories Grid */}
        {subcategories.length > 0 && (
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subcategorii</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {subcategories.map((sub) => (
                <Link
                  key={sub.id}
                  href={`/${category.slug}/${sub.slug}`}
                  className="group block border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors text-sm leading-snug">
                      {sub.name}
                    </span>
                    <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {sub._count.posts}
                    </span>
                  </div>
                  {sub.description && (
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1">{sub.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <section>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post) => {
                const postUrl = getPostUrl(post)
                return (
                  <article
                    key={post.id}
                    className="group flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Featured image — 16/9 aspect ratio */}
                    <Link href={postUrl} className="block relative overflow-hidden bg-gray-100" style={{ aspectRatio: '16/9' }}>
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
                      <h2 className="text-base font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-2 leading-snug">
                        <Link href={postUrl} className="hover:underline">
                          {post.title}
                        </Link>
                      </h2>

                      {/* Excerpt */}
                      {post.excerpt && (
                        <p className="text-sm text-gray-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                          {post.excerpt}
                        </p>
                      )}

                      {/* Author + date */}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-400 min-w-0">
                          {post.author?.name && (
                            <span className="font-medium text-gray-600 truncate">
                              {post.author.name}
                            </span>
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
                        <Link
                          href={postUrl}
                          className="flex-shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors ml-2 whitespace-nowrap"
                          aria-label={`Citește mai mult despre ${post.title}`}
                        >
                          Citește mai mult →
                        </Link>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">Nu există articole în această categorie.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav aria-label="Paginare" className="mt-12 flex justify-center">
            <div className="flex items-center gap-1">

              {/* Previous */}
              {page > 1 ? (
                <Link
                  href={getPaginationUrl(category.slug, page - 1)}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  aria-label="Pagina anterioară"
                >
                  ← Anterior
                </Link>
              ) : (
                <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 cursor-default">
                  ← Anterior
                </span>
              )}

              {/* Page numbers */}
              {getPageNumbers(page, totalPages).map((p, index) =>
                p === '...' ? (
                  <span
                    key={`ellipsis-${index}`}
                    className="inline-flex items-center px-3 py-2 text-sm text-gray-400"
                  >
                    …
                  </span>
                ) : (
                  <Link
                    key={p}
                    href={getPaginationUrl(category.slug, p)}
                    aria-label={`Pagina ${p}`}
                    aria-current={p === page ? 'page' : undefined}
                    className={`inline-flex items-center justify-center w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                      p === page
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {p}
                  </Link>
                )
              )}

              {/* Next */}
              {page < totalPages ? (
                <Link
                  href={getPaginationUrl(category.slug, page + 1)}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  aria-label="Pagina următoare"
                >
                  Următor →
                </Link>
              ) : (
                <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-300 cursor-default">
                  Următor →
                </span>
              )}
            </div>
          </nav>
        )}
      </div>
    </div>
  )
}
