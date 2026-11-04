/**
 * DiVet — ToolPage: cadrul comun al paginilor de instrumente (/instrumente/...).
 * Server component: titlu, instrument (copil), explicatii, surse linkate, intrebari frecvente si JSON-LD.
 */
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import FaqSection from './FaqSection'
import { DV_PROSE } from './prose'

export type ToolSource = { label: string; href: string }

export default function ToolPage({
  site,
  path,
  title,
  lead,
  children,
  explainer,
  sources,
  faq,
  activeTool = true,
}: {
  site: { siteName: string; siteUrl: string }
  path: string
  title: string
  lead: string
  children: React.ReactNode
  /** HTML de incredere, scris in cod (nu provine de la utilizatori). */
  explainer: string
  sources: ToolSource[]
  faq: Array<{ question: string; answer: string }>
  activeTool?: boolean
}) {
  const base = site.siteUrl.replace(/\/$/, '')
  const url = `${base}${path}`
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: site.siteName, item: `${base}/` },
          { '@type': 'ListItem', position: 2, name: 'Instrumente', item: `${base}/instrumente` },
          { '@type': 'ListItem', position: 3, name: title, item: url },
        ],
      },
      ...(activeTool
        ? [
            {
              '@type': 'WebApplication',
              '@id': `${url}#app`,
              name: title,
              url,
              description: lead,
              inLanguage: 'ro-RO',
              applicationCategory: 'LifestyleApplication',
              operatingSystem: 'Web',
              isAccessibleForFree: true,
            },
          ]
        : []),
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  }

  return (
    <DivetLayout site={site}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }} />
      <div className="mx-auto w-full max-w-[860px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs
          items={[
            { name: 'Acasă', href: '/' },
            { name: 'Instrumente', href: '/instrumente' },
            { name: title, href: path },
          ]}
        />
        <h1 className="mt-6 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance text-dv-ink sm:text-[44px]">
          {title}
        </h1>
        <p className="mt-3 mb-0 max-w-[65ch] text-dv-body text-dv-ink-muted" data-speakable="tldr">
          {lead}
        </p>

        <div className="mt-8">{children}</div>

        <div className={`${DV_PROSE} mt-10`} dangerouslySetInnerHTML={{ __html: explainer }} />

        {sources.length > 0 ? (
          <section aria-label="Surse" className="mt-8">
            <h2 className="mb-2 font-dv-display text-dv-heading-m font-semibold tracking-tight text-dv-ink">Surse</h2>
            <ul className="m-0 list-disc pl-5 text-dv-body">
              {sources.map((s) => (
                <li key={s.href}>
                  <a href={s.href} rel="noopener" target="_blank" className="text-dv-accent underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <FaqSection items={faq} />
      </div>
    </DivetLayout>
  )
}
