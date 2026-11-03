import { prisma } from '@/lib/prisma'
import { buildPostPath } from '@/lib/seo/canonical-builder'
import { htmlToPlainText } from '@/lib/html-text'
import { HOME_INTRO } from '@/lib/home-content'

export const dynamic = 'force-dynamic'

// Plafon de siguranta: llms-full.txt nu trebuie sa creasca nelimitat odata cu site-ul.
const MAX_CHARS = 4_000_000

/** /llms-full.txt: textul integral al articolelor publicate, pentru motoare AI (llmstxt.org). */
export async function GET() {
  let siteName = 'DiVet'
  let base = 'http://localhost:3000'
  const chunks: string[] = []
  try {
    const site = await prisma.site.findFirst({ where: { isActive: true } })
    const seo = site ? await prisma.seoSettings.findFirst({ where: { siteId: site.id } }) : null
    if (seo?.siteName) siteName = seo.siteName
    if (seo?.siteUrl) base = seo.siteUrl.replace(/\/$/, '')
    if (site) {
      const posts = await prisma.post.findMany({
        where: { siteId: site.id, status: 'PUBLISHED', noIndex: false },
        orderBy: { publishedAt: 'desc' },
        select: {
          title: true,
          slug: true,
          contentHtml: true,
          updatedAt: true,
          category: { select: { slug: true, parent: { select: { slug: true } } } },
        },
      })
      let total = 0
      for (const p of posts) {
        const url = `${base}${buildPostPath({ slug: p.slug }, p.category)}`
        const chunk = [
          `# ${p.title}`,
          `URL: ${url}`,
          `Actualizat: ${p.updatedAt.toISOString().slice(0, 10)}`,
          '',
          htmlToPlainText(p.contentHtml),
        ].join('\n')
        total += chunk.length
        if (total > MAX_CHARS) break
        chunks.push(chunk)
      }
    }
  } catch {
    // baza indisponibila: raspundem doar cu antetul
  }

  const body = [`# ${siteName}`, '', `> ${HOME_INTRO}`, '', ...chunks.flatMap((c) => [c, '', '---', ''])].join('\n')
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
