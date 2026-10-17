/**
 * DiVet — TagTemplate (/eticheta/[slug])
 *
 * Breadcrumbs, eticheta, titlu, descriere, numar articole, PostGrid si paginare.
 * Server component, doar token-uri dv-*.
 */

import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import PostGrid from './PostGrid'
import EmptyState from './EmptyState'
import Pagination from './Pagination'

interface PostItem {
  id: string
  title: string
  slug: string
  excerpt: string | null
  publishedAt: Date | string | null
  featuredImage: { url: string; altText: string | null } | null
  author: { name: string | null } | null
  category: { name: string; slug: string; parent?: { name: string; slug: string } | null } | null
  fieldValues?: Array<{ value: string; fieldDefinition: { fieldKey: string } }>
}

interface DivetTagTemplateProps {
  tag: {
    name: string
    slug: string
    description: string | null
    metaTitle: string | null
    metaDesc: string | null
  }
  posts: PostItem[]
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  // LEGACY — ignorat, pastrat pentru compatibilitatea cu dispatcher-ul
  categories?: Array<{ id: string; name: string; slug: string; description?: string | null; _count?: { posts: number } }>
  // LEGACY — ignorat
  seoSettings?: { defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

export default function DivetTag({ tag, posts, pagination, site }: DivetTagTemplateProps) {
  const { currentPage, totalPages, totalCount } = pagination
  const basePath = `/eticheta/${tag.slug}`

  return (
    <DivetLayout site={{ siteName: site.siteName, siteUrl: site.siteUrl }}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs
          items={[
            { name: 'Acasă', href: '/' },
            { name: `Etichetă: ${tag.name}`, href: basePath },
          ]}
        />

        <p className="mt-6 mb-0 text-dv-label font-semibold uppercase text-dv-accent">Etichetă</p>
        <h1 className="mt-1 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-dv-ink sm:text-[44px]">
          {tag.name}
        </h1>
        {tag.description ? (
          <p className="mt-3 mb-0 max-w-[70ch] text-dv-body text-dv-ink-muted">{tag.description}</p>
        ) : null}
        <p className="mt-2 mb-0 text-dv-meta text-dv-ink-subtle">
          {totalCount === 1 ? '1 articol' : `${totalCount} articole`}
        </p>

        <div className="mt-6">
          {posts.length === 0 ? (
            <EmptyState
              title="Nicio fișă cu această etichetă încă."
              description="Revino curând sau caută în restul enciclopediei."
            />
          ) : (
            <PostGrid posts={posts} siteUrl={site.siteUrl} />
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} basePath={basePath} />
      </div>
    </DivetLayout>
  )
}
