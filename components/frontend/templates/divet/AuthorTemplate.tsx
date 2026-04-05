import Image from 'next/image'
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import { BrandMark, StoryCard, buildPaginationItems, formatDateLong, resolveImageUrl, type NavCategoryItem, type StoryPost } from './utils'

interface DivetAuthorTemplateProps {
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
  categories?: NavCategoryItem[]
  seoSettings?: { defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

export default function DivetAuthorTemplate({
  author,
  posts,
  pagination,
  site,
  categories = [],
  seoSettings,
}: DivetAuthorTemplateProps) {
  const authorName = author.name ?? 'Autor DiVet'
  const authorSlug = author.slug ?? ''
  const initials = authorName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  const canonical = `${site.siteUrl.replace(/\/$/, '')}/autor/${authorSlug}`
  const paginationItems = buildPaginationItems(pagination.currentPage, pagination.totalPages)
  const mappedPosts: StoryPost[] = posts.map((post) => ({
    ...post,
    author: null,
  }))
  const leadPost = mappedPosts[0] ?? null
  const gridPosts = mappedPosts.slice(1)

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
        ...(author.photo && {
          image: { '@type': 'ImageObject', url: resolveImageUrl(author.photo, site.siteUrl) },
        }),
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
    <DivetLayout site={site} categories={categories} seoSettings={seoSettings}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
      />

      <section className="border-b border-[color:var(--dv-border)] px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--dv-muted)]">
              <li><Link href="/" className="transition-colors hover:text-[color:var(--dv-contrast)]">{site.siteName}</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-[color:var(--dv-muted-strong)]" aria-current="page">{authorName}</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="divet-card rounded-[34px] p-7 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[28px] border border-[color:var(--dv-border)] sm:h-28 sm:w-28">
                  {author.photo ? (
                    <Image
                      src={resolveImageUrl(author.photo, site.siteUrl)}
                      fill
                      alt={authorName}
                      className="object-cover"
                      sizes="112px"
                      priority
                    />
                  ) : (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-2xl font-black text-white"
                      style={{ background: 'linear-gradient(135deg, var(--dv-accent), var(--dv-forest))' }}
                    >
                      {initials || <BrandMark className="h-12 w-12" />}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="divet-kicker text-[11px] font-semibold">Autor DiVet</p>
                  <h1 className="divet-display mt-3 text-5xl leading-[0.95] text-[color:var(--dv-contrast)] sm:text-[4rem]">
                    {authorName}
                  </h1>
                  {author.title && (
                    <p className="mt-3 text-base font-semibold text-[color:var(--dv-accent-strong)]">{author.title}</p>
                  )}
                  {author.bio && (
                    <p className="mt-4 max-w-2xl text-sm leading-8 text-[color:var(--dv-muted-strong)] sm:text-base">
                      {author.bio}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="divet-chip rounded-full px-4 py-2 text-sm">
                      {pagination.totalCount} {pagination.totalCount === 1 ? 'articol publicat' : 'articole publicate'}
                    </span>
                    <span className="divet-chip rounded-full px-4 py-2 text-sm">Profil editorial verificat</span>
                    {author.website && (
                      <a
                        href={author.website}
                        target="_blank"
                        rel="noreferrer"
                        className="divet-button-ghost inline-flex rounded-full px-4 py-2 text-sm font-semibold"
                      >
                        Website
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="divet-card-soft rounded-[34px] p-7 sm:p-8">
              <p className="divet-kicker text-[11px] font-semibold">Ce gasesti aici</p>
              <div className="mt-4 space-y-4 text-sm leading-8 text-[color:var(--dv-muted-strong)]">
                <p>Toate articolele publicate de acest autor, intr-un format editorial care ramane usor de parcurs.</p>
                <p>Pagina trebuie sa inspire incredere si sa functioneze ca un nod EEAT real, nu doar ca o arhiva de linkuri.</p>
                {leadPost?.publishedAt && (
                  <p>
                    Cel mai recent articol din aceasta selectie este din <span className="font-semibold text-[color:var(--dv-contrast)]">{formatDateLong(leadPost.publishedAt)}</span>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="divet-kicker text-[11px] font-semibold">Arhiva autorului</p>
              <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">Texte semnate de {authorName}</h2>
            </div>
            <p className="text-sm leading-7 text-[color:var(--dv-muted-strong)]">
              Pagina ramane curata si ritmata chiar si pe masura ce cresc articolele.
            </p>
          </div>

          {mappedPosts.length === 0 ? (
            <div className="divet-card-soft rounded-[32px] p-10 text-center">
              <p className="text-sm leading-7 text-[color:var(--dv-muted-strong)]">Autorul nu are inca articole publicate.</p>
            </div>
          ) : (
            <>
              {leadPost && (
                <div className="mb-6">
                  <StoryCard post={leadPost} siteUrl={site.siteUrl} variant="row" priority />
                </div>
              )}

              {gridPosts.length > 0 && (
                <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {gridPosts.map((post) => (
                    <StoryCard key={post.id} post={post} siteUrl={site.siteUrl} />
                  ))}
                </div>
              )}

              {pagination.totalPages > 1 && (
                <nav aria-label="Paginare" className="mt-10 flex flex-wrap items-center justify-center gap-2">
                  {pagination.currentPage > 1 && (
                    <Link
                      href={`/autor/${authorSlug}?page=${pagination.currentPage - 1}`}
                      className="divet-button-ghost inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold"
                    >
                      Anterior
                    </Link>
                  )}
                  {paginationItems.map((item, index) =>
                    item === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-2 text-sm text-[color:var(--dv-muted)]">&hellip;</span>
                    ) : (
                      <Link
                        key={item}
                        href={`/autor/${authorSlug}?page=${item}`}
                        className={`inline-flex h-11 min-w-11 items-center justify-center rounded-full px-4 text-sm font-semibold transition-colors ${
                          item === pagination.currentPage ? 'text-white' : 'text-[color:var(--dv-muted-strong)]'
                        }`}
                        style={item === pagination.currentPage ? { background: 'var(--dv-accent-strong)' } : { background: 'color-mix(in srgb, var(--dv-surface) 78%, transparent)', border: '1px solid var(--dv-border)' }}
                        aria-current={item === pagination.currentPage ? 'page' : undefined}
                      >
                        {item}
                      </Link>
                    )
                  )}
                  {pagination.currentPage < pagination.totalPages && (
                    <Link
                      href={`/autor/${authorSlug}?page=${pagination.currentPage + 1}`}
                      className="divet-button-ghost inline-flex items-center justify-center rounded-full px-4 py-3 text-sm font-semibold"
                    >
                      Urmator
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </DivetLayout>
  )
}
