import Link from 'next/link'
import { getTheme } from './theme'
import DivetLayout from '../templates/divet/DivetLayout'
import type { NavCategoryItem } from '../templates/divet/utils'

export interface StaticPageProps {
  template: string
  page: {
    title: string
    contentHtml: string
  }
  site: { siteName: string; siteUrl: string }
  categories?: NavCategoryItem[]
}

function extractLead(html: string): string | null {
  const match = html.match(/<p[^>]*>(.*?)<\/p>/i)
  if (!match?.[1]) return null

  const text = match[1]
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return text ? text.slice(0, 220) : null
}

export default function StaticPageTemplate({ template, page, site, categories = [] }: StaticPageProps) {
  const t = getTheme(template)
  const lead = extractLead(page.contentHtml)

  if (template === 'divet') {
    return (
      <DivetLayout site={site} categories={categories}>
        <section className="border-b border-[color:var(--dv-border)] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--dv-muted)]">
                <li><Link href="/" className="transition-colors hover:text-[color:var(--dv-contrast)]">{site.siteName}</Link></li>
                <li aria-hidden="true">/</li>
                <li className="text-[color:var(--dv-muted-strong)]" aria-current="page">{page.title}</li>
              </ol>
            </nav>

            <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
              <div className="max-w-2xl">
                <p className="divet-kicker text-[11px] font-semibold">Pagina statica</p>
                <h1 className="divet-display mt-4 text-5xl leading-[0.95] text-[color:var(--dv-contrast)] sm:text-6xl lg:text-[4.9rem]">
                  {page.title}
                </h1>
                {lead && (
                  <p className="mt-5 max-w-xl text-base leading-8 text-[color:var(--dv-muted-strong)] sm:text-lg">
                    {lead}
                  </p>
                )}
              </div>

              <div className="divet-card-soft rounded-[34px] p-7 sm:p-8">
                <p className="divet-kicker text-[11px] font-semibold">De ce arata asa</p>
                <div className="mt-4 space-y-4 text-sm leading-8 text-[color:var(--dv-muted-strong)]">
                  <p>Si paginile statice trebuie sa para parte din aceeasi publicatie, nu o iesire brusca intr-un layout generic.</p>
                  <p>De aceea pastreaza acelasi shell, aceeasi tipografie si acelasi ritm de lectura ca restul experientei DiVet.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <article className="rounded-[34px] border border-[color:var(--dv-border)] bg-[color:var(--dv-surface-strong)] px-6 py-8 sm:px-8 sm:py-10">
              <div className="divet-prose max-w-none">
                <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
              </div>
            </article>
          </div>
        </section>
      </DivetLayout>
    )
  }

  return (
    <div className={`min-h-screen ${t.pageBg}`} style={{ fontFamily: t.fontFamily }}>

      {/* Nav */}
      <nav className={`${t.navBg} border-b ${t.navBorder} sticky top-0 z-50 shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center">
          <Link href="/" className={`text-lg font-black ${t.navLogo} tracking-tight`}>
            {site.siteName}
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-1.5 text-xs text-gray-400">
            <li><Link href="/" className={`${t.accentHoverText} transition-colors`}>{site.siteName}</Link></li>
            <li aria-hidden="true" className="text-gray-300">›</li>
            <li><span className="text-gray-600 font-medium" aria-current="page">{page.title}</span></li>
          </ol>
        </nav>

        <article
          className={`prose prose-lg max-w-none ${t.proseClass}
            prose-headings:font-extrabold prose-headings:text-gray-900
            prose-p:text-gray-700 prose-p:leading-relaxed
            prose-a:no-underline hover:prose-a:underline
            prose-strong:text-gray-900
            prose-img:rounded-xl prose-img:shadow-sm
            prose-blockquote:rounded-r-xl prose-blockquote:py-1
            prose-ul:text-gray-700 prose-ol:text-gray-700`}
        >
          <h1>{page.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
        </article>
      </main>
    </div>
  )
}
