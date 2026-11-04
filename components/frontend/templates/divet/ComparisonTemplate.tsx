/**
 * DiVet — ComparisonTemplate (/comparatie/[slug])
 *
 * Server component. Tabelul comparativ se genereaza din specificatiile si profilul comportamental ale celor doua
 * fise (lib/comparison.ts): un singur adevar, fara date duplicate. Textul editorial (contentHtml) aduce
 * "cine se potriveste cui", iar verdictul vine din campul `verdict`.
 */
import Image from 'next/image'
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import FaqSection from './FaqSection'
import { DV_PROSE } from './prose'
import { resolveImageUrl } from '../fauna/utils'
import type { CompareRow } from '@/lib/comparison'
import { differingRows } from '@/lib/comparison'
import type { FaqItem } from '@/lib/faq'
import { addHeadingIds } from '@/lib/article-html'

export type ComparedItem = {
  title: string
  href: string
  image: { url: string; altText: string | null } | null
  tldr: string | null
}

type Props = {
  site: { siteName: string; siteUrl: string }
  title: string
  contentHtml: string
  verdict: string | null
  a: ComparedItem
  b: ComparedItem
  rows: CompareRow[]
  faqItems: FaqItem[]
  related: Array<{ title: string; href: string }>
  schema: Record<string, unknown>
}

function Card({ item, siteUrl, label }: { item: ComparedItem; siteUrl: string; label: string }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-[10px] border border-dv-border bg-dv-surface">
      {item.image ? (
        <div className="relative aspect-[4/3] bg-dv-sunken">
          <Image
            src={resolveImageUrl(item.image.url, siteUrl)}
            alt={item.image.altText ?? item.title}
            fill
            sizes="(min-width: 768px) 400px, 100vw"
            className="object-cover"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="m-0 text-dv-label font-semibold uppercase text-dv-accent">{label}</p>
        <h2 className="m-0 font-dv-display text-[20px] font-semibold leading-tight tracking-tight text-dv-ink">{item.title}</h2>
        {item.tldr ? <p className="m-0 text-dv-meta text-dv-ink-muted">{item.tldr}</p> : null}
        <Link href={item.href} className="mt-auto pt-2 font-semibold text-dv-accent underline focus-visible:outline-2 focus-visible:outline-dv-accent">
          Vezi fișa completă
        </Link>
      </div>
    </div>
  )
}

export default function DivetComparison({ site, title, contentHtml, verdict, a, b, rows, faqItems, related, schema }: Props) {
  const differences = differingRows(rows).length
  const html = addHeadingIds(contentHtml)

  return (
    <DivetLayout site={site}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      <div className="mx-auto w-full max-w-[1000px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs
          items={[
            { name: 'Acasă', href: '/' },
            { name: 'Comparații', href: '/comparatie' },
            { name: title, href: '#' },
          ]}
        />
        <h1 className="mt-6 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-dv-ink sm:text-[44px]">
          {title}
        </h1>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Card item={a} siteUrl={site.siteUrl} label="Fișa A" />
          <Card item={b} siteUrl={site.siteUrl} label="Fișa B" />
        </div>

        {rows.length > 0 ? (
          <section aria-labelledby="tabel-comparativ" className="mt-8">
            <h2 id="tabel-comparativ" className="mb-3 font-dv-display text-dv-heading-m font-semibold tracking-tight text-dv-ink">
              Comparație pe scurt
            </h2>
            <p className="mt-0 mb-3 text-dv-meta text-dv-ink-muted">
              {differences === 0 ? 'Cele două sunt identice pe toate criteriile din fișe.' : `Diferă pe ${differences} din ${rows.length} criterii.`} Datele vin din fișele celor două.
            </p>
            <div className="overflow-x-auto rounded-[10px] border border-dv-border">
              <table className="w-full border-collapse text-left text-dv-body">
                <thead className="bg-dv-sunken text-dv-meta text-dv-ink-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3 font-semibold">Criteriu</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{a.title}</th>
                    <th scope="col" className="px-4 py-3 font-semibold">{b.title}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.key} className="border-t border-dv-border">
                      <th scope="row" className="px-4 py-3 font-semibold text-dv-ink-muted">{r.label}</th>
                      <td className={`px-4 py-3 ${!r.same && r.a ? 'font-semibold text-dv-ink' : 'text-dv-ink'}`}>{r.a ?? '—'}</td>
                      <td className={`px-4 py-3 ${!r.same && r.b ? 'font-semibold text-dv-ink' : 'text-dv-ink'}`}>{r.b ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        {verdict ? (
          <section aria-label="Verdict" className="mt-8 rounded-[10px] border border-dv-border bg-dv-accent-soft px-[22px] py-5" data-speakable="tldr">
            <h2 className="mb-2 text-dv-label font-semibold uppercase text-dv-accent">Pe scurt</h2>
            <p className="m-0 text-dv-body text-dv-ink">{verdict}</p>
          </section>
        ) : null}

        <div className={`${DV_PROSE} mt-8 max-w-[720px]`} dangerouslySetInnerHTML={{ __html: html }} />
        <div className="max-w-[720px]">
          <FaqSection items={faqItems} />
        </div>

        {related.length > 0 ? (
          <section aria-label="Alte comparații" className="mt-10">
            <h2 className="mb-3 font-dv-display text-dv-heading-m font-semibold tracking-tight text-dv-ink">Alte comparații</h2>
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              {related.map((r) => (
                <li key={r.href}>
                  <Link href={r.href} className="inline-block rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[13px] hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">
                    {r.title}
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
