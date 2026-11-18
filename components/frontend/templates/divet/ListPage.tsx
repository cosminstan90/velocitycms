/**
 * DiVet — ListPage (/liste/<slug>): lista filtrata de fise, cu intro editorial, criteriile folosite, FAQ si
 * linkuri spre celelalte liste disponibile. Server component.
 */
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import PostGrid from './PostGrid'
import FaqSection from './FaqSection'
import { buildCollectionSchema } from '@/lib/seo/collection-schema'
import { buildPostPath } from '@/lib/seo/canonical-builder'
import type { ListDefinition } from '@/lib/lists'
import type { ListMember } from '@/lib/lists-data'

export default function ListPage({
  site,
  def,
  members,
  others,
}: {
  site: { siteName: string; siteUrl: string }
  def: ListDefinition
  members: ListMember[]
  others: Array<{ slug: string; title: string; count: number }>
}) {
  const path = `/liste/${def.slug}`
  const collection = buildCollectionSchema({
    siteUrl: site.siteUrl,
    siteName: site.siteName,
    path,
    name: def.title,
    description: def.metaDesc,
    crumbs: [{ name: 'Liste', path: '/liste' }],
    items: members.map((m) => ({ name: m.title, path: buildPostPath({ slug: m.slug }, m.category) })),
  })
  const faqSchema = {
    '@type': 'FAQPage',
    mainEntity: def.faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  }
  const schema = { ...collection, '@graph': [...(collection['@graph'] as unknown[]), faqSchema] }

  return (
    <DivetLayout site={site}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: 'Liste', href: '/liste' }, { name: def.title, href: path }]} />
        <h1 className="mt-6 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-dv-ink sm:text-[44px]">
          {def.title}
        </h1>
        <div className="mt-4 flex max-w-[70ch] flex-col gap-3">
          {def.intro.map((p, i) => (
            <p key={i} className="m-0 text-dv-body text-dv-ink-muted">
              {p}
            </p>
          ))}
        </div>
        <p className="mt-4 mb-0 text-dv-meta text-dv-ink-subtle">
          {members.length === 1 ? '1 rasă' : `${members.length} rase`} · {def.criteria}
        </p>

        {def.subject ? (
          <p className="mt-2 mb-0 text-dv-meta text-dv-ink-muted">
            Rasa de referință:{' '}
            <Link href={def.subject.href} className="font-semibold text-dv-accent underline focus-visible:outline-2 focus-visible:outline-dv-accent">
              {def.subject.name}
            </Link>
          </p>
        ) : null}

        {def.curated ? (
          <section aria-labelledby="alternative" className="mt-8 max-w-[760px]">
            <h2 id="alternative" className="mb-4 font-dv-display text-dv-heading-m font-semibold tracking-tight text-dv-ink">
              Alternativele, pe scurt
            </h2>
            <ol className="m-0 flex list-none flex-col gap-4 p-0">
              {members.map((m, i) => {
                const note = def.curated?.find((c) => c.slug === m.slug)?.note
                const href = buildPostPath({ slug: m.slug }, m.category)
                const name = m.title.split(/\s[-–—:]\s|:\s/)[0] ?? m.title
                return (
                  <li key={m.slug} className="rounded-[10px] border border-dv-border bg-dv-surface px-5 py-4">
                    <h3 className="m-0 font-dv-display text-[20px] font-semibold leading-tight tracking-tight text-dv-ink">
                      <span className="mr-2 text-dv-accent">{i + 1}.</span>
                      <Link href={href} className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">
                        {name}
                      </Link>
                    </h3>
                    {note ? <p className="mt-2 mb-0 text-dv-body text-dv-ink">{note}</p> : null}
                  </li>
                )
              })}
            </ol>
          </section>
        ) : null}

        <div className="mt-6">
          <PostGrid posts={members} siteUrl={site.siteUrl} />
        </div>

        <div className="max-w-[720px]">
          <FaqSection items={def.faq} />
        </div>

        {def.sources && def.sources.length > 0 ? (
          <section aria-label="Surse" className="mt-8 max-w-[720px]">
            <h2 className="mb-2 text-dv-label font-semibold uppercase text-dv-ink-muted">Surse</h2>
            <ul className="m-0 flex flex-col gap-1 pl-5 text-dv-meta text-dv-ink-muted">
              {def.sources.map((src) => (
                <li key={src.href}>
                  <a href={src.href} target="_blank" rel="noopener" className="underline hover:text-dv-accent">
                    {src.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {others.length > 0 ? (
          <section aria-label="Alte liste" className="mt-10">
            <h2 className="mb-3 font-dv-display text-dv-heading-m font-semibold tracking-tight text-dv-ink">Alte liste</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {others.map((o) => (
                <li key={o.slug}>
                  <Link href={`/liste/${o.slug}`} className="inline-block rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[13px] hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">
                    {o.title} ({o.count})
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </DivetLayout>
  )
}
