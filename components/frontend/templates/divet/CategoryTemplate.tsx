/**
 * DiVet — CategoryTemplate (listare categorie / grup)
 *
 * Breadcrumbs, titlu, introducere editoriala, subcategorii cu articole recente (silo),
 * grila de ArticleCard, paginare, intrebari frecvente si legaturi catre alte sectiuni.
 * Server component, doar token-uri dv-*.
 */

import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getCategoryContent } from '@/lib/category-content'
import { getSilo } from '@/lib/silo'
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import PostGrid from './PostGrid'
import EmptyState from './EmptyState'
import Pagination from './Pagination'

const focusRing = 'focus-visible:outline-2 focus-visible:outline-dv-accent'

interface CategoryTemplateProps {
  category: {
    id: string
    siteId?: string
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

function plural(n: number): string {
  return n === 1 ? '1 articol' : `${n} articole`
}

export default async function DivetCategoryTemplate({
  category,
  posts,
  pagination,
  site,
  parentCategory,
}: CategoryTemplateProps) {
  const { currentPage, totalPages, totalCount } = pagination
  const groupSlug = parentCategory ? parentCategory.slug : category.slug
  const subSlug = parentCategory ? category.slug : undefined
  const basePath = parentCategory ? `/${parentCategory.slug}/${category.slug}` : `/${category.slug}`
  const content = getCategoryContent(subSlug ? `${groupSlug}/${subSlug}` : groupSlug)
  const firstPage = currentPage === 1

  let siteId = category.siteId ?? null
  if (!siteId) {
    try {
      siteId = (await prisma.site.findFirst({ where: { isActive: true }, select: { id: true } }))?.id ?? null
    } catch {
      siteId = null
    }
  }
  const silo = siteId ? await getSilo(siteId, groupSlug, subSlug) : { subs: [], related: [] }

  const crumbs = [
    { name: 'Acasă', href: '/' },
    ...(parentCategory ? [{ name: parentCategory.name, href: `/${parentCategory.slug}` }] : []),
    { name: category.name, href: basePath },
  ]

  const faqSchema =
    content && firstPage && content.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: content.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
        }
      : null

  return (
    <DivetLayout site={site} activeGroup={groupSlug}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={crumbs} />

        <h1 className="mt-4 font-dv-display text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-balance text-dv-ink sm:text-[44px]">
          {category.name}
        </h1>
        <p className="mt-2 text-dv-meta text-dv-ink-subtle">{plural(totalCount)}</p>

        {firstPage && content ? (
          <div className="mt-4 flex max-w-[70ch] flex-col gap-3">
            {content.intro.map((p, i) => (
              <p key={i} className={`m-0 text-dv-body text-dv-ink-muted ${i === 0 ? 'text-[17px] text-dv-ink' : ''}`}>
                {p}
              </p>
            ))}
          </div>
        ) : category.description ? (
          <p className="mt-3 max-w-[70ch] text-dv-body text-dv-ink-muted">{category.description}</p>
        ) : null}

        {/* Silo: de pe pagina grupului, coboara in subcategorii, cu articolele lor recente */}
        {!parentCategory && silo.subs.length > 0 ? (
          <section aria-labelledby="dv-cat-subs" className="mt-8">
            <h2 id="dv-cat-subs" className="m-0 mb-4 font-dv-display text-[22px] font-semibold text-dv-ink">
              Explorează {category.name}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {silo.subs.map((s) => (
                <div key={s.href} className="rounded-xl border border-dv-border bg-dv-surface p-5">
                  <Link href={s.href} className={`font-dv-display text-[18px] font-semibold text-dv-ink hover:text-dv-accent ${focusRing}`}>
                    {s.name} <span className="text-[13px] font-medium text-dv-ink-subtle">{plural(s.count)}</span>
                  </Link>
                  <ul className="m-0 mt-3 flex list-none flex-col gap-1.5 p-0">
                    {s.latest.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className={`text-[14px] text-dv-ink-muted hover:text-dv-accent ${focusRing}`}>
                          {l.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link href={s.href} className={`mt-3 inline-block text-[13px] font-semibold text-dv-accent hover:text-dv-accent-hover ${focusRing}`}>
                    Toate din {s.name} →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-8">
          {posts.length === 0 ? (
            <EmptyState
              title={`Încă nu avem articole în ${category.name}`}
              description="Revino curând sau caută în restul enciclopediei."
              action={{ label: 'Vezi toate articolele', href: '/index-a-z' }}
            />
          ) : (
            <>
              <h2 className="m-0 mb-4 font-dv-display text-[22px] font-semibold text-dv-ink">
                {parentCategory ? `Toate articolele din ${category.name}` : 'Cele mai noi articole'}
              </h2>
              <PostGrid posts={posts} siteUrl={site.siteUrl} />
            </>
          )}
        </div>

        <Pagination currentPage={currentPage} totalPages={totalPages} basePath={basePath} />

        {/* Silo: de pe pagina unei subcategorii, mergi lateral spre sub-sectiunile surori */}
        {parentCategory && silo.subs.length > 0 ? (
          <section aria-labelledby="dv-cat-siblings" className="mt-12 border-t border-dv-border pt-8">
            <h2 id="dv-cat-siblings" className="m-0 mb-4 font-dv-display text-[22px] font-semibold text-dv-ink">
              Mai multe din{' '}
              <Link href={`/${parentCategory.slug}`} className={`text-dv-accent hover:text-dv-accent-hover ${focusRing}`}>
                {parentCategory.name}
              </Link>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {silo.subs.map((s) => (
                <div key={s.href} className="rounded-xl border border-dv-border bg-dv-surface p-5">
                  <Link href={s.href} className={`font-dv-display text-[17px] font-semibold text-dv-ink hover:text-dv-accent ${focusRing}`}>
                    {s.name} <span className="text-[13px] font-medium text-dv-ink-subtle">{plural(s.count)}</span>
                  </Link>
                  <ul className="m-0 mt-2 flex list-none flex-col gap-1 p-0">
                    {s.latest.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href} className={`text-[14px] text-dv-ink-muted hover:text-dv-accent ${focusRing}`}>
                          {l.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {firstPage && content && content.faq.length > 0 ? (
          <section aria-labelledby="dv-cat-faq" className="mt-12 border-t border-dv-border pt-8">
            <h2 id="dv-cat-faq" className="m-0 mb-4 font-dv-display text-[22px] font-semibold text-dv-ink">
              Întrebări frecvente despre {category.name.toLowerCase()}
            </h2>
            <div className="flex max-w-[78ch] flex-col gap-3">
              {content.faq.map((f) => (
                <details key={f.question} className="group rounded-xl border border-dv-border bg-dv-surface open:border-dv-accent">
                  <summary className={`flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-dv-display text-[16px] font-semibold text-dv-ink [&::-webkit-details-marker]:hidden ${focusRing}`}>
                    {f.question}
                    <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-full bg-dv-accent-soft text-dv-accent transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="m-0 px-5 pb-5 text-[15px] leading-[1.7] text-dv-ink-muted">{f.answer}</p>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        {/* Silo: legaturi contextuale catre alte sectiuni, doar spre grupuri cu articole */}
        {silo.related.length > 0 ? (
          <section aria-labelledby="dv-cat-related" className="mt-12 border-t border-dv-border pt-8">
            <h2 id="dv-cat-related" className="m-0 mb-4 font-dv-display text-[22px] font-semibold text-dv-ink">
              Alte secțiuni
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {silo.related.map((r) => (
                <div key={r.href} className="rounded-xl border border-dv-border bg-dv-surface p-5">
                  <Link href={r.href} className={`font-dv-display text-[18px] font-semibold text-dv-ink hover:text-dv-accent ${focusRing}`}>
                    {r.name} <span className="text-[13px] font-medium text-dv-ink-subtle">{plural(r.count)}</span>
                  </Link>
                  <p className="m-0 mt-2 text-[14px] leading-[1.6] text-dv-ink-muted">{r.blurb}</p>
                  {r.subs.length > 0 ? (
                    <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
                      {r.subs.map((s) => (
                        <li key={s.href}>
                          <Link
                            href={s.href}
                            className={`inline-flex rounded-full border border-dv-border bg-dv-bg px-2.5 py-1 text-[12px] text-dv-ink-muted hover:border-dv-accent hover:text-dv-accent ${focusRing}`}
                          >
                            {s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        ) : null}
      </div>
      {faqSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema).replace(/</g, '\\u003c') }} />
      ) : null}
    </DivetLayout>
  )
}
