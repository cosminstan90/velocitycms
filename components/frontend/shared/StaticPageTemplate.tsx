import Link from 'next/link'
import { getTheme } from './theme'

export interface StaticPageProps {
  template: string
  page: {
    title: string
    contentHtml: string
  }
  site: { siteName: string; siteUrl: string }
}

export default function StaticPageTemplate({ template, page, site }: StaticPageProps) {
  const t = getTheme(template)

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
