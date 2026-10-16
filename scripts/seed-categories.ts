import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 cere un adapter; la fel construiesc clientul lib/prisma.ts si prisma/seed.ts.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

type Group = { name: string; slug: string; sortOrder: number; children: string[][] }

// children: [nume, slug]
const GROUPS: Group[] = [
  { name: 'Câini', slug: 'caini', sortOrder: 10, children: [
    ['Rase de câini', 'rase'], ['Îngrijire', 'ingrijire'], ['Sănătate', 'sanatate'],
    ['Dresaj', 'dresaj'], ['Alimentație', 'alimentatie'],
  ]},
  { name: 'Pisici', slug: 'pisici', sortOrder: 20, children: [
    ['Rase de pisici', 'rase'], ['Îngrijire', 'ingrijire'], ['Sănătate', 'sanatate'],
    ['Comportament', 'comportament'],
  ]},
  { name: 'Animale mici', slug: 'animale-mici', sortOrder: 30, children: [
    ['Rozătoare', 'rozatoare'], ['Iepuri', 'iepuri'], ['Dihori', 'dihori'], ['Arici', 'arici'],
  ]},
  { name: 'Păsări', slug: 'pasari', sortOrder: 40, children: [
    ['Papagali', 'papagali'], ['Canari', 'canari'],
    ['Păsări de curte', 'pasari-de-curte'], ['Păsări sălbatice', 'pasari-salbatice'],
  ]},
  { name: 'Acvariu & terariu', slug: 'acvariu-terariu', sortOrder: 50, children: [
    ['Pești de apă dulce', 'pesti-apa-dulce'], ['Pești marini', 'pesti-marini'],
    ['Reptile', 'reptile'], ['Amfibieni', 'amfibieni'], ['Nevertebrate', 'nevertebrate'],
  ]},
  { name: 'Sălbatice', slug: 'salbatice', sortOrder: 60, children: [
    ['Mamifere', 'mamifere'], ['Răpitoare', 'rapitoare'],
    ['Specii protejate', 'specii-protejate'], ['Fauna României', 'fauna-romaniei'],
  ]},
  { name: 'Sănătate', slug: 'sanatate', sortOrder: 70, children: [
    ['Boli', 'boli'], ['Vaccinare', 'vaccinare'],
    ['Parazitologie', 'parazitologie'], ['Urgențe', 'urgente'],
  ]},
]

async function upsert(
  siteId: string, name: string, slug: string, sortOrder: number, parentId: string | null,
) {
  const existing = await prisma.category.findFirst({ where: { siteId, slug, parentId } })
  if (existing) {
    const updated = await prisma.category.update({
      where: { id: existing.id },
      data: { name, sortOrder, showInNav: true },
    })
    console.log(`actualizat: ${slug}`)
    return updated.id
  }
  const created = await prisma.category.create({
    data: { siteId, name, slug, sortOrder, parentId, showInNav: true },
  })
  console.log(`creat: ${slug}`)
  return created.id
}

async function main() {
  const domain = process.env.SEED_SITE_DOMAIN ?? 'divet.ro'
  const site = await prisma.site.findFirst({ where: { domain } })
  if (!site) throw new Error(`Site-ul ${domain} nu exista in baza`)

  for (const g of GROUPS) {
    const parentId = await upsert(site.id, g.name, g.slug, g.sortOrder, null)
    let order = 10
    for (const [childName, childSlug] of g.children) {
      await upsert(site.id, childName, childSlug, order, parentId)
      order += 10
    }
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
