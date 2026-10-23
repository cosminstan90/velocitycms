import { prisma } from '@/lib/prisma'
import { getNavigation } from '@/lib/navigation'
import { HOME_INTRO } from '@/lib/home-content'

export const dynamic = 'force-dynamic'

/** /llms.txt: rezumat pentru motoare AI (llmstxt.org): ce este site-ul si hartile principale. Generat din baza de date. */
export async function GET() {
  let siteName = 'DiVet'
  let base = 'http://localhost:3000'
  const lines: string[] = []
  try {
    const site = await prisma.site.findFirst({ where: { isActive: true } })
    const seo = site ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } }) : null
    if (seo?.siteName) siteName = seo.siteName
    if (seo?.siteUrl) base = seo.siteUrl.replace(/\/$/, '')
    if (site) {
      const groups = await getNavigation(site.id)
      for (const g of groups) {
        lines.push(`- [${g.name}](${base}${g.href})`)
        for (const c of g.children) lines.push(`  - [${c.name}](${base}${c.href})`)
      }
    }
  } catch {
    // baza indisponibila: raspundem cu partea statica
  }

  const body = [
    `# ${siteName}`,
    '',
    `> ${HOME_INTRO}`,
    '',
    'Conținutul este în limba română. Fiecare fișă are un rezumat, specificații, întrebări frecvente și, acolo unde este cazul, o comparație cu specii apropiate. Informațiile sunt orientative și nu înlocuiesc sfatul unui medic veterinar.',
    '',
    '## Secțiuni',
    ...(lines.length ? lines : [`- [Prima pagină](${base}/)`]),
    '',
    '## Pentru navigare',
    `- [Index A–Z](${base}/index-a-z)`,
    `- [Sitemap](${base}/sitemap.xml)`,
    `- [Căutare](${base}/cautare)`,
    '',
  ].join('\n')

  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' } })
}
