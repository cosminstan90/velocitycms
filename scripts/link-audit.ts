/**
 * Audit de linkuri interne (DOAR CITIRE din baza de date).
 *
 *   node --env-file=.env node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' \
 *     scripts/link-audit.ts [--json] [--out raport.md]
 *
 * Cu SEED_SITE_DOMAIN alegi site-ul (implicit divet.ro). Regulile si limitele raportului sunt in lib/link-audit.ts.
 */
import { writeFileSync } from 'fs'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { buildAudit, formatReport, type AuditPost } from '../lib/link-audit'

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

// Pagini fara intrare in baza de date: rute fixe ale aplicatiei.
const STATIC_PATHS = [
  '/', '/index-a-z', '/cautare', '/blog', '/comparatie', '/instrumente',
  '/instrumente/varsta-caine', '/instrumente/aliment-periculos', '/liste', '/director',
]

async function main() {
  const args = process.argv.slice(2)
  const asJson = args.includes('--json')
  const outIdx = args.indexOf('--out')
  const outFile = outIdx >= 0 ? args[outIdx + 1] : null

  const domain = process.env.SEED_SITE_DOMAIN ?? 'divet.ro'
  const site = await prisma.site.findFirst({ where: { domain } })
  if (!site) throw new Error(`Site-ul ${domain} nu exista in baza`)
  const seo = await prisma.seoSettings.findFirst({ where: { siteId: site.id } })
  const siteUrl = (seo?.siteUrl ?? `https://${domain}`).replace(/\/$/, '')

  const rows = await prisma.post.findMany({
    where: { siteId: site.id, status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      slug: true,
      contentHtml: true,
      publishedAt: true,
      category: { select: { slug: true, parent: { select: { slug: true } } } },
      tags: { select: { tag: { select: { slug: true } } } },
      fieldValues: { select: { value: true, fieldDefinition: { select: { fieldKey: true } } } },
    },
  })

  const posts: AuditPost[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    contentHtml: r.contentHtml,
    groupSlug: r.category?.parent?.slug ?? r.category?.slug ?? null,
    subSlug: r.category?.parent ? r.category.slug : null,
    tagSlugs: r.tags.map((t) => t.tag.slug),
    fields: Object.fromEntries(r.fieldValues.map((v) => [v.fieldDefinition.fieldKey, v.value])),
    publishedAt: r.publishedAt,
  }))

  const [categories, tags, pages, authors] = await Promise.all([
    prisma.category.findMany({ where: { siteId: site.id }, select: { slug: true, parent: { select: { slug: true } } } }),
    prisma.tag.findMany({ where: { siteId: site.id }, select: { slug: true } }),
    prisma.page.findMany({ where: { siteId: site.id, status: 'PUBLISHED' }, select: { slug: true } }),
    prisma.user.findMany({ where: { slug: { not: null } }, select: { slug: true } }),
  ])

  const valid = [
    ...STATIC_PATHS,
    ...categories.map((c) => (c.parent ? `/${c.parent.slug}/${c.slug}` : `/${c.slug}`)),
    ...tags.map((t) => `/eticheta/${t.slug}`),
    ...pages.map((p) => `/${p.slug}`),
    ...authors.map((a) => `/autor/${a.slug}`),
  ]

  const report = buildAudit(posts, valid, siteUrl)
  const output = asJson ? JSON.stringify(report, null, 2) : formatReport(report, new Date().toISOString().slice(0, 10))
  if (outFile) {
    writeFileSync(outFile, output)
    console.error(`Raport scris in ${outFile}`)
  } else {
    console.log(output)
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
