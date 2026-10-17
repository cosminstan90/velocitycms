/**
 * DiVet — PageTemplate (pagina statica: despre noi, contact, termeni etc.)
 *
 * Server component. Pastreaza antetul, navigatia si subsolul site-ului, ca o pagina
 * statica sa nu para o iesire in alt layout.
 */

import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import { DV_PROSE } from './prose'

export default function DivetPageTemplate({
  page,
  site,
}: {
  page: { title: string; contentHtml: string }
  site: { siteName: string; siteUrl: string }
}) {
  return (
    <DivetLayout site={site}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs
          items={[
            { name: 'Acasă', href: '/' },
            { name: page.title, href: '#' },
          ]}
        />
        <article className="mx-auto mt-6 max-w-[720px] pb-10">
          <h1 className="font-dv-display text-[34px] font-bold leading-[1.08] tracking-[-0.03em] text-balance sm:text-[44px]">
            {page.title}
          </h1>
          <div className={`${DV_PROSE} mt-6`} dangerouslySetInnerHTML={{ __html: page.contentHtml }} />
        </article>
      </div>
    </DivetLayout>
  )
}
