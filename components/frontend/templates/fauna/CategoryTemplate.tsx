/**
 * Fauna — CategoryTemplate (v3)
 *
 * Server component. Interactive post grid extracted to CategoryPostsClient.tsx.
 *
 * Features:
 *  - Uses shared FaunaLayout for nav + footer
 *  - Hero banner with gradient overlay and category name
 *  - CategoryPostsClient island: A-Z filter, sort, view toggle, post grid, pagination
 */

import Image from 'next/image'
import Link from 'next/link'
import FaunaLayout from './FaunaLayout'
import CategoryPostsClient from './CategoryPostsClient'
import { resolveImageUrl } from './utils'

// ─── Props ────────────────────────────────────────────────────────────────────

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
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  parentCategory?: { name: string; slug: string } | null
  seoSettings?: { siteName?: string; defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaunaCategoryTemplate({
  category,
  subcategories,
  posts,
  pagination,
  site,
  categories = [],
  parentCategory,
  seoSettings,
}: CategoryTemplateProps) {
  const { totalCount } = pagination
  // Use first post's image for hero background if available
  const heroBgPost = posts[0] ?? null

  return (
    <FaunaLayout
      site={site}
      categories={categories}
      activeCategory={category.slug}
      seoSettings={seoSettings}
    >
      {/* ══ HERO BANNER ════════════════════════════════════════════════════════ */}
      <section className="relative bg-gray-900 overflow-hidden">
        {/* Background — gradient if no post image */}
        {heroBgPost?.featuredImage ? (
          <Image
            src={resolveImageUrl(heroBgPost.featuredImage.url, site.siteUrl)}
            fill
            alt=""
            className="object-cover opacity-30"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900 via-amber-800 to-orange-900 opacity-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/50 to-gray-900/30" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-white/50">
              <li>
                <Link href="/" className="hover:text-white transition-colors">{site.siteName}</Link>
              </li>
              {parentCategory && (
                <li className="flex items-center gap-1.5">
                  <span aria-hidden="true" className="text-white/30">&rsaquo;</span>
                  <Link href={`/${parentCategory.slug}`} className="hover:text-white transition-colors">{parentCategory.name}</Link>
                </li>
              )}
              <li className="flex items-center gap-1.5">
                <span aria-hidden="true" className="text-white/30">&rsaquo;</span>
                <span className="text-white/80 font-medium" aria-current="page">{category.name}</span>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-baseline gap-3 mb-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              {category.metaTitle ?? category.name}
            </h1>
            <span className="px-3 py-1 bg-amber-500/90 text-white text-sm font-bold rounded-full shadow-sm">
              {totalCount} {totalCount === 1 ? 'articol' : 'articole'}
            </span>
          </div>

          {(category.metaDesc ?? category.description) && (
            <p className="text-white/70 leading-relaxed max-w-2xl text-[15px]">
              {category.metaDesc ?? category.description}
            </p>
          )}
        </div>
      </section>

      {/* ══ INTERACTIVE POSTS SECTION (client island) ═══════════════════════════ */}
      <CategoryPostsClient
        posts={posts}
        subcategories={subcategories}
        category={{ name: category.name, slug: category.slug, description: category.description }}
        pagination={pagination}
        siteUrl={site.siteUrl}
      />
    </FaunaLayout>
  )
}
