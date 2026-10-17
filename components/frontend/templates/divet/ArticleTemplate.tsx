/**
 * DiVet — ArticleTemplate (fisa de animal / articol)
 *
 * Server component. Campurile custom sunt impartite pe blocuri (lib/fields.ts):
 * tldr, specificatii, profil comportamental, conservare. Aside-ul (profil + cuprins)
 * apare doar cand are ce arata; altfel textul sta singur, centrat.
 * FAQ-ul e randat de FaqSection, din contentJson.
 */

import Image from 'next/image'
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import DivetProgressBar from './DivetProgressBar'
import DivetToc from './DivetToc'
import Breadcrumbs, { type Crumb } from './Breadcrumbs'
import TldrCard from './TldrCard'
import SpecGrid from './SpecGrid'
import BehaviorProfile from './BehaviorProfile'
import RelatedArticles from './RelatedArticles'
import FaqSection from './FaqSection'
import { DV_PROSE } from './prose'
import { resolveImageUrl, formatDateLong, getAuthorInitials } from '../fauna/utils'
import { splitFieldValues, ratingToPercent, iucnLabel } from '@/lib/fields'
import { extractToc, addHeadingIds, readingTimeMinutes } from '@/lib/article-html'
import { buildPostPath } from '@/lib/seo/canonical-builder'
import { extractFaqItems } from '@/lib/faq'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface FieldValueItem {
  fieldDefinitionId: string
  value: string
  fieldDefinition: {
    fieldKey: string
    fieldLabel: string
    fieldType: string
    sortOrder: number
  }
}

type CategoryRef = { name: string; slug: string; parent?: { name: string; slug: string } | null }

interface ArticleTemplateProps {
  post: {
    id: string
    title: string
    slug: string
    excerpt: string | null
    contentHtml: string
    contentJson?: unknown
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
    category: CategoryRef | null
    featuredImage: { url: string; width: number | null; height: number | null; altText: string | null } | null
    tags: Array<{ tag: { id: string; name: string; slug: string } }>
  }
  relatedPosts: Array<{
    id: string
    title: string
    slug: string
    excerpt: string | null
    publishedAt: Date | string | null
    featuredImage: { url: string; altText: string | null } | null
    category: CategoryRef | null
  }>
  site: { siteName: string; siteUrl: string }
  // LEGACY: pastrate doar ca dispatcher-ul si paginile sa compileze; ignorate.
  categories?: unknown
  subCategory?: unknown
  breadcrumbExtra?: unknown
  seoSettings?: unknown
  fieldValues?: FieldValueItem[]
}

const CHIP = 'rounded px-[11px] py-[5px] text-[12px] font-semibold'

function Avatar({
  author,
  siteUrl,
}: {
  author: NonNullable<ArticleTemplateProps['post']['author']>
  siteUrl: string
}) {
  return author.photo ? (
    <span className="relative block size-10 shrink-0 overflow-hidden rounded-full bg-dv-sunken">
      <Image
        src={resolveImageUrl(author.photo, siteUrl)}
        alt={author.name ?? ''}
        fill
        sizes="40px"
        className="object-cover"
      />
    </span>
  ) : (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-full bg-dv-accent text-dv-accent-on text-[13px] font-semibold"
    >
      {getAuthorInitials(author.name, author.email)}
    </span>
  )
}

// ─── Template ─────────────────────────────────────────────────────────────────

export default function ArticleTemplate({
  post,
  relatedPosts,
  site,
  fieldValues = [],
}: ArticleTemplateProps) {
  const category = post.category
  const parent = category?.parent ?? null
  const group = parent ?? category
  const groupSlug = group?.slug ?? null
  const categoryHref = category ? (parent ? `/${parent.slug}/${category.slug}` : `/${category.slug}`) : null

  const { tldr, specs, behavior, conservation } = splitFieldValues(fieldValues)

  const crumbs: Crumb[] = [{ name: 'Acasă', href: '/' }]
  if (group) crumbs.push({ name: group.name, href: `/${group.slug}` })
  if (category && parent) crumbs.push({ name: category.name, href: `/${parent.slug}/${category.slug}` })
  crumbs.push({ name: post.title, href: '#' })

  const talie = specs.find((s) => s.key === 'talie')
  const goodWithKids = behavior.find((b) => b.key === 'bun_cu_copiii')?.value === 'Da'
  const iucn = conservation.find((c) => c.key === 'statut_conservare')

  const toc = extractToc(post.contentHtml)
  const html = addHeadingIds(post.contentHtml)
  const behaviorHasRatings = behavior.some((b) => ratingToPercent(b.value) !== null)
  const hasAside = behaviorHasRatings || toc.length >= 3

  const published = post.publishedAt ? new Date(post.publishedAt) : null
  const updated = new Date(post.updatedAt)
  const showUpdated = published !== null && updated.toISOString().slice(0, 10) !== published.toISOString().slice(0, 10)

  const faqItems = extractFaqItems(post.contentJson)

  const author = post.author
  const hasImage = !!post.featuredImage

  // [&_.faq-block]:hidden: FAQ-ul scris in editor lasa in contentHtml un .faq-block fara text
  // vizibil (textul e in atributul innerhtml); FAQ-ul se randeaza din contentJson de FaqSection.
  const prose = (
    <div
      className={`${DV_PROSE} [&_.faq-block]:hidden`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )

  const main = (
    <>
      {prose}
      <FaqSection items={faqItems} />
    </>
  )

  return (
    <DivetLayout site={site} activeGroup={groupSlug}>
      <DivetProgressBar />
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <article className="flex flex-col gap-6 lg:gap-8">
          <Breadcrumbs items={crumbs} />

          <header
            className={
              hasImage
                ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-9'
                : 'grid gap-6'
            }
          >
            <div className="flex min-w-0 flex-col gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {category && categoryHref ? (
                  <Link
                    href={categoryHref}
                    className={`${CHIP} bg-dv-accent-soft text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent`}
                  >
                    {category.name}
                  </Link>
                ) : null}
                {talie ? (
                  <span className={`${CHIP} bg-dv-sunken text-dv-ink-muted`}>
                    Talie {talie.value.toLowerCase()}
                  </span>
                ) : null}
                {goodWithKids ? (
                  <span className={`${CHIP} bg-dv-sunken text-dv-ink-muted`}>Bun cu copiii</span>
                ) : null}
                {iucn ? (
                  <span className={`${CHIP} bg-dv-sunken text-dv-ink-muted`}>
                    Statut IUCN: {iucnLabel(iucn.value) ?? iucn.value}
                  </span>
                ) : null}
              </div>

              <h1 className="font-dv-display text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-balance sm:text-dv-display-xl">{post.title}</h1>

              {tldr ? (
                <TldrCard text={tldr} />
              ) : post.excerpt ? (
                <p className="text-dv-body text-dv-ink-muted">{post.excerpt}</p>
              ) : null}
            </div>

            {post.featuredImage ? (
              <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] border border-dv-border bg-dv-sunken">
                <Image
                  src={resolveImageUrl(post.featuredImage.url, site.siteUrl)}
                  alt={post.featuredImage.altText ?? post.title}
                  fill
                  priority
                  sizes="(min-width: 1024px) 400px, 100vw"
                  className="object-cover"
                />
              </div>
            ) : null}
          </header>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-dv-border pb-5 text-dv-meta text-dv-ink-muted">
            {author ? (
              <>
                <Avatar author={author} siteUrl={site.siteUrl} />
                <span className="font-semibold text-dv-ink">
                  {author.name ?? author.email}
                  {author.title ? <span className="font-normal text-dv-ink-muted"> · {author.title}</span> : null}
                </span>
              </>
            ) : null}
            {published ? <time dateTime={published.toISOString()}>{formatDateLong(published)}</time> : null}
            <span>{readingTimeMinutes(post.contentHtml)} min citire</span>
            {showUpdated ? (
              <time dateTime={updated.toISOString()}>Actualizat {formatDateLong(updated)}</time>
            ) : null}
          </div>

          <SpecGrid items={specs} />

          {hasAside ? (
            <div className="grid items-start gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-9">
              <aside className="flex flex-col gap-5 lg:sticky lg:top-6">
                <BehaviorProfile items={behavior} />
                {toc.length >= 3 ? <DivetToc entries={toc} /> : null}
              </aside>
              <div className="min-w-0">{main}</div>
            </div>
          ) : (
            <div className="mx-auto w-full max-w-[720px]">{main}</div>
          )}

          {post.tags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 border-t border-dv-border pt-6">
              <span className="text-dv-label font-semibold uppercase text-dv-ink-muted">Etichete</span>
              {post.tags.map(({ tag }) => (
                <Link
                  key={tag.id}
                  href={`/eticheta/${tag.slug}`}
                  className="rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[12px] hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          ) : null}

          {author?.bio ? (
            <div className="flex gap-4 rounded-[10px] border border-dv-border bg-dv-surface p-5">
              <Avatar author={author} siteUrl={site.siteUrl} />
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-dv-title font-semibold">
                  {author.slug ? (
                    <Link
                      href={`/autor/${author.slug}`}
                      className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
                    >
                      {author.name ?? author.email}
                    </Link>
                  ) : (
                    (author.name ?? author.email)
                  )}
                </p>
                {author.title ? <p className="text-dv-meta text-dv-ink-muted">{author.title}</p> : null}
                <p className="text-dv-body text-dv-ink-muted">{author.bio}</p>
              </div>
            </div>
          ) : null}
        </article>

        {group ? (
          <RelatedArticles
            categoryName={group.name}
            categoryHref={`/${group.slug}`}
            posts={relatedPosts.map((p) => ({
              href: buildPostPath({ slug: p.slug }, p.category),
              title: p.title,
              kicker: p.category?.name ?? null,
              image: p.featuredImage
                ? {
                    url: resolveImageUrl(p.featuredImage.url, site.siteUrl),
                    alt: p.featuredImage.altText ?? p.title,
                  }
                : null,
            }))}
          />
        ) : null}
      </div>
    </DivetLayout>
  )
}
