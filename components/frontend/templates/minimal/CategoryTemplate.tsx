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

function getPaginationUrl(categorySlug: string, page: number): string {
  if (page === 1) return `/${categorySlug}`
  return `/${categorySlug}/pagina/${page}`
}

export default function MinimalCategoryTemplate({
  category,
  subcategories,
  posts,
  pagination,
  site,
  parentCategory,
}: CategoryTemplateProps) {
  const { currentPage: page, totalPages, totalCount: total } = pagination

  return (
    <div
      className="min-h-screen bg-white"
      style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif' }}
    >
      {/* Header */}
      <header className="border-b border-gray-200 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
            {site.siteName}
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-xs text-gray-400 flex flex-wrap gap-1">
          <Link href="/" className="hover:text-gray-700 transition-colors">{site.siteName}</Link>
          {parentCategory && (
            <>
              <span aria-hidden="true">›</span>
              <Link href={`/${parentCategory.slug}`} className="hover:text-gray-700 transition-colors">
                {parentCategory.name}
              </Link>
            </>
          )}
          <span aria-hidden="true">›</span>
          <span className="text-gray-600" aria-current="page">{category.name}</span>
        </nav>

        {/* Category heading */}
        <div className="mb-8 pb-6 border-b border-gray-100">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{category.name}</h1>
          {category.description && (
            <p className="mt-2 text-gray-500 leading-relaxed text-sm italic">{category.description}</p>
          )}
          <p className="mt-2 text-xs text-gray-400">{total} {total === 1 ? 'articol' : 'articole'}</p>
        </div>

        {/* Subcategories */}
        {subcategories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-3">
            {subcategories.map((sub) => (
              <Link
                key={sub.id}
                href={`/${category.slug}/${sub.slug}`}
                className="text-xs uppercase tracking-widest text-gray-400 hover:text-gray-900 border-b border-gray-200 hover:border-gray-700 transition-colors pb-0.5"
              >
                {sub.name} ({sub._count.posts})
              </Link>
            ))}
          </div>
        )}

        {/* Posts */}
        {posts.length === 0 ? (
          <p className="text-gray-400 text-sm py-8">Niciun articol în această categorie.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => {
              const postUrl = getPostUrl(post)
              return (
                <article key={post.id} className="py-7 flex gap-5">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 leading-snug">
                      <Link href={postUrl} className="hover:underline decoration-gray-300">
                        {post.title}
                      </Link>
                    </h2>
                    {post.excerpt && (
                      <p className="mt-1.5 text-sm text-gray-500 leading-relaxed line-clamp-2">
                        {post.excerpt}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      {post.author?.name && <span>{post.author.name}</span>}
                      {post.publishedAt && post.author?.name && <span aria-hidden="true">·</span>}
                      {post.publishedAt && (
                        <time dateTime={new Date(post.publishedAt).toISOString()}>
                          {formatDate(post.publishedAt)}
                        </time>
                      )}
                    </div>
                  </div>
                  {post.featuredImage && (
                    <Link href={postUrl} className="flex-shrink-0 hidden sm:block">
                      <div className="relative w-20 h-20 overflow-hidden rounded bg-gray-100">
                        <Image
                          src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
                          fill
                          alt={post.featuredImage.altText ?? post.title}
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                    </Link>
                  )}
                </article>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <nav className="mt-10 flex justify-center gap-2" aria-label="Paginare">
            {page > 1 && (
              <Link
                href={getPaginationUrl(category.slug, page - 1)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-500 hover:border-gray-400 transition-colors"
              >
                ← Anterior
              </Link>
            )}
            <span className="text-xs px-3 py-1.5 text-gray-400">
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={getPaginationUrl(category.slug, page + 1)}
                className="text-xs px-3 py-1.5 border border-gray-200 rounded text-gray-500 hover:border-gray-400 transition-colors"
              >
                Următor →
              </Link>
            )}
          </nav>
        )}
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-xs text-gray-400 mt-8">
        © {new Date().getFullYear()} {site.siteName}
      </footer>
    </div>
  )
}
