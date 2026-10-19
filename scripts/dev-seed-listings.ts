/**
 * LOCAL-ONLY: fise de proba pentru director (verificare vizuala si de fum).
 *
 * Refuza sa ruleze daca DATABASE_URL nu arata spre 127.0.0.1 sau localhost.
 * Idempotent: fisele se upsert-eaza dupa (siteId, type, citySlug, slug).
 * Ruleaza dupa seed-listing-services.
 *
 * Run:
 *   node --env-file=.env node_modules/ts-node/dist/bin.js \
 *     --compiler-options '{"module":"CommonJS"}' scripts/dev-seed-listings.ts
 */
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

function assertLocalDatabase(): string {
  const raw = process.env.DATABASE_URL
  if (!raw) {
    console.error('ABORT: DATABASE_URL is not set.')
    process.exit(1)
  }
  let host = ''
  try {
    host = new URL(raw).hostname
  } catch {
    console.error('ABORT: DATABASE_URL cannot be parsed.')
    process.exit(1)
  }
  if (host !== '127.0.0.1' && host !== 'localhost') {
    console.error(`ABORT: this script only runs against a local database. Refusing host "${host}".`)
    process.exit(1)
  }
  return raw
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: assertLocalDatabase() }) })

type Type = 'VET' | 'TRAINER' | 'GROOMER'
type Sample = {
  type: Type
  name: string
  slug: string
  county: string
  city: string
  citySlug: string
  address: string
  phone: string
  email?: string
  website?: string
  description: string
  status: 'DRAFT' | 'PUBLISHED'
  services: string[]
}

const WEEK = {
  mon: [{ from: '09:00', to: '18:00' }],
  tue: [{ from: '09:00', to: '18:00' }],
  wed: [{ from: '09:00', to: '18:00' }],
  thu: [{ from: '09:00', to: '18:00' }],
  fri: [{ from: '09:00', to: '18:00' }],
  sat: [{ from: '10:00', to: '14:00' }],
  sun: [],
}

const SAMPLES: Sample[] = [
  { type: 'VET', name: 'Cabinet Veterinar Popescu', slug: 'cabinet-veterinar-popescu', county: 'Cluj', city: 'Cluj-Napoca', citySlug: 'cluj-napoca', address: 'Str. Memorandumului 12', phone: '+40264123456', email: 'contact@popescu-vet.example', website: 'https://popescu-vet.example', description: 'Consultații, vaccinări și chirurgie pentru câini și pisici.', status: 'PUBLISHED', services: ['vaccinari', 'chirurgie', 'urgente-24-7'] },
  { type: 'VET', name: 'Clinica Veterinară Delta', slug: 'clinica-veterinara-delta', county: 'Iași', city: 'Iași', citySlug: 'iasi', address: 'Bd. Independenței 5', phone: '+40721234567', description: 'Clinică cu program non-stop și laborator propriu.', status: 'PUBLISHED', services: ['urgente-24-7', 'analize-laborator'] },
  { type: 'TRAINER', name: 'Școala de Dresaj Alfa', slug: 'scoala-de-dresaj-alfa', county: 'Cluj', city: 'Cluj-Napoca', citySlug: 'cluj-napoca', address: 'Str. Fabricii 3', phone: '+40722333444', website: 'https://alfa-dresaj.example', description: 'Dresaj de bază și corectarea comportamentului, în grup sau individual.', status: 'PUBLISHED', services: ['dresaj-de-baza', 'corectarea-comportamentului'] },
  { type: 'TRAINER', name: 'Dresor Mihai Ionescu', slug: 'dresor-mihai-ionescu', county: 'București', city: 'București', citySlug: 'bucuresti', address: '', phone: '+40723444555', description: 'Dresaj la domiciliu.', status: 'PUBLISHED', services: ['dresaj-la-domiciliu'] },
  { type: 'GROOMER', name: 'Salon Pufi', slug: 'salon-pufi', county: 'Iași', city: 'Iași', citySlug: 'iasi', address: 'Str. Lăpușneanu 8', phone: '+40724555666', email: 'salon@pufi.example', description: 'Tuns, baie și deparazitare pentru câini și pisici.', status: 'PUBLISHED', services: ['tuns', 'baie'] },
  { type: 'GROOMER', name: 'Salon Draft Neterminat', slug: 'salon-draft-neterminat', county: 'Iași', city: 'Iași', citySlug: 'iasi', address: '', phone: '+40725666777', description: 'Fisa nepublicata: trebuie sa dea 404 pe site.', status: 'DRAFT', services: [] },
]

async function main() {
  const site = await prisma.site.findFirst({ where: { domain: process.env.SEED_SITE_DOMAIN ?? 'divet.ro' } })
  if (!site) throw new Error('Site-ul nu exista in baza locala')

  for (const s of SAMPLES) {
    const services = await prisma.listingService.findMany({
      where: { siteId: site.id, type: s.type, slug: { in: s.services } },
      select: { id: true },
    })
    const fields = {
      name: s.name,
      description: s.description,
      county: s.county,
      city: s.city,
      address: s.address || null,
      phone: s.phone,
      email: s.email ?? null,
      website: s.website ?? null,
      openingHours: s.type === 'TRAINER' ? undefined : WEEK,
      status: s.status,
      publishedAt: s.status === 'PUBLISHED' ? new Date() : null,
    }
    const listing = await prisma.listing.upsert({
      where: { siteId_type_citySlug_slug: { siteId: site.id, type: s.type, citySlug: s.citySlug, slug: s.slug } },
      update: fields,
      create: { ...fields, siteId: site.id, type: s.type, citySlug: s.citySlug, slug: s.slug },
    })
    await prisma.listingServiceLink.deleteMany({ where: { listingId: listing.id } })
    await prisma.listingServiceLink.createMany({
      data: services.map((sv) => ({ listingId: listing.id, serviceId: sv.id })),
    })
    console.log(`fisa: ${s.type}/${s.citySlug}/${s.slug} (${s.status})`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
