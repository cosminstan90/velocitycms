import Link from 'next/link'
import type { Metadata } from 'next'
import DivetLayout from '@/components/frontend/templates/divet/DivetLayout'
import Breadcrumbs from '@/components/frontend/templates/divet/Breadcrumbs'
import { buildCollectionSchema } from '@/lib/seo/collection-schema'
import { getToolsSite } from '@/lib/tools/site'

export const dynamic = 'force-dynamic'

const TOOLS = [
  {
    href: '/instrumente/varsta-caine',
    name: 'Vârsta câinelui în ani umani',
    description: 'Echivalentul vârstei câinelui în ani umani, cu formula din studiul Cell Systems 2020 și limitele ei explicate.',
  },
  {
    href: '/instrumente/aliment-periculos',
    name: 'E periculos pentru câine sau pisică?',
    description: 'Caută un aliment sau o substanță și vezi dacă este documentată ca periculoasă, cu link spre articolul cu surse.',
  },
]

export async function generateMetadata(): Promise<Metadata> {
  const { siteName, siteUrl } = await getToolsSite()
  const canonical = `${siteUrl.replace(/\/$/, '')}/instrumente`
  return {
    title: `Instrumente pentru stăpâni de animale | ${siteName}`,
    description: 'Calculatoare și verificatoare pentru stăpânii de câini și pisici, cu metodă explicată și surse linkate.',
    alternates: { canonical },
  }
}

export default async function Page() {
  const { siteName, siteUrl } = await getToolsSite()
  const schema = buildCollectionSchema({
    siteUrl,
    siteName,
    path: '/instrumente',
    name: 'Instrumente',
    description: 'Calculatoare și verificatoare pentru stăpânii de câini și pisici.',
    items: TOOLS.map((t) => ({ name: t.name, path: t.href })),
  })
  return (
    <DivetLayout site={{ siteName, siteUrl }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      <div className="mx-auto w-full max-w-[860px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: 'Instrumente', href: '/instrumente' }]} />
        <h1 className="mt-6 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-dv-ink sm:text-[44px]">Instrumente</h1>
        <p className="mt-3 mb-0 max-w-[65ch] text-dv-body text-dv-ink-muted">
          Calculatoare și verificatoare pentru stăpânii de câini și pisici. Fiecare spune cum funcționează, ce nu poate face și de unde vin datele.
        </p>
        <ul className="mt-8 grid list-none gap-4 p-0 sm:grid-cols-2">
          {TOOLS.map((t) => (
            <li key={t.href} className="rounded-[10px] border border-dv-border bg-dv-surface p-5">
              <h2 className="m-0 font-dv-display text-dv-heading-m font-semibold text-dv-ink">
                <Link href={t.href} className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">{t.name}</Link>
              </h2>
              <p className="mt-2 mb-0 text-dv-body text-dv-ink-muted">{t.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </DivetLayout>
  )
}
