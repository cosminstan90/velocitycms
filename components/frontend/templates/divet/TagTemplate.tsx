import Link from 'next/link'
import DivetLayout from './DivetLayout'
import { StoryCard, buildPaginationItems, type NavCategoryItem, type StoryPost } from './utils'

interface DivetTagTemplateProps {
  tag: {
    name: string
    slug: string
    description: string | null
    metaTitle: string | null
    metaDesc: string | null
  }
  posts: StoryPost[]
  pagination: { currentPage: number; totalPages: number; totalCount: number }
  site: { siteName: string; siteUrl: string }
  categories?: NavCategoryItem[]
  seoSettings?: { defaultMetaDesc?: string | null; defaultOgImage?: string | null } | null
}

export default function DivetTagTemplate({
  tag,
  posts,
  pagination,
  site,
  categories = [],
  seoSettings,
}: DivetTagTemplateProps) {
  const tagUrl = `${site.siteUrl.replace(/\/$/, '')}/eticheta/${tag.slug}`
  const leadPost = posts[0] ?? null
  const gridPosts = posts.slice(1)
  const paginationItems = buildPaginationItems(pagination.currentPage, pagination.totalPages)

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${tagUrl}/#collectionpage`,
        url: tagUrl,
        name: tag.metaTitle ?? `#${tag.name}`,
        description: tag.metaDesc ?? tag.description ?? undefined,
        isPartOf: { '@id': `${site.siteUrl}/#website` },
        inLanguage: 'ro-RO',
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.siteName, item: site.siteUrl },
          { '@type': 'ListItem', position: 2, name: `#${tag.name}`, item: tagUrl },
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
              <li className="text-[color:var(--dv-muted-strong)]" aria-current="page">#{tag.name}</li>
            </ol>
          </nav>

          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div className="max-w-2xl">
              <p className="divet-kicker text-[11px] font-semibold">Eticheta tematica</p>
              <h1 className="divet-display mt-4 text-5xl leading-[0.95] text-[color:var(--dv-contrast)] sm:text-6xl lg:text-[4.8rem]">
                #{tag.name}
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-[color:var(--dv-muted-strong)] sm:text-lg">
                {tag.description ?? tag.metaDesc ?? 'O pagina de agregare care ar trebui sa te ajute sa continui natural spre alte articole relevante.'}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="divet-chip rounded-full px-4 py-2 text-sm">
                  {pagination.totalCount} {pagination.totalCount === 1 ? 'articol' : 'articole'}
                </span>
                <Link href="/cautare" className="divet-button-ghost rounded-full px-4 py-2 text-sm font-semibold">
                  Cauta alt subiect
                </Link>
              </div>
            </div>

            <div className="divet-card-soft rounded-[34px] p-7 sm:p-8">
              <p className="divet-kicker text-[11px] font-semibold">Cum functioneaza tagul</p>
              <div className="mt-4 space-y-4 text-sm leading-8 text-[color:var(--dv-muted-strong)]">
                <p>Tagurile in DiVet trebuie sa lege contexte apropiate, nu sa dubleze categoriile.</p>
                <p>Pagina ramane utila atunci cand te ajuta sa sari intre rase, comportamente, afectiuni sau subiecte recurente.</p>
                <p>Aici ai o selectie de materiale cu acelasi fir tematic, pregatita pentru explorare mai lunga.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="divet-kicker text-[11px] font-semibold">Materiale asociate</p>
              <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">Articole etichetate cu #{tag.name}</h2>
            </div>
            <p className="text-sm leading-7 text-[color:var(--dv-muted-strong)]">
              O selectie care ar trebui sa te faca sa continui, nu doar sa bifezi un singur click.
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="divet-card-soft rounded-[32px] p-10 text-center">
              <p className="text-sm leading-7 text-[color:var(--dv-muted-strong)]">Nu exista inca articole pentru aceasta eticheta.</p>
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
                      href={`/eticheta/${tag.slug}?page=${pagination.currentPage - 1}`}
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
                        href={`/eticheta/${tag.slug}?page=${item}`}
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
                      href={`/eticheta/${tag.slug}?page=${pagination.currentPage + 1}`}
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
