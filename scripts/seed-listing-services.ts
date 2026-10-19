import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 cere un adapter; la fel ca scripts/seed-categories.ts.
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
})

type Type = 'VET' | 'TRAINER' | 'GROOMER'
// [nume, slug]
const SERVICES: Record<Type, string[][]> = {
  VET: [
    ['Vaccinări', 'vaccinari'],
    ['Chirurgie', 'chirurgie'],
    ['Urgențe 24/7', 'urgente-24-7'],
    ['Stomatologie', 'stomatologie'],
    ['Analize de laborator', 'analize-laborator'],
  ],
  TRAINER: [
    ['Dresaj de bază', 'dresaj-de-baza'],
    ['Corectarea comportamentului', 'corectarea-comportamentului'],
    ['Agility', 'agility'],
    ['Dresaj la domiciliu', 'dresaj-la-domiciliu'],
  ],
  GROOMER: [
    ['Tuns', 'tuns'],
    ['Baie', 'baie'],
    ['Deparazitare', 'deparazitare'],
    ['Tuns la domiciliu', 'tuns-la-domiciliu'],
  ],
}

async function main() {
  const domain = process.env.SEED_SITE_DOMAIN ?? 'divet.ro'
  const site = await prisma.site.findFirst({ where: { domain } })
  if (!site) throw new Error(`Site-ul ${domain} nu exista in baza`)

  for (const type of Object.keys(SERVICES) as Type[]) {
    for (const [name, slug] of SERVICES[type]) {
      await prisma.listingService.upsert({
        where: { siteId_type_slug: { siteId: site.id, type, slug } },
        update: { name },
        create: { siteId: site.id, type, name, slug },
      })
      console.log(`serviciu: ${type}/${slug}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
