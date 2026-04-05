import Image from 'next/image'
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import { StoryCard, type NavCategoryItem, type StoryPost, getPostUrl, resolveImageUrl, formatDateLong, getReadingTime, slugify } from './utils'

interface ArticleTemplateProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    contentHtml: string
    metaTitle: string | null
    publishedAt: Date | string | null
    updatedAt: Date | string
    author: {
      name: string | null
      email: string
      slug?: string | null
      title?: string | null
      bio?: string | null
      photo?: string | null
      website?: string | null
    } | null
    category: { name: string; slug: string } | null
    featuredImage: {
      url: string
      width: number | null
      height: number | null
      altText: string | null
    } | null
    tags: Array<{ tag: { id: string; name: string; slug: string } }>
  }
  relatedPosts: StoryPost[]
  site: { siteName: string; siteUrl: string }
  categories?: NavCategoryItem[]
  subCategory?: { name: string; slug: string } | null
  breadcrumbExtra?: { name: string; href: string }[]
  seoSettings?: { siteName?: string; defaultOgImage?: string | null; defaultMetaDesc?: string | null } | null
}

interface TocEntry {
  text: string
  id: string
}

function extractH2s(html: string): TocEntry[] {
  const regex = /<h2[^>]*>(.*?)<\/h2>/gi
  const entries: TocEntry[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(html)) !== null) {
    const text = match[1].replace(/<[^>]+>/g, '').trim()
    if (text) entries.push({ text, id: slugify(text) })
  }

  return entries
}

function injectH2Ids(html: string, entries: TocEntry[]): string {
  let result = html

  for (const { text, id } of entries) {
    const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(
      new RegExp(`<h2([^>]*)>((?:(?!<\\/h2>)[\\s\\S])*?${escaped}(?:(?!<\\/h2>)[\\s\\S])*?)<\\/h2>`, 'i'),
      (_match: string, attrs: string, inner: string) => {
        if (/\bid\s*=/.test(attrs)) return `<h2${attrs}>${inner}</h2>`
        return `<h2${attrs} id="${id}">${inner}</h2>`
      }
    )
  }

  return result
}

function buildBreadcrumbs({
  siteName,
  post,
  subCategory,
  breadcrumbExtra,
}: {
  siteName: string
  post: ArticleTemplateProps['post']
  subCategory?: { name: string; slug: string } | null
  breadcrumbExtra?: { name: string; href: string }[]
}) {
  const breadcrumbs: { name: string; href: string | null }[] = [{ name: siteName, href: '/' }]

  if (post.category) {
    breadcrumbs.push({ name: post.category.name, href: `/${post.category.slug}` })
  }

  if (subCategory && post.category) {
    breadcrumbs.push({ name: subCategory.name, href: `/${post.category.slug}/${subCategory.slug}` })
  }

  if (breadcrumbExtra) {
    for (const extra of breadcrumbExtra) breadcrumbs.push({ name: extra.name, href: extra.href })
  }

  breadcrumbs.push({ name: post.title, href: null })
  return breadcrumbs
}

export default function DivetArticleTemplate({
  post,
  relatedPosts,
  site,
  categories = [],
  subCategory,
  breadcrumbExtra,
  seoSettings,
}: ArticleTemplateProps) {
  const toc = extractH2s(post.contentHtml)
  const enrichedHtml = toc.length > 0 ? injectH2Ids(post.contentHtml, toc) : post.contentHtml
  const readingTime = getReadingTime(post.contentHtml)
  const authorName = post.author?.name ?? post.author?.email ?? 'Redactia DiVet'
  const breadcrumbs = buildBreadcrumbs({ siteName: site.siteName, post, subCategory, breadcrumbExtra })
  const articleUrl = `${site.siteUrl.replace(/\/$/, '')}${getPostUrl(post)}`

  return (
    <DivetLayout site={site} categories={categories} activeCategory={post.category?.slug} seoSettings={seoSettings}>
      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--dv-muted)]">
              {breadcrumbs.map((crumb, index) => (
                <li key={`${crumb.name}-${index}`} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">/</span>}
                  {crumb.href ? (
                    <Link href={crumb.href} className="transition-colors hover:text-[color:var(--dv-contrast)]">
                      {crumb.name}
                    </Link>
                  ) : (
                    <span className="text-[color:var(--dv-muted-strong)]" aria-current="page">
                      {crumb.name}
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-14">
            <article className="min-w-0">
              <header className="divet-card overflow-hidden rounded-[34px]">
                <div className="grid gap-0 lg:grid-cols-[minmax(0,0.92fr)_minmax(340px,0.86fr)]">
                  <div className="p-7 sm:p-9">
                    <div className="flex flex-wrap items-center gap-3">
                      {post.category && (
                        <Link
                          href={`/${post.category.slug}`}
                          className="rounded-full px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white"
                          style={{ background: 'var(--dv-forest)' }}
                        >
                          {post.category.name}
                        </Link>
                      )}
                      <span className="rounded-full border border-[color:var(--dv-border)] px-4 py-1.5 text-[11px] uppercase tracking-[0.18em] text-[color:var(--dv-muted-strong)]">
                        {readingTime} min de citit
                      </span>
                    </div>

                    <h1 className="divet-display mt-6 text-4xl leading-tight text-[color:var(--dv-contrast)] sm:text-5xl lg:text-[3.9rem]">
                      {post.title}
                    </h1>

                    {post.excerpt && (
                      <p className="mt-5 max-w-2xl text-base leading-8 text-[color:var(--dv-muted-strong)] sm:text-lg">
                        {post.excerpt}
                      </p>
                    )}

                    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[color:var(--dv-border)] pt-6 text-sm text-[color:var(--dv-muted-strong)]">
                      <div>
                        <p className="divet-kicker text-[11px] font-semibold">Scris de</p>
                        {post.author?.slug ? (
                          <Link href={`/autor/${post.author.slug}`} className="mt-2 block font-semibold text-[color:var(--dv-contrast)] transition-colors hover:text-[color:var(--dv-accent-strong)]">
                            {authorName}
                          </Link>
                        ) : (
                          <p className="mt-2 font-semibold text-[color:var(--dv-contrast)]">{authorName}</p>
                        )}
                      </div>
                      {post.publishedAt && (
                        <div>
                          <p className="divet-kicker text-[11px] font-semibold">Publicat</p>
                          <p className="mt-2">{formatDateLong(post.publishedAt)}</p>
                        </div>
                      )}
                      <div>
                        <p className="divet-kicker text-[11px] font-semibold">Actualizat</p>
                        <p className="mt-2">{formatDateLong(post.updatedAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative min-h-[320px] overflow-hidden lg:min-h-full">
                    {post.featuredImage ? (
                      <Image
                        src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
                        fill
                        alt={post.featuredImage.altText ?? post.title}
                        sizes="(max-width: 1024px) 100vw, 42vw"
                        className="object-cover"
                        priority
                      />
                    ) : (
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'radial-gradient(circle at top left, var(--dv-accent-soft), transparent 32%), radial-gradient(circle at bottom right, var(--dv-forest-soft), transparent 34%), linear-gradient(135deg, var(--dv-bg-strong), var(--dv-surface-strong))',
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  </div>
                </div>
              </header>

              <div className="mt-8 rounded-[34px] border border-[color:var(--dv-border)] bg-[color:var(--dv-surface-strong)] px-6 py-8 sm:px-8 sm:py-10">
                <div className="divet-prose max-w-none" dangerouslySetInnerHTML={{ __html: enrichedHtml }} />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3 rounded-[30px] border border-[color:var(--dv-border)] px-5 py-4">
                <span className="divet-kicker text-[11px] font-semibold">Distribuie</span>
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(articleUrl)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="divet-chip rounded-full px-4 py-2 text-sm transition-colors hover:text-[color:var(--dv-contrast)]"
                >
                  Facebook
                </a>
                <a
                  href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(articleUrl)}&text=${encodeURIComponent(post.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="divet-chip rounded-full px-4 py-2 text-sm transition-colors hover:text-[color:var(--dv-contrast)]"
                >
                  X
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${articleUrl}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="divet-chip rounded-full px-4 py-2 text-sm transition-colors hover:text-[color:var(--dv-contrast)]"
                >
                  WhatsApp
                </a>
              </div>

              {relatedPosts.length > 0 && (
                <section className="mt-12">
                  <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="divet-kicker text-[11px] font-semibold">Continua lectura</p>
                      <h2 className="divet-display mt-3 text-4xl text-[color:var(--dv-contrast)]">Articole din acelasi fir</h2>
                    </div>
                    <Link href="/blog" className="divet-button-ghost inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold">
                      Toata arhiva
                    </Link>
                  </div>
                  <div className="grid gap-6 lg:grid-cols-3">
                    {relatedPosts.map((related) => (
                      <StoryCard key={related.id} post={related} siteUrl={site.siteUrl} />
                    ))}
                  </div>
                </section>
              )}
            </article>

            <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
              <div className="divet-card rounded-[30px] p-6">
                <p className="divet-kicker text-[11px] font-semibold">Semnal editorial</p>
                <p className="divet-display mt-3 text-3xl text-[color:var(--dv-contrast)]">{authorName}</p>
                <p className="mt-3 text-sm leading-7 text-[color:var(--dv-muted-strong)]">
                  {post.author?.bio ?? 'Articol creat pentru lectura clara: informatii utile, ritm bun si un ton care nu te scoate din pagina.'}
                </p>
                {post.author?.website && (
                  <a
                    href={post.author.website}
                    target="_blank"
                    rel="noreferrer"
                    className="divet-button-ghost mt-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold"
                  >
                    Website autor
                  </a>
                )}
              </div>

              <div className="divet-card-soft rounded-[30px] p-6">
                <p className="divet-kicker text-[11px] font-semibold">Pe scurt</p>
                <dl className="mt-4 space-y-4 text-sm text-[color:var(--dv-muted-strong)]">
                  <div>
                    <dt className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--dv-muted)]">Timp de citire</dt>
                    <dd className="mt-2 font-semibold text-[color:var(--dv-contrast)]">{readingTime} minute</dd>
                  </div>
                  {post.category && (
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--dv-muted)]">Categorie</dt>
                      <dd className="mt-2">
                        <Link href={`/${post.category.slug}`} className="font-semibold text-[color:var(--dv-contrast)] transition-colors hover:text-[color:var(--dv-accent-strong)]">
                          {post.category.name}
                        </Link>
                      </dd>
                    </div>
                  )}
                  {post.publishedAt && (
                    <div>
                      <dt className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--dv-muted)]">Prima publicare</dt>
                      <dd className="mt-2 font-semibold text-[color:var(--dv-contrast)]">{formatDateLong(post.publishedAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>

              {toc.length >= 2 && (
                <div className="divet-card-soft rounded-[30px] p-6">
                  <p className="divet-kicker text-[11px] font-semibold">Harta articolului</p>
                  <nav className="mt-4 space-y-3">
                    {toc.map((entry) => (
                      <a
                        key={entry.id}
                        href={`#${entry.id}`}
                        className="block text-sm leading-7 text-[color:var(--dv-muted-strong)] transition-colors hover:text-[color:var(--dv-contrast)]"
                      >
                        {entry.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              {post.tags.length > 0 && (
                <div className="divet-card-soft rounded-[30px] p-6">
                  <p className="divet-kicker text-[11px] font-semibold">Taguri si contexte</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {post.tags.map(({ tag }) => (
                      <Link key={tag.id} href={`/eticheta/${tag.slug}`} className="divet-chip rounded-full px-3 py-2 text-sm transition-colors hover:text-[color:var(--dv-contrast)]">
                        {tag.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </DivetLayout>
  )
}
