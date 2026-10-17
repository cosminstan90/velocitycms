/**
 * DiVet — CategoryTemplate (listare categorie / grup)
 *
 * Breadcrumbs, titlu, descriere, numar articole, chip-uri de subcategorii,
 * grila de ArticleCard si paginare. Server component, doar token-uri dv-*.
 */

import Link from 'next/link'
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import ArticleCard from './ArticleCard'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import { resolveImageUrl } from '../fauna/utils'
import { buildPostPath } from '@/lib/seo/canonical-builder'
import { cardMeta } from '@/lib/fields'

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
    featuredImage: { url: string; altText: string | null; width: number | null; height: number | null } | null
    author: { name: string | null } | null
    category: { name: string; slug: string; parent?: { name: string; slug: string } | null } | null
    fieldValues?: Array<{ value: string; fieldDefinition: { fieldKey: string } }>
  }>
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  // LEGACY — ignorat, pastrat pentru compatibilitatea cu dispatcher-ul
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  parentCategory?: { name: string; slug: string } | null
  // LEGACY — ignorat
  seoSettings?: { siteName?: string; defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

export default function DivetCategoryTemplate({
  category,
  subcategories,
  posts,
  pagination,
  site,
  parentCategory,
}: CategoryTemplateProps) {
  const { currentPage, totalPages, totalCount } = pagination
  const basePath = parentCategory ? `/${parentCategory.slug}/${category.slug}` : `/${category.slug}`
  const chips = parentCategory ? [] : subcategories.filter((s) => s._count.posts > 0)

  const crumbs = [
    { name: 'Acasă', href: '/' },
    ...(parentCategory ? [{ name: parentCategory.name, href: `/${parentCategory.slug}` }] : []),
    { name: category.name, href: basePath },
  ]

  return (
    <DivetLayout site={site} activeGroup={parentCategory?.slug ?? category.slug}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={crumbs} />

        <h1 className="mt-4 font-dv-display text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-balance text-dv-ink sm:text-[44px]">
          {category.name}
        </h1>
        {category.description ? (
          <p className="mt-3 max-w-[70ch] text-dv-body text-dv-ink-muted">{category.description}</p>
        ) : null}
        <p className="mt-2 text-dv-meta text-dv-ink-subtle">
          {totalCount === 1 ? '1 articol' : `${totalCount} articole`}
        </p>

        {chips.length > 0 ? (
          <nav aria-label="Subcategorii" className="mt-5 flex flex-wrap gap-2">
            {chips.map((sub) => (
              <Link
                key={sub.id}
                href={`/${category.slug}/${sub.slug}`}
                className="rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[13px] text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
              >
                {sub.name} <span className="text-dv-ink-subtle">{sub._count.posts}</span>
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="mt-6">
          {posts.length === 0 ? (
            <EmptyState
              title={`Încă nu avem articole în ${category.name}`}
              description="Revino curând sau caută în restul enciclopediei."
              action={{ label: 'Vezi toate articolele', href: '/index-a-z' }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <ArticleCard
                  key={post.id}
                  href={buildPostPath({ slug: post.slug }, post.category)}
                  title={post.title}
                  kicker={post.category?.name ?? null}
                  meta={cardMeta(post.fieldValues ?? [])}
                  image={
                    post.featuredImage
                      ? {
                          url: resolveImageUrl(post.featuredImage.url, site.siteUrl),
                          alt: post.featuredImage.altText ?? post.title,
                        }
                      : null
                  }
                />
              ))}
            </div>
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} basePath={basePath} />
      </div>
    </DivetLayout>
  )
}
