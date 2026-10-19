# Director de fișe (faza 2, sub-proiectul 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Directorul de cabinete veterinare, dresori și saloane de toaletaj pe divet.ro: model `Listing`, administrare, pagini publice `/director/...`, JSON-LD, sitemap, fără plăți și fără înscriere publică.

**Architecture:** Model dedicat `Listing` (+ `ListingService`, legătură n–n), scoped pe `siteId`. Logica pură (validări, URL-uri, JSON-LD, interogări) stă în `lib/` și are teste Vitest; rutele API urmează tiparul `app/api/categories`; paginile publice sunt `force-dynamic` și folosesc componentele `templates/divet`. Directorul funcționează doar cu template-ul `divet`.

**Tech Stack:** Next.js 16 (App Router), Prisma 7 + `@prisma/adapter-pg`, PostgreSQL 17, Tailwind v4 (tokeni `dv-`), Vitest.

**Spec:** `docs/superpowers/specs/2026-10-19-director-listings-design.md`

**Clarificări față de spec** (decise la scrierea planului, de aplicat în Task 13 și în spec):
- `county`, `city`, `name` sunt obligatorii și pentru `DRAFT` (cheia de unicitate folosește `citySlug`); la publicare se cere în plus telefon sau e-mail.
- Paginile publice nu au cache (`force-dynamic`), deci scrierile din API nu apelează `revalidateTag`.
- `/director` și `/director/<tip>` fără fișe dau 200 cu stare goală și `noindex`; `/director/<tip>/<oras>` fără fișe dă 404.
- Testul de fum: fișele publicate apar în sitemap și sunt verificate automat; 404-ul pentru `DRAFT` se verifică local (Task 13), nu în `smoke.sh`.

**Reguli ale repo-ului (valabile în toate taskurile):**
- Lucrează pe branch-ul `feat/director-fise`, creat din `main` actualizat (Task 1, Step 1). Nu lucra direct pe `main`.
- Cod și comentarii în stilul existent (comentarii scurte în română, fără hex în componente: doar tokeni `dv-`).
- Nu edita `prisma/migrations/0_init`. Migrările se generează cu `prisma migrate diff` și se aplică cu `migrate deploy`.
- Niciun `export const revalidate` în `app/(frontend)`; rutele publice au `export const dynamic = 'force-dynamic'`.
- Parametrul `?page=` se citește doar cu `parsePageParam` din `@/lib/pagination`.
- Commit-urile se termină cu: `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Verificare după fiecare task: `npx vitest run` (toate trec) și `npx tsc --noEmit` (0 erori). Dacă un server `next dev` rulează, `tsc` poate arăta erori trecătoare din `.next/types`: așteaptă câteva secunde și rulează din nou.
- Baza locală: PostgreSQL pe portul 5433 (`D:\Projects\Velocity\.devdb\pg17`); pornire: `"/c/Program Files/PostgreSQL/17/bin/pg_ctl.exe" -D "D:/Projects/Velocity/.devdb/pg17" -l "D:/Projects/Velocity/.devdb/pg17.log" start`. Comanda poate bloca shell-ul: rulează-o în fundal. Nu atinge serviciul de pe 5432.

---

## Structura fișierelor

| Fișier | Rol |
|---|---|
| `lib/listings.ts` (nou) | tipuri, segmente URL, validări (telefon, site, e-mail, program), `parseListingInput`, `nextFreeSlug`, slug-uri rezervate |
| `lib/listings.test.ts` (nou) | testele pentru de mai sus |
| `lib/director.ts` (nou) | `buildListingWhere`, `resolveCounty`, `summarizeDirectory`, `listingCard`, încărcători Prisma pentru paginile publice |
| `lib/director.test.ts` (nou) | teste pentru funcțiile pure |
| `lib/seo/listing-schema.ts` (nou) | JSON-LD `LocalBusiness`/`VeterinaryCare` + `BreadcrumbList` |
| `lib/seo/listing-schema.test.ts` (nou) | teste |
| `prisma/schema.prisma` (modificat) | modelele și enum-urile noi |
| `prisma/migrations/20261019120000_listings/migration.sql` (nou) | migrarea aditivă |
| `app/api/listings/route.ts`, `app/api/listings/[id]/route.ts` (noi) | CRUD fișe |
| `app/api/listing-services/route.ts`, `app/api/listing-services/[id]/route.ts` (noi) | CRUD servicii |
| `app/api/categories/route.ts`, `app/api/categories/[id]/route.ts` (modificate) | respinge slug-ul rezervat `director` |
| `scripts/seed-listing-services.ts`, `scripts/dev-seed-listings.ts` (noi); `deploy-pm2.sh` (modificat) | seed-uri |
| `components/frontend/templates/divet/ListingCard.tsx`, `DirectoryIndexTemplate.tsx`, `DirectoryListTemplate.tsx`, `ListingTemplate.tsx` (noi) | UI public |
| `components/frontend/templates/divet/DivetNav.tsx`, `DivetLayout.tsx` (modificate) | link „Director" |
| `app/(frontend)/director/page.tsx`, `[type]/page.tsx`, `[type]/[city]/page.tsx`, `[type]/[city]/[slug]/page.tsx` (noi) | rute publice |
| `app/sitemap.ts` (modificat) | intrări director |
| `components/admin/AdminSidebar.tsx` (modificat); `app/(admin)/admin/director/page.tsx`, `[id]/page.tsx`, `servicii/page.tsx`; `components/admin/ListingForm.tsx` (noi) | administrare |

---

### Task 1: Logica pură a fișelor (`lib/listings.ts`)

**Files:**
- Create: `lib/listings.ts`
- Test: `lib/listings.test.ts`

- [ ] **Step 1: Pregătește branch-ul**

```bash
cd D:/Projects/Velocity/velocitycms
git checkout main && git pull --ff-only origin main
git checkout -b feat/director-fise
git status --short   # trebuie sa fie gol
```

- [ ] **Step 2: Scrie testele (eșuează: modulul nu există)**

Creează `lib/listings.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  LISTING_TYPES,
  typeFromSegment,
  listingPath,
  cityListPath,
  typeListPath,
  isReservedRootSlug,
  normalizePhone,
  formatPhone,
  normalizeWebsite,
  isValidEmail,
  parseOpeningHours,
  parseListingInput,
  nextFreeSlug,
} from './listings'

describe('segmente si URL-uri', () => {
  it('mapeaza segmentele la tipuri si invers', () => {
    expect(typeFromSegment('veterinari')).toBe('VET')
    expect(typeFromSegment('dresori')).toBe('TRAINER')
    expect(typeFromSegment('toaletaj')).toBe('GROOMER')
    expect(typeFromSegment('altceva')).toBeNull()
    expect(LISTING_TYPES).toHaveLength(3)
  })
  it('construieste caile', () => {
    expect(typeListPath('VET')).toBe('/director/veterinari')
    expect(cityListPath('TRAINER', 'cluj-napoca')).toBe('/director/dresori/cluj-napoca')
    expect(listingPath({ type: 'GROOMER', citySlug: 'iasi', slug: 'salon-pufi' })).toBe(
      '/director/toaletaj/iasi/salon-pufi',
    )
  })
  it('director este slug rezervat', () => {
    expect(isReservedRootSlug('director')).toBe(true)
    expect(isReservedRootSlug('caini')).toBe(false)
  })
})

describe('normalizePhone', () => {
  it.each([
    ['0721 234 567', '+40721234567'],
    ['+40 721 234 567', '+40721234567'],
    ['0040721234567', '+40721234567'],
    ['+40 (0)21 123 4567', '+40211234567'],
    ['021.123.4567', '+40211234567'],
    ['40721234567', '+40721234567'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })
  it.each(['', '123', '0821234567', '07212345', 'abc', '+1 555 123 4567'])('respinge %j', (input) => {
    expect(normalizePhone(input)).toBeNull()
  })
  it('formateaza pentru afisare', () => {
    expect(formatPhone('+40721234567')).toBe('0721 234 567')
    expect(formatPhone('+40211234567')).toBe('021 123 4567')
  })
})

describe('normalizeWebsite', () => {
  it('adauga https si scoate slash-ul final al radacinii', () => {
    expect(normalizeWebsite('divet.ro')).toBe('https://divet.ro')
    expect(normalizeWebsite('https://x.ro/')).toBe('https://x.ro')
    expect(normalizeWebsite('http://x.ro/cabinet/')).toBe('http://x.ro/cabinet/')
  })
  it.each(['', 'ftp://x.ro', 'javascript:alert(1)', 'nu e site', 'localhost'])('respinge %j', (input) => {
    expect(normalizeWebsite(input)).toBeNull()
  })
})

describe('isValidEmail', () => {
  it('accepta si respinge', () => {
    expect(isValidEmail('a@b.ro')).toBe(true)
    expect(isValidEmail('a b@c.ro')).toBe(false)
    expect(isValidEmail('abc')).toBe(false)
    expect(isValidEmail('a@b')).toBe(false)
  })
})

describe('parseOpeningHours', () => {
  it('completeaza zilele lipsa cu "inchis"', () => {
    const r = parseOpeningHours({ mon: [{ from: '09:00', to: '17:00' }] })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.value.mon).toEqual([{ from: '09:00', to: '17:00' }])
      expect(r.value.sun).toEqual([])
    }
  })
  it.each([
    [null],
    [[]],
    [{ lun: [] }],
    [{ mon: [{ from: '17:00', to: '09:00' }] }],
    [{ mon: [{ from: '9:00', to: '17:00' }] }],
    [{ mon: [{ from: '09:00', to: '10:00' }, { from: '11:00', to: '12:00' }, { from: '13:00', to: '14:00' }, { from: '15:00', to: '16:00' }] }],
  ])('respinge %j', (input) => {
    expect(parseOpeningHours(input).ok).toBe(false)
  })
})

describe('parseListingInput', () => {
  const base = {
    type: 'VET',
    name: 'Cabinet Vet Popescu',
    county: 'Cluj',
    city: 'Cluj-Napoca',
    phone: '0721 234 567',
  }
  it('accepta un document minim si normalizeaza', () => {
    const r = parseListingInput({ ...base, website: 'popescu.ro' })
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.phone).toBe('+40721234567')
      expect(r.data.website).toBe('https://popescu.ro')
      expect(r.data.status).toBe('DRAFT')
      expect(r.data.serviceIds).toEqual([])
      expect(r.data.description).toBeNull()
    }
  })
  it.each([
    ['tip invalid', { ...base, type: 'XYZ' }],
    ['nume prea scurt', { ...base, name: 'A' }],
    ['fara judet', { ...base, county: ' ' }],
    ['fara oras', { ...base, city: '' }],
    ['telefon invalid', { ...base, phone: '123' }],
    ['email invalid', { ...base, email: 'nu-e-email' }],
    ['site invalid', { ...base, website: 'ftp://x.ro' }],
    ['status necunoscut', { ...base, status: 'ARCHIVED' }],
    ['servicii nu e lista', { ...base, serviceIds: 'a' }],
    ['corp lipsa', null],
  ])('respinge: %s', (_label, body) => {
    expect(parseListingInput(body).ok).toBe(false)
  })
  it('publicarea cere telefon sau e-mail', () => {
    const noContact = { ...base, phone: '', status: 'PUBLISHED' }
    expect(parseListingInput(noContact).ok).toBe(false)
    expect(parseListingInput({ ...noContact, email: 'a@b.ro' }).ok).toBe(true)
    expect(parseListingInput({ ...base, status: 'PUBLISHED' }).ok).toBe(true)
  })
  it('slug explicit trece prin slugify', () => {
    const r = parseListingInput({ ...base, slug: 'Şerban Vet' })
    expect(r.ok && r.data.slug).toBe('serban-vet')
  })
  it('elimina duplicatele din serviceIds', () => {
    const r = parseListingInput({ ...base, serviceIds: ['a', 'a', 'b'] })
    expect(r.ok && r.data.serviceIds).toEqual(['a', 'b'])
  })
})

describe('nextFreeSlug', () => {
  it('foloseste baza daca e libera', async () => {
    expect(await nextFreeSlug(async () => false, 'vet')).toBe('vet')
  })
  it('adauga sufix numeric pana gaseste unul liber', async () => {
    const taken = new Set(['vet', 'vet-2'])
    expect(await nextFreeSlug(async (s) => taken.has(s), 'vet')).toBe('vet-3')
  })
  it('renunta dupa 50 de incercari', async () => {
    await expect(nextFreeSlug(async () => true, 'vet')).rejects.toThrow()
  })
})
```

- [ ] **Step 3: Rulează testele, trebuie să pice**

Run: `npx vitest run lib/listings.test.ts`
Expected: FAIL (`Failed to resolve import "./listings"`).

- [ ] **Step 4: Implementează `lib/listings.ts`**

```ts
import { slugify } from '@/lib/slugify'

// ── Tipuri si URL-uri ────────────────────────────────────────────────────────

export const LISTING_TYPES = ['VET', 'TRAINER', 'GROOMER'] as const
export type ListingType = (typeof LISTING_TYPES)[number]
export type ListingStatus = 'DRAFT' | 'PUBLISHED'

export const TYPE_SEGMENT: Record<ListingType, string> = {
  VET: 'veterinari',
  TRAINER: 'dresori',
  GROOMER: 'toaletaj',
}

export const TYPE_LABEL: Record<ListingType, { singular: string; plural: string }> = {
  VET: { singular: 'Cabinet veterinar', plural: 'Cabinete veterinare' },
  TRAINER: { singular: 'Dresor', plural: 'Dresori și școli de dresaj' },
  GROOMER: { singular: 'Salon de toaletaj', plural: 'Saloane de toaletaj' },
}

/** Grupul de articole (categorie radacina) legat de fiecare tip, pentru "articole din aceeasi zona". */
export const TYPE_ARTICLE_GROUP: Record<ListingType, string> = {
  VET: 'sanatate',
  TRAINER: 'caini',
  GROOMER: 'caini',
}

export function isListingType(value: unknown): value is ListingType {
  return typeof value === 'string' && (LISTING_TYPES as readonly string[]).includes(value)
}

export function typeFromSegment(segment: string): ListingType | null {
  return LISTING_TYPES.find((t) => TYPE_SEGMENT[t] === segment) ?? null
}

export const typeListPath = (type: ListingType) => `/director/${TYPE_SEGMENT[type]}`
export const cityListPath = (type: ListingType, citySlug: string) => `${typeListPath(type)}/${citySlug}`
export const listingPath = (l: { type: ListingType; citySlug: string; slug: string }) =>
  `${cityListPath(l.type, l.citySlug)}/${l.slug}`

/** Slug-uri de nivel radacina pe care nicio categorie nu le poate folosi (rute statice ale aplicatiei). */
export const RESERVED_ROOT_SLUGS = ['director']
export const isReservedRootSlug = (slug: string) => RESERVED_ROOT_SLUGS.includes(slug)

// ── Telefon, site, e-mail ───────────────────────────────────────────────────

/** "+40XXXXXXXXX" sau null. Accepta 07.., +40.., 0040.., 40.., "(0)" si separatori uzuali. */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/\(0\)/g, '').replace(/[^\d+]/g, '')
  let rest: string
  if (cleaned.startsWith('+40')) rest = cleaned.slice(3)
  else if (cleaned.startsWith('0040')) rest = cleaned.slice(4)
  else if (cleaned.startsWith('0')) rest = cleaned.slice(1)
  else if (cleaned.startsWith('40') && cleaned.length === 11) rest = cleaned.slice(2)
  else return null
  // mobil 7XXXXXXXX; fix 2XXXXXXXX / 3XXXXXXXX (9 cifre fara prefixul 0)
  return /^[237]\d{8}$/.test(rest) ? `+40${rest}` : null
}

/** "+40721234567" -> "0721 234 567"; fix: "021 123 4567". */
export function formatPhone(e164: string): string {
  const national = `0${e164.replace(/^\+40/, '')}`
  if (national.startsWith('07')) return `${national.slice(0, 4)} ${national.slice(4, 7)} ${national.slice(7)}`
  return `${national.slice(0, 3)} ${national.slice(3, 6)} ${national.slice(6)}`
}

/** URL http(s) valid cu domeniu, sau null. Adauga https:// cand lipseste schema. */
export function normalizeWebsite(input: string): string | null {
  const raw = input.trim()
  if (!raw || /\s/.test(raw)) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`
  let url: URL
  try {
    url = new URL(withScheme)
  } catch {
    return null
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
  if (!url.hostname.includes('.')) return null
  const out = url.toString()
  return url.pathname === '/' && !url.search && !url.hash ? out.slice(0, -1) : out
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input)
}

// ── Program ──────────────────────────────────────────────────────────────────

export const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
export type Day = (typeof DAYS)[number]
export const DAY_LABEL: Record<Day, string> = {
  mon: 'Luni',
  tue: 'Marți',
  wed: 'Miercuri',
  thu: 'Joi',
  fri: 'Vineri',
  sat: 'Sâmbătă',
  sun: 'Duminică',
}
export type Interval = { from: string; to: string }
export type OpeningHours = Record<Day, Interval[]>

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export function parseOpeningHours(
  input: unknown,
): { ok: true; value: OpeningHours } | { ok: false; error: string } {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, error: 'Programul trebuie să fie un obiect' }
  }
  const src = input as Record<string, unknown>
  for (const key of Object.keys(src)) {
    if (!(DAYS as readonly string[]).includes(key)) return { ok: false, error: `Zi necunoscută: ${key}` }
  }
  const value = {} as OpeningHours
  for (const day of DAYS) {
    const raw = src[day] ?? []
    if (!Array.isArray(raw) || raw.length > 3) return { ok: false, error: `Program invalid pentru ${DAY_LABEL[day]}` }
    const intervals: Interval[] = []
    for (const item of raw) {
      const it = item as { from?: unknown; to?: unknown } | null
      const from = it?.from
      const to = it?.to
      if (typeof from !== 'string' || typeof to !== 'string' || !TIME.test(from) || !TIME.test(to) || from >= to) {
        return { ok: false, error: `Interval invalid pentru ${DAY_LABEL[day]}` }
      }
      intervals.push({ from, to })
    }
    value[day] = intervals
  }
  return { ok: true, value }
}

// ── Documentul fisei (corpul API) ────────────────────────────────────────────

export type ListingInput = {
  type: ListingType
  name: string
  description: string | null
  county: string
  city: string
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  openingHours: OpeningHours | null
  status: ListingStatus
  serviceIds: string[]
  slug?: string
}

type Parsed = { ok: true; data: ListingInput } | { ok: false; error: string }
const fail = (error: string): Parsed => ({ ok: false, error })
const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** Valideaza si normalizeaza corpul unei fise (creare sau inlocuire completa). */
export function parseListingInput(body: unknown): Parsed {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return fail('Corp invalid')
  const b = body as Record<string, unknown>

  if (!isListingType(b.type)) return fail('Tip invalid')
  const type = b.type
  const name = text(b.name)
  if (name.length < 2 || name.length > 255) return fail('Numele trebuie să aibă între 2 și 255 de caractere')
  const county = text(b.county)
  if (!county || county.length > 100) return fail('Județul este obligatoriu (max. 100 de caractere)')
  const city = text(b.city)
  if (!city || city.length > 100) return fail('Orașul este obligatoriu (max. 100 de caractere)')

  const description = text(b.description)
  if (description.length > 5000) return fail('Descrierea poate avea cel mult 5000 de caractere')
  const address = text(b.address)
  if (address.length > 255) return fail('Adresa poate avea cel mult 255 de caractere')

  let phone: string | null = null
  const rawPhone = text(b.phone)
  if (rawPhone) {
    phone = normalizePhone(rawPhone)
    if (!phone) return fail('Telefon invalid')
  }

  const email = text(b.email)
  if (email && (email.length > 255 || !isValidEmail(email))) return fail('E-mail invalid')

  let website: string | null = null
  const rawWebsite = text(b.website)
  if (rawWebsite) {
    website = normalizeWebsite(rawWebsite)
    if (!website || website.length > 255) return fail('Adresa site-ului este invalidă')
  }

  let openingHours: OpeningHours | null = null
  if (b.openingHours !== undefined && b.openingHours !== null) {
    const parsed = parseOpeningHours(b.openingHours)
    if (!parsed.ok) return fail(parsed.error)
    openingHours = parsed.value
  }

  let status: ListingStatus = 'DRAFT'
  if (b.status !== undefined) {
    if (b.status !== 'DRAFT' && b.status !== 'PUBLISHED') return fail('Status invalid')
    status = b.status
  }
  if (status === 'PUBLISHED' && !phone && !email) return fail('Pentru publicare e nevoie de telefon sau e-mail')

  let serviceIds: string[] = []
  if (b.serviceIds !== undefined) {
    if (!Array.isArray(b.serviceIds) || !b.serviceIds.every((s) => typeof s === 'string' && s.length > 0)) {
      return fail('Lista de servicii este invalidă')
    }
    serviceIds = [...new Set(b.serviceIds as string[])]
    if (serviceIds.length > 30) return fail('Cel mult 30 de servicii')
  }

  const data: ListingInput = {
    type,
    name,
    description: description || null,
    county,
    city,
    address: address || null,
    phone,
    email: email || null,
    website,
    openingHours,
    status,
    serviceIds,
  }
  const rawSlug = text(b.slug)
  if (rawSlug) {
    const slug = slugify(rawSlug)
    if (!slug) return fail('Slug invalid')
    data.slug = slug
  }
  return { ok: true, data }
}

/** Primul slug liber dintre `base`, `base-2`, `base-3`, ...; arunca dupa 50 de incercari. */
export async function nextFreeSlug(isTaken: (slug: string) => Promise<boolean>, base: string): Promise<string> {
  for (let n = 1; n <= 50; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`
    if (!(await isTaken(candidate))) return candidate
  }
  throw new Error(`Nu am gasit un slug liber pentru "${base}"`)
}
```

- [ ] **Step 5: Rulează testele, trebuie să treacă**

Run: `npx vitest run lib/listings.test.ts`
Expected: PASS (toate). Dacă `normalizePhone('+1 555 123 4567')` nu e `null` sau un caz de program pică, corectează implementarea, nu testul.

- [ ] **Step 6: Verificare și commit**

```bash
npx tsc --noEmit | tail -3   # 0 erori
git add lib/listings.ts lib/listings.test.ts
git commit -m "feat: logica pura a fiselor din director (tipuri, validari, URL-uri)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Schema Prisma și migrarea

**Files:**
- Modify: `prisma/schema.prisma` (modelul `Site` și final de fișier)
- Create: `prisma/migrations/20261019120000_listings/migration.sql`

- [ ] **Step 1: Salvează schema veche pentru comparație**

```bash
cp prisma/schema.prisma "C:/Users/Cosmin/AppData/Local/Temp/old-schema.prisma"
```

- [ ] **Step 2: Adaugă relațiile în `Site`**

În `model Site`, după linia `importLogs       ImportLog[]`, adaugă:

```prisma
  listings         Listing[]
  listingServices  ListingService[]
```

- [ ] **Step 3: Adaugă enum-urile și modelele la finalul `prisma/schema.prisma`**

```prisma
enum ListingType {
  VET
  TRAINER
  GROOMER
}

enum ListingStatus {
  DRAFT
  PUBLISHED
}

model Listing {
  id           String               @id @default(cuid())
  siteId       String
  type         ListingType
  name         String               @db.VarChar(255)
  slug         String               @db.VarChar(255)
  description  String?
  county       String               @db.VarChar(100)
  city         String               @db.VarChar(100)
  citySlug     String               @db.VarChar(100)
  address      String?              @db.VarChar(255)
  lat          Float?
  lng          Float?
  phone        String?              @db.VarChar(20)
  email        String?              @db.VarChar(255)
  website      String?              @db.VarChar(255)
  openingHours Json?
  status       ListingStatus        @default(DRAFT)
  // Rezervate pentru planurile platite (sub-proiectul 3); nefolosite in v1.
  featured     Boolean              @default(false)
  plan         String               @default("free") @db.VarChar(30)
  publishedAt  DateTime?
  createdAt    DateTime             @default(now())
  updatedAt    DateTime             @updatedAt
  site         Site                 @relation(fields: [siteId], references: [id], onDelete: Cascade)
  services     ListingServiceLink[]

  @@unique([siteId, type, citySlug, slug])
  @@index([siteId, type, status, citySlug])
}

model ListingService {
  id       String               @id @default(cuid())
  siteId   String
  type     ListingType
  name     String               @db.VarChar(100)
  slug     String               @db.VarChar(100)
  site     Site                 @relation(fields: [siteId], references: [id], onDelete: Cascade)
  listings ListingServiceLink[]

  @@unique([siteId, type, slug])
}

model ListingServiceLink {
  listingId String
  serviceId String
  listing   Listing        @relation(fields: [listingId], references: [id], onDelete: Cascade)
  service   ListingService @relation(fields: [serviceId], references: [id], onDelete: Cascade)

  @@id([listingId, serviceId])
}
```

- [ ] **Step 4: Generează migrarea cu `migrate diff`**

```bash
mkdir -p prisma/migrations/20261019120000_listings
npx prisma migrate diff --from-schema="C:/Users/Cosmin/AppData/Local/Temp/old-schema.prisma" --to-schema=prisma/schema.prisma --script -o prisma/migrations/20261019120000_listings/migration.sql
head -40 prisma/migrations/20261019120000_listings/migration.sql
```

Expected: fișierul conține doar `CREATE TYPE "ListingType"`, `CREATE TYPE "ListingStatus"`, `CREATE TABLE "Listing"`, `"ListingService"`, `"ListingServiceLink"`, indexuri și chei străine. **Fără** `DROP`, `ALTER ... DROP` sau mesaje ale CLI-ului în fișier (verifică prima linie: trebuie să fie `-- CreateEnum`, nu „Loaded Prisma config"). Dacă CLI-ul a scris text de încărcare în fișier, șterge-l manual.

- [ ] **Step 5: Aplică pe baza locală și regenerează clientul**

```bash
npx prisma migrate deploy
npx prisma generate
npx prisma migrate status | tail -3   # "Database schema is up to date!"
```

- [ ] **Step 6: Verifică și commit**

```bash
npx tsc --noEmit | tail -3
npx vitest run 2>&1 | grep -E "Tests |FAIL"
git add prisma/schema.prisma prisma/migrations/20261019120000_listings
git commit -m "feat: modelele Listing, ListingService si migrarea aditiva

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Slug-ul rezervat `director` în API-ul de categorii

**Files:**
- Modify: `app/api/categories/route.ts` (POST), `app/api/categories/[id]/route.ts` (PUT)
- Modify: `app/api/categories/[id]/route.test.ts`

Regula: o categorie **radacină** (`parentId` nul) nu poate avea slug-ul `director`, pentru că ruta statică `/director` ar umbri-o. Subcategoriile pot.

- [ ] **Step 1: Test nou (eșuează)**

În `app/api/categories/[id]/route.test.ts`, în `describe('PUT /api/categories/[id]', ...)`, adaugă înainte de ultima acoladă a blocului:

```ts
  it('400 when a root category would take the reserved slug "director"', async () => {
    prisma.category.findUnique.mockResolvedValue({ ...existing, parentId: null })
    const res = await put({ slug: 'director' })
    expect(res.status).toBe(400)
    expect(prisma.category.update).not.toHaveBeenCalled()
  })

  it('allows "director" as a subcategory slug', async () => {
    const res = await put({ slug: 'director' }) // existing.parentId = 'p1'
    expect(res.status).toBe(200)
  })
```

Run: `npx vitest run "app/api/categories"` → primul test nou pică (200 în loc de 400).

- [ ] **Step 2: Implementare în PUT**

În `app/api/categories/[id]/route.ts`, importă și verifică după calculul `targetParentId`:

```ts
import { isReservedRootSlug } from '@/lib/listings'
```

și imediat după linia `const parentChanged = ...`:

```ts
  if (!targetParentId && isReservedRootSlug(slug)) {
    return NextResponse.json({ error: `Slug-ul "${slug}" este rezervat` }, { status: 400 })
  }
```

- [ ] **Step 3: Implementare în POST**

În `app/api/categories/route.ts`, importă `import { isReservedRootSlug } from '@/lib/listings'` și, după `const slug = ...`:

```ts
  if (!parentId && isReservedRootSlug(slug)) {
    return NextResponse.json({ error: `Slug-ul "${slug}" este rezervat` }, { status: 400 })
  }
```

- [ ] **Step 4: Teste, tsc, commit**

```bash
npx vitest run 2>&1 | grep -E "Tests |FAIL"
npx tsc --noEmit | tail -3
git add app/api/categories lib/listings.ts
git commit -m "fix: slug-ul /director e rezervat pentru categoriile radacina

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: API pentru servicii (`/api/listing-services`)

**Files:**
- Create: `app/api/listing-services/route.ts`, `app/api/listing-services/[id]/route.ts`
- Test: `app/api/listing-services/route.test.ts`

- [ ] **Step 1: Teste (eșuează)**

Creează `app/api/listing-services/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    listingService: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { GET, POST } from './route'

const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/listing-services', { method: 'POST', body: JSON.stringify(body) }))

beforeEach(() => {
  vi.clearAllMocks()
  prisma.listingService.findFirst.mockResolvedValue(null)
  prisma.listingService.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 'n1', ...data }))
  prisma.listingService.findMany.mockResolvedValue([])
})

describe('POST /api/listing-services', () => {
  it('400 for an invalid type', async () => {
    expect((await post({ type: 'XYZ', name: 'Tuns' })).status).toBe(400)
  })
  it('400 for a too short name', async () => {
    expect((await post({ type: 'GROOMER', name: 'T' })).status).toBe(400)
  })
  it('409 when the slug exists for the same site and type', async () => {
    prisma.listingService.findFirst.mockResolvedValue({ id: 'x' })
    expect((await post({ type: 'GROOMER', name: 'Tuns' })).status).toBe(409)
  })
  it('201 creates with a slug derived from the name', async () => {
    const res = await post({ type: 'VET', name: 'Urgențe 24/7' })
    expect(res.status).toBe(201)
    expect(prisma.listingService.create).toHaveBeenCalledWith({
      data: { siteId: 's1', type: 'VET', name: 'Urgențe 24/7', slug: 'urgente-247' },
    })
  })
})

describe('GET /api/listing-services', () => {
  it('filters by type when given', async () => {
    await GET(new NextRequest('http://localhost/api/listing-services?type=VET'))
    expect(prisma.listingService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { siteId: 's1', type: 'VET' } }),
    )
  })
})
```

Run: `npx vitest run app/api/listing-services` → FAIL (modulul lipsește).

- [ ] **Step 2: Implementare `route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'
import { slugify } from '@/lib/slugify'
import { isListingType, LISTING_TYPES } from '@/lib/listings'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const type = LISTING_TYPES.find((t) => t === req.nextUrl.searchParams.get('type'))
  const services = await prisma.listingService.findMany({
    where: { siteId, ...(type && { type }) },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { listings: true } } },
  })
  return NextResponse.json({ services })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const body = await req.json().catch(() => null)
  const type = body?.type
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!isListingType(type)) return NextResponse.json({ error: 'Tip invalid' }, { status: 400 })
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: 'Numele trebuie să aibă între 2 și 100 de caractere' }, { status: 400 })
  }
  const slug = slugify(body?.slug ? String(body.slug) : name)
  if (!slug) return NextResponse.json({ error: 'Slug invalid' }, { status: 400 })

  const existing = await prisma.listingService.findFirst({ where: { siteId, type, slug } })
  if (existing) return NextResponse.json({ error: 'Există deja un serviciu cu acest slug' }, { status: 409 })

  const service = await prisma.listingService.create({ data: { siteId, type, name, slug } })
  return NextResponse.json({ service }, { status: 201 })
}
```

- [ ] **Step 3: Implementare `[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.listingService.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json().catch(() => null)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: 'Numele trebuie să aibă între 2 și 100 de caractere' }, { status: 400 })
  }
  // Slug-ul ramane stabil: fisele publice nu il folosesc in URL, dar filtrul ?serviciu= da.
  const slug = body?.slug ? slugify(String(body.slug)) : existing.slug
  if (!slug) return NextResponse.json({ error: 'Slug invalid' }, { status: 400 })

  if (slug !== existing.slug) {
    const conflict = await prisma.listingService.findFirst({
      where: { siteId: existing.siteId, type: existing.type, slug, id: { not: id } },
    })
    if (conflict) return NextResponse.json({ error: 'Există deja un serviciu cu acest slug' }, { status: 409 })
  }

  const service = await prisma.listingService.update({ where: { id }, data: { name, slug } })
  return NextResponse.json({ service })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.listingService.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Legaturile se sterg in cascada; fisele raman, doar fara acest serviciu.
  await prisma.listingService.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 4: Teste, tsc, commit**

```bash
npx vitest run app/api/listing-services 2>&1 | grep -E "Tests |FAIL"
npx tsc --noEmit | tail -3
git add app/api/listing-services
git commit -m "feat: API pentru serviciile fiselor din director

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: API pentru fișe (`/api/listings`)

**Files:**
- Create: `app/api/listings/route.ts`, `app/api/listings/[id]/route.ts`
- Test: `app/api/listings/route.test.ts`, `app/api/listings/[id]/route.test.ts`

- [ ] **Step 1: Teste pentru colecție (eșuează)**

Creează `app/api/listings/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    listing: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    listingService: { findMany: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { GET, POST } from './route'

const body = {
  type: 'VET',
  name: 'Cabinet Vet Popescu',
  county: 'Cluj',
  city: 'Cluj-Napoca',
  phone: '0721 234 567',
}
const post = (b: unknown) =>
  POST(new NextRequest('http://localhost/api/listings', { method: 'POST', body: JSON.stringify(b) }))

beforeEach(() => {
  vi.clearAllMocks()
  prisma.listing.findFirst.mockResolvedValue(null)
  prisma.listing.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 'l1', ...data }))
  prisma.listing.findMany.mockResolvedValue([])
  prisma.listing.count.mockResolvedValue(0)
  prisma.listingService.findMany.mockResolvedValue([])
})

describe('POST /api/listings', () => {
  it('400 for an invalid body', async () => {
    expect((await post({ ...body, type: 'XYZ' })).status).toBe(400)
    expect(prisma.listing.create).not.toHaveBeenCalled()
  })

  it('201 creates with derived slug, citySlug and normalized phone', async () => {
    const res = await post(body)
    expect(res.status).toBe(201)
    const data = prisma.listing.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      siteId: 's1',
      type: 'VET',
      slug: 'cabinet-vet-popescu',
      citySlug: 'cluj-napoca',
      phone: '+40721234567',
      status: 'DRAFT',
      publishedAt: null,
    })
  })

  it('sets publishedAt when created as PUBLISHED', async () => {
    await post({ ...body, status: 'PUBLISHED' })
    expect(prisma.listing.create.mock.calls[0][0].data.publishedAt).toBeInstanceOf(Date)
  })

  it('adds a numeric suffix when the derived slug is taken', async () => {
    prisma.listing.findFirst.mockResolvedValueOnce({ id: 'x' }).mockResolvedValue(null)
    await post(body)
    expect(prisma.listing.create.mock.calls[0][0].data.slug).toBe('cabinet-vet-popescu-2')
  })

  it('409 when an explicit slug is taken', async () => {
    prisma.listing.findFirst.mockResolvedValue({ id: 'x' })
    expect((await post({ ...body, slug: 'popescu' })).status).toBe(409)
  })

  it('400 when a service does not exist for this type', async () => {
    prisma.listingService.findMany.mockResolvedValue([])
    expect((await post({ ...body, serviceIds: ['s-x'] })).status).toBe(400)
  })

  it('links the given services', async () => {
    prisma.listingService.findMany.mockResolvedValue([{ id: 'sv1' }])
    await post({ ...body, serviceIds: ['sv1'] })
    expect(prisma.listing.create.mock.calls[0][0].data.services).toEqual({ create: [{ serviceId: 'sv1' }] })
  })
})

describe('GET /api/listings', () => {
  it('scopes by site and applies filters', async () => {
    await GET(new NextRequest('http://localhost/api/listings?type=VET&status=DRAFT&page=2'))
    const args = prisma.listing.findMany.mock.calls[0][0]
    expect(args.where).toMatchObject({ siteId: 's1', type: 'VET', status: 'DRAFT' })
    expect(args.skip).toBe(20)
  })
  it('ignores unknown filter values', async () => {
    await GET(new NextRequest('http://localhost/api/listings?type=ZZZ&status=ARCHIVED&page=abc'))
    const args = prisma.listing.findMany.mock.calls[0][0]
    expect(args.where).toEqual({ siteId: 's1' })
    expect(args.skip).toBe(0)
  })
})
```

- [ ] **Step 2: Implementare `app/api/listings/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { getSiteIdFromRequest } from '@/lib/site'
import { slugify } from '@/lib/slugify'
import { parsePageParam } from '@/lib/pagination'
import { LISTING_TYPES, nextFreeSlug, parseListingInput } from '@/lib/listings'

const PAGE_SIZE = 20

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const sp = req.nextUrl.searchParams
  const type = LISTING_TYPES.find((t) => t === sp.get('type'))
  const rawStatus = sp.get('status')
  const status = rawStatus === 'DRAFT' || rawStatus === 'PUBLISHED' ? rawStatus : undefined
  const q = sp.get('q')?.trim()
  const page = parsePageParam(sp.get('page'))

  const where = {
    siteId,
    ...(type && { type }),
    ...(status && { status }),
    ...(q && {
      OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { city: { contains: q, mode: 'insensitive' as const } },
      ],
    }),
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { services: { include: { service: { select: { name: true } } } } },
    }),
    prisma.listing.count({ where }),
  ])
  return NextResponse.json({ listings, total, page, pageSize: PAGE_SIZE })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const siteId = (await getSiteIdFromRequest(req)) ?? session.user.activeSiteId
  if (!siteId) return NextResponse.json({ error: 'siteId required' }, { status: 400 })

  const parsed = parseListingInput(await req.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { serviceIds, slug: requestedSlug, openingHours, ...data } = parsed.data

  const citySlug = slugify(data.city)
  if (!citySlug) return NextResponse.json({ error: 'Orașul nu poate fi folosit în URL' }, { status: 400 })

  if (serviceIds.length > 0) {
    const found = await prisma.listingService.findMany({
      where: { id: { in: serviceIds }, siteId, type: data.type },
      select: { id: true },
    })
    if (found.length !== serviceIds.length) {
      return NextResponse.json({ error: 'Serviciu invalid pentru acest tip' }, { status: 400 })
    }
  }

  const taken = async (slug: string) =>
    !!(await prisma.listing.findFirst({ where: { siteId, type: data.type, citySlug, slug }, select: { id: true } }))

  let slug: string
  if (requestedSlug) {
    if (await taken(requestedSlug)) {
      return NextResponse.json({ error: 'Există deja o fișă cu acest slug în oraș' }, { status: 409 })
    }
    slug = requestedSlug
  } else {
    slug = await nextFreeSlug(taken, slugify(data.name) || 'fisa')
  }

  const listing = await prisma.listing.create({
    data: {
      ...data,
      siteId,
      slug,
      citySlug,
      ...(openingHours && { openingHours: openingHours as Prisma.InputJsonValue }),
      publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
      services: { create: serviceIds.map((serviceId) => ({ serviceId })) },
    },
  })
  return NextResponse.json({ listing }, { status: 201 })
}
```

- [ ] **Step 3: Teste pentru `[id]` (eșuează)**

Creează `app/api/listings/[id]/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    listing: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    listingService: { findMany: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))

import { GET, PUT, DELETE } from './route'

const ctx = { params: Promise.resolve({ id: 'l1' }) }
const existing = {
  id: 'l1',
  siteId: 's1',
  type: 'VET',
  slug: 'popescu',
  citySlug: 'cluj-napoca',
  publishedAt: null,
}
const body = {
  type: 'VET',
  name: 'Cabinet Vet Popescu',
  county: 'Cluj',
  city: 'Cluj-Napoca',
  phone: '0721 234 567',
}
const put = (b: unknown) =>
  PUT(new NextRequest('http://localhost/api/listings/l1', { method: 'PUT', body: JSON.stringify(b) }), ctx)

beforeEach(() => {
  vi.clearAllMocks()
  prisma.listing.findUnique.mockResolvedValue(existing)
  prisma.listing.findFirst.mockResolvedValue(null)
  prisma.listing.update.mockImplementation(async ({ data }: { data: object }) => ({ ...existing, ...data }))
  prisma.listing.delete.mockResolvedValue({})
  prisma.listingService.findMany.mockResolvedValue([])
})

describe('GET /api/listings/[id]', () => {
  it('404 when missing', async () => {
    prisma.listing.findUnique.mockResolvedValue(null)
    expect((await GET(new NextRequest('http://localhost/api/listings/l1'), ctx)).status).toBe(404)
  })
})

describe('PUT /api/listings/[id]', () => {
  it('404 when missing', async () => {
    prisma.listing.findUnique.mockResolvedValue(null)
    expect((await put(body)).status).toBe(404)
  })

  it('400 for an invalid body', async () => {
    expect((await put({ ...body, phone: '123' })).status).toBe(400)
    expect(prisma.listing.update).not.toHaveBeenCalled()
  })

  it('keeps the existing slug and skips the conflict query when the key is unchanged', async () => {
    const res = await put(body)
    expect(res.status).toBe(200)
    expect(prisma.listing.findFirst).not.toHaveBeenCalled()
    expect(prisma.listing.update.mock.calls[0][0].data.slug).toBe('popescu')
  })

  it('409 when an explicit new slug is taken in the same city', async () => {
    prisma.listing.findFirst.mockResolvedValue({ id: 'other' })
    expect((await put({ ...body, slug: 'altul' })).status).toBe(409)
  })

  it('moving to another city picks a free variant of the current slug on conflict', async () => {
    prisma.listing.findFirst.mockResolvedValueOnce({ id: 'other' }).mockResolvedValue(null)
    const res = await put({ ...body, city: 'Iași', county: 'Iași' })
    expect(res.status).toBe(200)
    const data = prisma.listing.update.mock.calls[0][0].data
    expect(data.citySlug).toBe('iasi')
    expect(data.slug).toBe('popescu-2')
  })

  it('sets publishedAt on first publish and clears it on unpublish', async () => {
    await put({ ...body, status: 'PUBLISHED' })
    expect(prisma.listing.update.mock.calls[0][0].data.publishedAt).toBeInstanceOf(Date)
    await put({ ...body, status: 'DRAFT' })
    expect(prisma.listing.update.mock.calls[1][0].data.publishedAt).toBeNull()
  })

  it('replaces the service links', async () => {
    prisma.listingService.findMany.mockResolvedValue([{ id: 'sv1' }])
    await put({ ...body, serviceIds: ['sv1'] })
    expect(prisma.listing.update.mock.calls[0][0].data.services).toEqual({
      deleteMany: {},
      create: [{ serviceId: 'sv1' }],
    })
  })
})

describe('DELETE /api/listings/[id]', () => {
  it('404 when missing, 200 otherwise', async () => {
    prisma.listing.findUnique.mockResolvedValueOnce(null)
    expect((await DELETE(new NextRequest('http://localhost/api/listings/l1', { method: 'DELETE' }), ctx)).status).toBe(404)
    expect((await DELETE(new NextRequest('http://localhost/api/listings/l1', { method: 'DELETE' }), ctx)).status).toBe(200)
    expect(prisma.listing.delete).toHaveBeenCalledWith({ where: { id: 'l1' } })
  })
})
```

- [ ] **Step 4: Implementare `app/api/listings/[id]/route.ts`**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { nextFreeSlug, parseListingInput } from '@/lib/listings'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const listing = await prisma.listing.findUnique({
    where: { id },
    include: { services: { select: { serviceId: true } } },
  })
  if (!listing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ listing })
}

export async function PUT(req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.listing.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const parsed = parseListingInput(await req.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { serviceIds, slug: requestedSlug, openingHours, ...data } = parsed.data

  const citySlug = slugify(data.city)
  if (!citySlug) return NextResponse.json({ error: 'Orașul nu poate fi folosit în URL' }, { status: 400 })

  if (serviceIds.length > 0) {
    const found = await prisma.listingService.findMany({
      where: { id: { in: serviceIds }, siteId: existing.siteId, type: data.type },
      select: { id: true },
    })
    if (found.length !== serviceIds.length) {
      return NextResponse.json({ error: 'Serviciu invalid pentru acest tip' }, { status: 400 })
    }
  }

  // Cheia (tip, oras, slug) se verifica doar daca s-a schimbat vreuna dintre componente.
  let slug = requestedSlug ?? existing.slug
  const keyChanged = data.type !== existing.type || citySlug !== existing.citySlug || slug !== existing.slug
  if (keyChanged) {
    const taken = async (s: string) =>
      !!(await prisma.listing.findFirst({
        where: { siteId: existing.siteId, type: data.type, citySlug, slug: s, id: { not: id } },
        select: { id: true },
      }))
    if (requestedSlug) {
      if (await taken(slug)) {
        return NextResponse.json({ error: 'Există deja o fișă cu acest slug în oraș' }, { status: 409 })
      }
    } else {
      // slug-ul vine din fisa existenta: ramane acelasi daca e liber in noua cheie, altfel primeste sufix
      slug = await nextFreeSlug(taken, existing.slug)
    }
  }

  const listing = await prisma.listing.update({
    where: { id },
    data: {
      ...data,
      slug,
      citySlug,
      openingHours: openingHours ? (openingHours as Prisma.InputJsonValue) : Prisma.DbNull,
      publishedAt: data.status === 'PUBLISHED' ? (existing.publishedAt ?? new Date()) : null,
      services: { deleteMany: {}, create: serviceIds.map((serviceId) => ({ serviceId })) },
    },
  })
  return NextResponse.json({ listing })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params

  const existing = await prisma.listing.findUnique({ where: { id }, select: { id: true } })
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.listing.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
```

- [ ] **Step 5: Teste, tsc, commit**

```bash
npx vitest run app/api/listings 2>&1 | grep -E "Tests |FAIL"
npx tsc --noEmit | tail -3
git add app/api/listings
git commit -m "feat: API CRUD pentru fisele din director

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

Dacă `tsc` se plânge de `Prisma.InputJsonValue`, verifică că ai rulat `npx prisma generate` (Task 2, Step 5).

---

### Task 6: Seed-uri (servicii, fișe de probă) și legarea în deploy

**Files:**
- Create: `scripts/seed-listing-services.ts`, `scripts/dev-seed-listings.ts`
- Modify: `deploy-pm2.sh` (bucla de seed)

- [ ] **Step 1: `scripts/seed-listing-services.ts`**

```ts
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
```

- [ ] **Step 2: Leagă-l în `deploy-pm2.sh`**

Înlocuiește linia `for s in seed-categories seed-field-definitions; do` cu:

```bash
  for s in seed-categories seed-field-definitions seed-listing-services; do
```

și textul `(categorii, campuri)` din mesajul de deasupra cu `(categorii, campuri, servicii director)`. Actualizează și comentariul din antetul scriptului (`--seed`): `# ruleaza si seed-urile idempotente (categorii + campuri + servicii director)`.

- [ ] **Step 3: `scripts/dev-seed-listings.ts` (doar local)**

```ts
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
```

- [ ] **Step 4: Rulează seed-urile local și verifică**

```bash
node --env-file=.env node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/seed-listing-services.ts | tail -3
node --env-file=.env node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/dev-seed-listings.ts | tail -7
# a doua rulare nu trebuie sa creeze duplicate:
node --env-file=.env node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/dev-seed-listings.ts | tail -1
node --env-file=.env -e "const {PrismaClient}=require('@prisma/client');const {PrismaPg}=require('@prisma/adapter-pg');const p=new PrismaClient({adapter:new PrismaPg({connectionString:process.env.DATABASE_URL})});Promise.all([p.listing.count(),p.listingService.count()]).then(r=>{console.log('fise',r[0],'servicii',r[1]);return p.\$disconnect()})"
```

Expected: `fise 6 servicii 13`, și după a doua rulare tot 6/13. Dacă `site` nu există în baza locală, verifică `SEED_SITE_DOMAIN` (site-ul local de proba are domeniul `divet.ro`, ca în `seed-categories`).

- [ ] **Step 5: Commit**

```bash
bash -n deploy-pm2.sh && echo "sintaxa OK"
git add scripts/seed-listing-services.ts scripts/dev-seed-listings.ts deploy-pm2.sh
git commit -m "feat: seed pentru serviciile directorului, fise de proba locale, legare in deploy

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: JSON-LD pentru fișe (`lib/seo/listing-schema.ts`)

**Files:**
- Create: `lib/seo/listing-schema.ts`
- Test: `lib/seo/listing-schema.test.ts`

- [ ] **Step 1: Test (eșuează)**

```ts
import { describe, it, expect } from 'vitest'
import { generateListingSchema, type ListingSchemaInput } from './listing-schema'

const base: ListingSchemaInput = {
  type: 'VET',
  name: 'Cabinet Vet Popescu',
  slug: 'cabinet-vet-popescu',
  citySlug: 'cluj-napoca',
  city: 'Cluj-Napoca',
  county: 'Cluj',
  description: 'Consultații și vaccinări.',
  address: 'Str. Memorandumului 12',
  phone: '+40264123456',
  email: 'contact@popescu.example',
  website: 'https://popescu.example',
  lat: null,
  lng: null,
  openingHours: { mon: [{ from: '09:00', to: '17:00' }] },
}
const SITE = 'https://divet.ro/'

describe('generateListingSchema', () => {
  it('VET devine VeterinaryCare, altele LocalBusiness', () => {
    const [vet] = generateListingSchema(base, SITE)
    expect(vet['@type']).toBe('VeterinaryCare')
    const [groomer] = generateListingSchema({ ...base, type: 'GROOMER' }, SITE)
    expect(groomer['@type']).toBe('LocalBusiness')
  })

  it('are URL canonic, adresa si contact', () => {
    const [b] = generateListingSchema(base, SITE)
    expect(b.url).toBe('https://divet.ro/director/veterinari/cluj-napoca/cabinet-vet-popescu')
    expect(b.telephone).toBe('+40264123456')
    expect(b.email).toBe('contact@popescu.example')
    expect(b.sameAs).toEqual(['https://popescu.example'])
    expect(b.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: 'Str. Memorandumului 12',
      addressLocality: 'Cluj-Napoca',
      addressRegion: 'Cluj',
      addressCountry: 'RO',
    })
  })

  it('omite campurile goale si geo fara coordonate', () => {
    const [b] = generateListingSchema(
      { ...base, description: null, address: null, phone: null, email: null, website: null, openingHours: null },
      SITE,
    )
    for (const key of ['description', 'telephone', 'email', 'sameAs', 'geo', 'openingHoursSpecification']) {
      expect(b).not.toHaveProperty(key)
    }
    expect(b.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Cluj-Napoca',
      addressRegion: 'Cluj',
      addressCountry: 'RO',
    })
  })

  it('include geo cand exista ambele coordonate', () => {
    const [b] = generateListingSchema({ ...base, lat: 46.77, lng: 23.59 }, SITE)
    expect(b.geo).toEqual({ '@type': 'GeoCoordinates', latitude: 46.77, longitude: 23.59 })
  })

  it('traduce programul in openingHoursSpecification si ignora zilele inchise', () => {
    const [b] = generateListingSchema(base, SITE)
    expect(b.openingHoursSpecification).toEqual([
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Monday', opens: '09:00', closes: '17:00' },
    ])
  })

  it('programul invalid din baza nu strica pagina', () => {
    const [b] = generateListingSchema({ ...base, openingHours: { mon: 'x' } }, SITE)
    expect(b).not.toHaveProperty('openingHoursSpecification')
  })

  it('BreadcrumbList are 5 pasi cu URL-uri absolute', () => {
    const [, crumbs] = generateListingSchema(base, SITE)
    const items = crumbs.itemListElement as Array<{ position: number; name: string; item: string }>
    expect(crumbs['@type']).toBe('BreadcrumbList')
    expect(items.map((i) => i.position)).toEqual([1, 2, 3, 4, 5])
    expect(items.map((i) => i.item)).toEqual([
      'https://divet.ro/',
      'https://divet.ro/director',
      'https://divet.ro/director/veterinari',
      'https://divet.ro/director/veterinari/cluj-napoca',
      'https://divet.ro/director/veterinari/cluj-napoca/cabinet-vet-popescu',
    ])
    expect(items[2].name).toBe('Cabinete veterinare')
  })
})
```

Run: `npx vitest run lib/seo/listing-schema.test.ts` → FAIL.

- [ ] **Step 2: Implementare**

```ts
import {
  DAYS,
  TYPE_LABEL,
  cityListPath,
  listingPath,
  parseOpeningHours,
  typeListPath,
  type ListingType,
} from '@/lib/listings'

export interface ListingSchemaInput {
  type: ListingType
  name: string
  slug: string
  citySlug: string
  city: string
  county: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  lat: number | null
  lng: number | null
  openingHours: unknown
}

const SCHEMA_DAY = {
  mon: 'Monday',
  tue: 'Tuesday',
  wed: 'Wednesday',
  thu: 'Thursday',
  fri: 'Friday',
  sat: 'Saturday',
  sun: 'Sunday',
} as const

/** [afacerea locala, BreadcrumbList]; fara aggregateRating (nu exista recenzii). */
export function generateListingSchema(l: ListingSchemaInput, siteUrl: string): Record<string, unknown>[] {
  const base = siteUrl.replace(/\/$/, '')
  const url = `${base}${listingPath(l)}`

  const business: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': l.type === 'VET' ? 'VeterinaryCare' : 'LocalBusiness',
    '@id': url,
    url,
    name: l.name,
    address: {
      '@type': 'PostalAddress',
      ...(l.address && { streetAddress: l.address }),
      addressLocality: l.city,
      addressRegion: l.county,
      addressCountry: 'RO',
    },
  }
  if (l.description) business.description = l.description
  if (l.phone) business.telephone = l.phone
  if (l.email) business.email = l.email
  if (l.website) business.sameAs = [l.website]
  if (l.lat !== null && l.lng !== null) {
    business.geo = { '@type': 'GeoCoordinates', latitude: l.lat, longitude: l.lng }
  }

  const hours = parseOpeningHours(l.openingHours)
  if (hours.ok) {
    const specs = DAYS.flatMap((day) =>
      hours.value[day].map((i) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: SCHEMA_DAY[day],
        opens: i.from,
        closes: i.to,
      })),
    )
    if (specs.length > 0) business.openingHoursSpecification = specs
  }

  const crumbs = [
    { name: 'Acasă', item: `${base}/` },
    { name: 'Director', item: `${base}/director` },
    { name: TYPE_LABEL[l.type].plural, item: `${base}${typeListPath(l.type)}` },
    { name: l.city, item: `${base}${cityListPath(l.type, l.citySlug)}` },
    { name: l.name, item: url },
  ]
  const breadcrumb: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.item })),
  }

  return [business, breadcrumb]
}
```

- [ ] **Step 3: Teste, tsc, commit**

```bash
npx vitest run lib/seo/listing-schema.test.ts 2>&1 | grep -E "Tests |FAIL"
npx tsc --noEmit | tail -3
git add lib/seo/listing-schema.ts lib/seo/listing-schema.test.ts
git commit -m "feat: JSON-LD LocalBusiness/VeterinaryCare si BreadcrumbList pentru fise

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Interogări și funcții pure pentru paginile publice (`lib/director.ts`)

**Files:**
- Create: `lib/director.ts`
- Test: `lib/director.test.ts`

Partea pură (testată): `buildListingWhere`, `resolveCounty`, `summarizeDirectory`, `listingCard`, `buildDirectoryPaths`. Partea cu Prisma (verificată în Task 13): `loadDirectorySite`, `getDirectorySummary`, `getTypeFacets`, `listPublished`, `getPublishedListing`, `getRelatedArticles`.

- [ ] **Step 1: Teste pentru partea pură (eșuează)**

```ts
import { describe, it, expect } from 'vitest'
import {
  buildListingWhere,
  resolveCounty,
  summarizeDirectory,
  listingCard,
  buildDirectoryPaths,
  PAGE_SIZE,
} from './director'

describe('buildListingWhere', () => {
  it('cere intotdeauna fise publicate din site si tipul dat', () => {
    expect(buildListingWhere({ siteId: 's1', type: 'VET' })).toEqual({
      siteId: 's1',
      type: 'VET',
      status: 'PUBLISHED',
    })
  })
  it('adauga filtrele optionale', () => {
    expect(
      buildListingWhere({ siteId: 's1', type: 'GROOMER', citySlug: 'iasi', county: 'Iași', serviceSlug: 'tuns' }),
    ).toEqual({
      siteId: 's1',
      type: 'GROOMER',
      status: 'PUBLISHED',
      citySlug: 'iasi',
      county: 'Iași',
      services: { some: { service: { slug: 'tuns' } } },
    })
  })
})

describe('resolveCounty', () => {
  const counties = ['Cluj', 'Iași', 'București']
  it('potriveste dupa slug, fara diacritice si fara majuscule', () => {
    expect(resolveCounty(counties, 'iasi')).toBe('Iași')
    expect(resolveCounty(counties, 'IAȘI')).toBe('Iași')
    expect(resolveCounty(counties, 'bucuresti')).toBe('București')
  })
  it('valoare necunoscuta sau lipsa -> undefined', () => {
    expect(resolveCounty(counties, 'nu-exista')).toBeUndefined()
    expect(resolveCounty(counties, undefined)).toBeUndefined()
  })
})

describe('summarizeDirectory', () => {
  const rows = [
    { type: 'VET' as const, citySlug: 'cluj-napoca', city: 'Cluj-Napoca', _count: { _all: 3 } },
    { type: 'VET' as const, citySlug: 'iasi', city: 'Iași', _count: { _all: 1 } },
    { type: 'TRAINER' as const, citySlug: 'iasi', city: 'Iași', _count: { _all: 2 } },
  ]
  it('numara pe tip si ordoneaza orasele descrescator', () => {
    const s = summarizeDirectory(rows)
    expect(s.total).toBe(6)
    expect(s.byType.VET.count).toBe(4)
    expect(s.byType.GROOMER.count).toBe(0)
    expect(s.byType.VET.cities.map((c) => c.citySlug)).toEqual(['cluj-napoca', 'iasi'])
  })
  it('limiteaza orasele pe tip', () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      type: 'VET' as const,
      citySlug: `c${i}`,
      city: `C${i}`,
      _count: { _all: i + 1 },
    }))
    expect(summarizeDirectory(many, 3).byType.VET.cities).toHaveLength(3)
  })
})

describe('listingCard', () => {
  it('construieste cardul cu telefon formatat si servicii', () => {
    const card = listingCard({
      type: 'VET',
      citySlug: 'cluj-napoca',
      slug: 'popescu',
      name: 'Cabinet Popescu',
      city: 'Cluj-Napoca',
      county: 'Cluj',
      phone: '+40721234567',
      services: [{ service: { name: 'Vaccinări' } }],
    })
    expect(card).toEqual({
      href: '/director/veterinari/cluj-napoca/popescu',
      name: 'Cabinet Popescu',
      kicker: 'Cabinet veterinar',
      location: 'Cluj-Napoca, Cluj',
      phone: '0721 234 567',
      services: ['Vaccinări'],
    })
  })
  it('fara telefon -> phone null', () => {
    const card = listingCard({
      type: 'TRAINER',
      citySlug: 'iasi',
      slug: 'x',
      name: 'X',
      city: 'Iași',
      county: 'Iași',
      phone: null,
      services: [],
    })
    expect(card.phone).toBeNull()
  })
})

describe('buildDirectoryPaths', () => {
  const d = (s: string) => new Date(s)
  const listings = [
    { type: 'VET' as const, citySlug: 'iasi', slug: 'a', updatedAt: d('2026-01-01') },
    { type: 'VET' as const, citySlug: 'iasi', slug: 'b', updatedAt: d('2026-03-01') },
    { type: 'GROOMER' as const, citySlug: 'cluj-napoca', slug: 'c', updatedAt: d('2026-02-01') },
  ]
  it('fara fise nu produce nimic (nici /director)', () => {
    expect(buildDirectoryPaths([])).toEqual([])
  })
  it('produce index, tipuri, orase si fise, cu data cea mai recenta pe grup', () => {
    const out = buildDirectoryPaths(listings)
    expect(out.map((e) => e.path)).toEqual([
      '/director',
      '/director/veterinari',
      '/director/veterinari/iasi',
      '/director/veterinari/iasi/a',
      '/director/veterinari/iasi/b',
      '/director/toaletaj',
      '/director/toaletaj/cluj-napoca',
      '/director/toaletaj/cluj-napoca/c',
    ])
    expect(out.find((e) => e.path === '/director/veterinari/iasi')?.lastModified).toEqual(d('2026-03-01'))
    expect(out.find((e) => e.path === '/director')?.lastModified).toEqual(d('2026-03-01'))
  })
  it('PAGE_SIZE e un intreg pozitiv', () => {
    expect(PAGE_SIZE).toBeGreaterThan(0)
  })
})
```

Run: `npx vitest run lib/director.test.ts` → FAIL (modulul lipsește).

- [ ] **Step 2: Implementare `lib/director.ts`**

```ts
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { slugify } from '@/lib/slugify'
import { toCardProps } from '@/lib/post-card'
import {
  LISTING_TYPES,
  TYPE_ARTICLE_GROUP,
  TYPE_LABEL,
  TYPE_SEGMENT,
  cityListPath,
  formatPhone,
  listingPath,
  typeListPath,
  type ListingType,
} from '@/lib/listings'
import type { ListingCardProps } from '@/components/frontend/templates/divet/ListingCard'
import type { ArticleCardProps } from '@/components/frontend/templates/divet/ArticleCard'

export const PAGE_SIZE = 12

// ── Functii pure ─────────────────────────────────────────────────────────────

export function buildListingWhere(args: {
  siteId: string
  type: ListingType
  citySlug?: string
  county?: string
  serviceSlug?: string
}): Prisma.ListingWhereInput {
  const { siteId, type, citySlug, county, serviceSlug } = args
  return {
    siteId,
    type,
    status: 'PUBLISHED',
    ...(citySlug && { citySlug }),
    ...(county && { county }),
    ...(serviceSlug && { services: { some: { service: { slug: serviceSlug } } } }),
  }
}

/** Judetul din lista care corespunde parametrului din URL (slug, fara diacritice), sau undefined. */
export function resolveCounty(counties: string[], param: string | undefined): string | undefined {
  if (!param) return undefined
  const wanted = slugify(param)
  if (!wanted) return undefined
  return counties.find((c) => slugify(c) === wanted)
}

export type CityCount = { citySlug: string; city: string; count: number }
export type DirectorySummary = {
  total: number
  byType: Record<ListingType, { count: number; cities: CityCount[] }>
}

export function summarizeDirectory(
  rows: Array<{ type: ListingType; citySlug: string; city: string; _count: { _all: number } }>,
  citiesPerType = 6,
): DirectorySummary {
  const byType = Object.fromEntries(LISTING_TYPES.map((t) => [t, { count: 0, cities: [] as CityCount[] }])) as DirectorySummary['byType']
  let total = 0
  for (const r of rows) {
    const n = r._count._all
    total += n
    byType[r.type].count += n
    byType[r.type].cities.push({ citySlug: r.citySlug, city: r.city, count: n })
  }
  for (const t of LISTING_TYPES) {
    byType[t].cities.sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, 'ro'))
    byType[t].cities = byType[t].cities.slice(0, citiesPerType)
  }
  return { total, byType }
}

type CardSource = {
  type: ListingType
  citySlug: string
  slug: string
  name: string
  city: string
  county: string
  phone: string | null
  services: Array<{ service: { name: string } }>
}

export function listingCard(l: CardSource): ListingCardProps {
  return {
    href: listingPath(l),
    name: l.name,
    kicker: TYPE_LABEL[l.type].singular,
    location: `${l.city}, ${l.county}`,
    phone: l.phone ? formatPhone(l.phone) : null,
    services: l.services.map((s) => s.service.name),
  }
}

/** Caile din sitemap: /director apare doar cand exista fise publicate, la fel tipurile si orasele. */
export function buildDirectoryPaths(
  listings: Array<{ type: ListingType; citySlug: string; slug: string; updatedAt: Date }>,
): Array<{ path: string; lastModified: Date; priority: number }> {
  if (listings.length === 0) return []
  const newest = (items: Array<{ updatedAt: Date }>) =>
    items.reduce((max, i) => (i.updatedAt > max ? i.updatedAt : max), items[0].updatedAt)

  const out = [{ path: '/director', lastModified: newest(listings), priority: 0.7 }]
  for (const type of LISTING_TYPES) {
    const ofType = listings.filter((l) => l.type === type)
    if (ofType.length === 0) continue
    out.push({ path: typeListPath(type), lastModified: newest(ofType), priority: 0.7 })
    const citySlugs = [...new Set(ofType.map((l) => l.citySlug))]
    for (const citySlug of citySlugs) {
      const inCity = ofType.filter((l) => l.citySlug === citySlug)
      out.push({ path: cityListPath(type, citySlug), lastModified: newest(inCity), priority: 0.6 })
      for (const l of inCity) out.push({ path: listingPath(l), lastModified: l.updatedAt, priority: 0.6 })
    }
  }
  return out
}

// ── Incarcatoare Prisma (folosite de paginile publice) ───────────────────────

/** Site-ul activ si datele lui de afisare; null daca nu exista sau nu foloseste template-ul `divet`. */
export async function loadDirectorySite() {
  const site = await prisma.site.findFirst({ where: { isActive: true } })
  if (!site || site.template !== 'divet') return null
  const seo = await prisma.seoSettings.findFirst({ where: { siteId: site.id } })
  return {
    site,
    siteData: {
      siteName: seo?.siteName ?? site.name,
      siteUrl: seo?.siteUrl ?? `http://${site.domain}`,
    },
  }
}

export async function getDirectorySummary(siteId: string): Promise<DirectorySummary> {
  const rows = await prisma.listing.groupBy({
    by: ['type', 'citySlug', 'city'],
    where: { siteId, status: 'PUBLISHED' },
    _count: { _all: true },
  })
  return summarizeDirectory(rows)
}

export type TypeFacets = {
  cities: CityCount[]
  counties: string[]
  services: Array<{ slug: string; name: string; count: number }>
}

export async function getTypeFacets(siteId: string, type: ListingType): Promise<TypeFacets> {
  const where = { siteId, type, status: 'PUBLISHED' as const }
  const [cityRows, countyRows, services] = await Promise.all([
    prisma.listing.groupBy({ by: ['citySlug', 'city'], where, _count: { _all: true } }),
    prisma.listing.groupBy({ by: ['county'], where }),
    prisma.listingService.findMany({
      where: { siteId, type },
      orderBy: { name: 'asc' },
      select: {
        slug: true,
        name: true,
        _count: { select: { listings: { where: { listing: { status: 'PUBLISHED' } } } } },
      },
    }),
  ])
  return {
    cities: cityRows
      .map((r) => ({ citySlug: r.citySlug, city: r.city, count: r._count._all }))
      .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, 'ro')),
    counties: countyRows.map((r) => r.county).sort((a, b) => a.localeCompare(b, 'ro')),
    services: services
      .map((s) => ({ slug: s.slug, name: s.name, count: s._count.listings }))
      .filter((s) => s.count > 0),
  }
}

export async function listPublished(args: {
  siteId: string
  type: ListingType
  citySlug?: string
  county?: string
  serviceSlug?: string
  page: number
}) {
  const where = buildListingWhere(args)
  const [rows, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      skip: (args.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { services: { include: { service: { select: { name: true } } } } },
    }),
    prisma.listing.count({ where }),
  ])
  return { rows, cards: rows.map(listingCard), total, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) }
}

export function getPublishedListing(args: { siteId: string; type: ListingType; citySlug: string; slug: string }) {
  return prisma.listing.findFirst({
    where: { ...args, status: 'PUBLISHED' },
    include: { services: { include: { service: { select: { name: true } } } } },
  })
}

/** Ultimele articole din grupul legat de tip (sanatate / caini), ca carduri; gol cand nu exista grupul. */
export async function getRelatedArticles(
  siteId: string,
  type: ListingType,
  siteUrl: string,
): Promise<{ group: { name: string; href: string }; cards: ArticleCardProps[] } | null> {
  const groupSlug = TYPE_ARTICLE_GROUP[type]
  const group = await prisma.category.findFirst({
    where: { siteId, slug: groupSlug, parentId: null },
    select: { id: true, name: true, slug: true },
  })
  if (!group) return null
  const posts = await prisma.post.findMany({
    where: { siteId, status: 'PUBLISHED', category: { OR: [{ id: group.id }, { parentId: group.id }] } },
    orderBy: { publishedAt: 'desc' },
    take: 6,
    select: {
      title: true,
      slug: true,
      category: { select: { name: true, slug: true, parent: { select: { slug: true } } } },
    },
  })
  return {
    group: { name: group.name, href: `/${group.slug}` },
    cards: posts.map((p) => toCardProps({ ...p, featuredImage: null }, siteUrl)),
  }
}

export { TYPE_SEGMENT }
```

Notă: `export { TYPE_SEGMENT }` de la final poate fi scos dacă nu e folosit de nicio pagină; `tsc`/eslint nu cer să rămână.

- [ ] **Step 3: Teste, tsc, commit**

```bash
npx vitest run lib/director.test.ts 2>&1 | grep -E "Tests |FAIL"
npx tsc --noEmit | tail -5
```

`tsc` va eșua cu „Cannot find module ... ListingCard" până la Task 9 (importurile de tip). **Nu comite acum**; continuă cu Task 9 și comite `lib/director.ts` împreună cu componentele (Step 7 din Task 9).

---

### Task 9: Componentele publice și linkul „Director" în meniu

**Files:**
- Create: `components/frontend/templates/divet/ListingCard.tsx`, `DirectoryIndexTemplate.tsx`, `DirectoryListTemplate.tsx`, `ListingTemplate.tsx`
- Modify: `components/frontend/templates/divet/DivetNav.tsx`, `DivetLayout.tsx`, `Pagination.tsx`

- [ ] **Step 1: `ListingCard.tsx`**

```tsx
import Link from 'next/link'

export type ListingCardProps = {
  href: string
  name: string
  kicker: string
  location: string
  phone: string | null
  services: string[]
}

export default function ListingCard({ href, name, kicker, location, phone, services }: ListingCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-[9px] border border-dv-border bg-dv-surface px-[15px] py-[14px] hover:border-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent"
    >
      <div className="mb-1 text-dv-label font-semibold uppercase text-dv-accent">{kicker}</div>
      <h3 className="m-0 font-dv-display text-dv-title text-dv-ink group-hover:text-dv-accent">{name}</h3>
      <div className="mt-1.5 text-[13px] text-dv-ink-muted">{location}</div>
      {phone ? <div className="mt-1 text-[13px] text-dv-ink">{phone}</div> : null}
      {services.length > 0 ? (
        <ul className="m-0 mt-3 flex list-none flex-wrap gap-1.5 p-0">
          {services.slice(0, 4).map((s) => (
            <li key={s} className="rounded-full bg-dv-sunken px-2.5 py-0.5 text-[12px] text-dv-ink-muted">
              {s}
            </li>
          ))}
        </ul>
      ) : null}
    </Link>
  )
}
```

- [ ] **Step 2: `DirectoryIndexTemplate.tsx`**

```tsx
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import EmptyState from './EmptyState'
import { LISTING_TYPES, TYPE_LABEL, cityListPath, typeListPath } from '@/lib/listings'
import type { DirectorySummary } from '@/lib/director'

const chip =
  'rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[13px] text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent'

export default function DirectoryIndexTemplate({
  site,
  summary,
}: {
  site: { siteName: string; siteUrl: string }
  summary: DirectorySummary
}) {
  return (
    <DivetLayout site={site}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={[{ name: 'Acasă', href: '/' }, { name: 'Director', href: '/director' }]} />
        <h1 className="mt-4 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[44px]">
          Director
        </h1>
        <p className="mt-3 max-w-[70ch] text-dv-body text-dv-ink-muted">
          Cabinete veterinare, dresori și saloane de toaletaj din România, cu date de contact, program și servicii.
        </p>

        {summary.total === 0 ? (
          <div className="mt-8">
            <EmptyState
              title="Directorul se completează"
              description="Primele fișe apar în curând. Între timp, găsești ghiduri în enciclopedie."
              action={{ label: 'Index A–Z', href: '/index-a-z' }}
            />
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
            {LISTING_TYPES.filter((t) => summary.byType[t].count > 0).map((type) => {
              const { count, cities } = summary.byType[type]
              return (
                <section key={type} className="rounded-[10px] border border-dv-border bg-dv-surface p-5">
                  <h2 className="m-0 font-dv-display text-[22px] font-semibold text-dv-ink">
                    <Link href={typeListPath(type)} className="hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent">
                      {TYPE_LABEL[type].plural}
                    </Link>
                  </h2>
                  <p className="mt-1 mb-0 text-dv-meta text-dv-ink-subtle">{count === 1 ? '1 fișă' : `${count} fișe`}</p>
                  <ul className="m-0 mt-4 flex list-none flex-wrap gap-2 p-0">
                    {cities.map((c) => (
                      <li key={c.citySlug}>
                        <Link href={cityListPath(type, c.citySlug)} className={chip}>
                          {c.city} <span className="text-dv-ink-subtle">{c.count}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={typeListPath(type)}
                    className="mt-4 inline-block text-[14px] font-semibold text-dv-accent hover:text-dv-accent-hover focus-visible:outline-2 focus-visible:outline-dv-accent"
                  >
                    Vezi toate
                  </Link>
                </section>
              )
            })}
          </div>
        )}
      </div>
    </DivetLayout>
  )
}
```

- [ ] **Step 3: `DirectoryListTemplate.tsx`**

```tsx
import Link from 'next/link'
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import ListingCard, { type ListingCardProps } from './ListingCard'
import { TYPE_LABEL, cityListPath, typeListPath, type ListingType } from '@/lib/listings'
import type { CityCount, TypeFacets } from '@/lib/director'

const chip =
  'rounded-full border border-dv-border bg-dv-surface px-3 py-1 text-[13px] text-dv-ink hover:text-dv-accent focus-visible:outline-2 focus-visible:outline-dv-accent'
const field =
  'min-h-11 rounded-md border border-dv-border bg-dv-surface px-3 text-[14px] text-dv-ink focus-visible:outline-2 focus-visible:outline-dv-accent'

export default function DirectoryListTemplate({
  site,
  type,
  city,
  cards,
  total,
  page,
  totalPages,
  basePath,
  facets,
  selected,
}: {
  site: { siteName: string; siteUrl: string }
  type: ListingType
  /** Prezent doar pe pagina unui oras. */
  city?: { name: string; slug: string }
  cards: ListingCardProps[]
  total: number
  page: number
  totalPages: number
  /** Calea curenta, cu filtrele active in query (pentru paginare). */
  basePath: string
  /** Prezent doar pe pagina tipului (filtre si orase). */
  facets?: TypeFacets
  selected?: { county?: string; serviceSlug?: string }
}) {
  const label = TYPE_LABEL[type].plural
  const crumbs = [
    { name: 'Acasă', href: '/' },
    { name: 'Director', href: '/director' },
    { name: label, href: typeListPath(type) },
    ...(city ? [{ name: city.name, href: cityListPath(type, city.slug) }] : []),
  ]
  const filtered = !!selected?.county || !!selected?.serviceSlug
  const cities: CityCount[] = facets?.cities ?? []

  return (
    <DivetLayout site={site}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={crumbs} />
        <h1 className="mt-4 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[44px]">
          {city ? `${label} în ${city.name}` : label}
        </h1>
        <p className="mt-2 mb-0 text-dv-meta text-dv-ink-subtle">{total === 1 ? '1 fișă' : `${total} fișe`}</p>

        {facets ? (
          <form method="get" action={typeListPath(type)} className="mt-5 flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-[13px] text-dv-ink-muted">
              Județ
              <select name="judet" defaultValue={selected?.county ? facets.counties.find((c) => c === selected.county) : ''} className={field}>
                <option value="">Toate</option>
                {facets.counties.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            {facets.services.length > 0 ? (
              <label className="flex flex-col gap-1 text-[13px] text-dv-ink-muted">
                Serviciu
                <select name="serviciu" defaultValue={selected?.serviceSlug ?? ''} className={field}>
                  <option value="">Toate</option>
                  {facets.services.map((s) => (
                    <option key={s.slug} value={s.slug}>
                      {s.name} ({s.count})
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <button
              type="submit"
              className="min-h-11 rounded-md bg-dv-accent px-5 text-[14px] font-semibold text-dv-accent-on focus-visible:outline-2 focus-visible:outline-dv-accent"
            >
              Filtrează
            </button>
            {filtered ? (
              <Link href={typeListPath(type)} className="min-h-11 content-center text-[14px] text-dv-accent">
                Șterge filtrele
              </Link>
            ) : null}
          </form>
        ) : null}

        {cities.length > 0 ? (
          <nav aria-label="Orașe" className="mt-5 flex flex-wrap gap-2">
            {cities.map((c) => (
              <Link key={c.citySlug} href={cityListPath(type, c.citySlug)} className={chip}>
                {c.city} <span className="text-dv-ink-subtle">{c.count}</span>
              </Link>
            ))}
          </nav>
        ) : null}

        <div className="mt-6">
          {cards.length === 0 ? (
            <EmptyState
              title={filtered || page > 1 ? 'Nicio fișă pentru această selecție' : `Încă nu avem ${label.toLowerCase()}`}
              description={filtered ? 'Încearcă alte filtre.' : 'Revino curând: directorul se completează.'}
              action={{ label: 'Înapoi la director', href: '/director' }}
            />
          ) : (
            <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
              {cards.map((c) => (
                <ListingCard key={c.href} {...c} />
              ))}
            </div>
          )}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} basePath={basePath} />
      </div>
    </DivetLayout>
  )
}
```

- [ ] **Step 4: `ListingTemplate.tsx`**

```tsx
import DivetLayout from './DivetLayout'
import Breadcrumbs from './Breadcrumbs'
import RelatedArticles from './RelatedArticles'
import type { ArticleCardProps } from './ArticleCard'
import {
  DAYS,
  DAY_LABEL,
  TYPE_LABEL,
  cityListPath,
  formatPhone,
  listingPath,
  parseOpeningHours,
  typeListPath,
  type ListingType,
} from '@/lib/listings'

type ListingView = {
  type: ListingType
  name: string
  slug: string
  citySlug: string
  city: string
  county: string
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  openingHours: unknown
  services: string[]
}

const link = 'text-dv-accent hover:text-dv-accent-hover focus-visible:outline-2 focus-visible:outline-dv-accent'

export default function ListingTemplate({
  site,
  listing,
  related,
}: {
  site: { siteName: string; siteUrl: string }
  listing: ListingView
  related: { group: { name: string; href: string }; cards: ArticleCardProps[] } | null
}) {
  const hours = parseOpeningHours(listing.openingHours)
  const crumbs = [
    { name: 'Acasă', href: '/' },
    { name: 'Director', href: '/director' },
    { name: TYPE_LABEL[listing.type].plural, href: typeListPath(listing.type) },
    { name: listing.city, href: cityListPath(listing.type, listing.citySlug) },
    { name: listing.name, href: listingPath(listing) },
  ]

  return (
    <DivetLayout site={site}>
      <div className="mx-auto w-full max-w-[1100px] px-4 py-6 md:px-10 lg:py-8">
        <Breadcrumbs items={crumbs} />
        <div className="mt-4 text-dv-label font-semibold uppercase text-dv-accent">{TYPE_LABEL[listing.type].singular}</div>
        <h1 className="mt-1 mb-0 font-dv-display text-[34px] leading-[1.08] font-bold tracking-[-0.03em] text-balance sm:text-[44px]">
          {listing.name}
        </h1>
        <p className="mt-2 mb-0 text-dv-body text-dv-ink-muted">
          {listing.city}, {listing.county}
        </p>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div>
            {listing.description ? (
              <p className="m-0 max-w-[70ch] whitespace-pre-line text-dv-body text-dv-ink">{listing.description}</p>
            ) : null}

            {listing.services.length > 0 ? (
              <section aria-labelledby="servicii" className="mt-8">
                <h2 id="servicii" className="m-0 font-dv-display text-[22px] font-semibold text-dv-ink">
                  Servicii
                </h2>
                <ul className="m-0 mt-3 flex list-none flex-wrap gap-2 p-0">
                  {listing.services.map((s) => (
                    <li key={s} className="rounded-full bg-dv-sunken px-3 py-1 text-[13px] text-dv-ink">
                      {s}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          <aside className="h-fit rounded-[10px] border border-dv-border bg-dv-surface p-5">
            <h2 className="m-0 font-dv-display text-[20px] font-semibold text-dv-ink">Contact</h2>
            <dl className="m-0 mt-3 space-y-3 text-[14px]">
              {listing.address ? (
                <div>
                  <dt className="text-dv-ink-subtle">Adresă</dt>
                  <dd className="m-0 text-dv-ink">{listing.address}, {listing.city}</dd>
                </div>
              ) : null}
              {listing.phone ? (
                <div>
                  <dt className="text-dv-ink-subtle">Telefon</dt>
                  <dd className="m-0">
                    <a href={`tel:${listing.phone}`} className={link}>
                      {formatPhone(listing.phone)}
                    </a>
                  </dd>
                </div>
              ) : null}
              {listing.email ? (
                <div>
                  <dt className="text-dv-ink-subtle">E-mail</dt>
                  <dd className="m-0 break-all">
                    <a href={`mailto:${listing.email}`} className={link}>
                      {listing.email}
                    </a>
                  </dd>
                </div>
              ) : null}
              {listing.website ? (
                <div>
                  <dt className="text-dv-ink-subtle">Site</dt>
                  <dd className="m-0 break-all">
                    <a href={listing.website} target="_blank" rel="nofollow noopener noreferrer" className={link}>
                      {listing.website.replace(/^https?:\/\//, '')}
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>

            {hours.ok ? (
              <>
                <h3 className="m-0 mt-5 font-dv-display text-[16px] font-semibold text-dv-ink">Program</h3>
                <table className="mt-2 w-full text-[14px]">
                  <tbody>
                    {DAYS.map((day) => (
                      <tr key={day} className="border-t border-dv-border">
                        <th scope="row" className="py-1.5 pr-3 text-left font-normal text-dv-ink-muted">
                          {DAY_LABEL[day]}
                        </th>
                        <td className="py-1.5 text-right text-dv-ink">
                          {hours.value[day].length === 0
                            ? 'Închis'
                            : hours.value[day].map((i) => `${i.from}–${i.to}`).join(', ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}
          </aside>
        </div>

        {related ? (
          <div className="mt-10">
            <RelatedArticles categoryName={related.group.name} categoryHref={related.group.href} posts={related.cards} />
          </div>
        ) : null}
      </div>
    </DivetLayout>
  )
}
```

- [ ] **Step 5: Paginarea cu filtre în query**

În `Pagination.tsx`, înlocuiește funcția `pageHref` cu:

```ts
function pageHref(basePath: string, page: number): string {
  if (page === 1) return basePath
  return `${basePath}${basePath.includes('?') ? '&' : '?'}page=${page}`
}
```

- [ ] **Step 6: Linkul „Director" în `DivetNav.tsx` și `DivetLayout.tsx`**

`DivetNav.tsx`: adaugă prop-ul și afișarea.

1. Semnătura: adaugă `extraLinks` la destructurare și la tip:

```tsx
export default function DivetNav({
  groups,
  recentByGroup,
  activeSlug,
  extraLinks = [],
}: {
  groups: NavGroup[]
  recentByGroup: Record<string, GroupPost[]>
  activeSlug?: string | null
  extraLinks?: Array<{ label: string; href: string }>
}) {
```

2. Desktop: imediat după `})}` care închide `groups.map(...)` din `<ul className="flex h-[50px] ...">`, adaugă:

```tsx
          {extraLinks.map((l) => {
            const active = pathname === l.href || pathname.startsWith(`${l.href}/`)
            return (
              <li key={l.href} className="flex items-stretch">
                <Link
                  href={l.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center border-b-2 text-[14px] ${focusRing} ${
                    active
                      ? 'border-dv-accent font-semibold text-dv-accent'
                      : 'border-transparent text-dv-ink hover:text-dv-accent'
                  }`}
                >
                  {l.label}
                </Link>
              </li>
            )
          })}
```

3. Mobil: după `})}` care închide `groups.map(...)` din `<div id="dv-mobile-menu" ...>`, adaugă:

```tsx
          {extraLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex min-h-11 items-center border-t border-dv-border text-[14px] text-dv-ink ${focusRing}`}
            >
              {l.label}
            </Link>
          ))}
```

`DivetLayout.tsx`: numără fișele publicate și trimite linkul doar când există.

```tsx
  let groups: NavGroup[] = []
  let recent: Record<string, GroupPost[]> = {}
  let hasDirectory = false
  try {
    const activeSite = await prisma.site.findFirst({ where: { isActive: true } })
    if (activeSite) {
      groups = await getNavigation(activeSite.id)
      recent = await getRecentPostsByGroup(activeSite.id, groups.map((g) => g.id))
      hasDirectory = (await prisma.listing.count({ where: { siteId: activeSite.id, status: 'PUBLISHED' } })) > 0
    }
  } catch {
    groups = []
    recent = {}
  }
```

și `<DivetNav groups={groups} recentByGroup={recent} activeSlug={activeGroup} extraLinks={hasDirectory ? [{ label: 'Director', href: '/director' }] : []} />`. În footer, adaugă lângă „Index A–Z", doar când `hasDirectory`, un al doilea `Link` către `/director` cu aceeași clasă și textul `Director`, într-un `<span className="flex gap-4">` care învelește cele două linkuri.

- [ ] **Step 7: Verifică, comite (inclusiv `lib/director.ts` din Task 8)**

```bash
npx tsc --noEmit | tail -5          # 0 erori
npx vitest run 2>&1 | grep -E "Tests |FAIL"
npx eslint components/frontend/templates/divet lib/director.ts 2>&1 | tail -5
grep -rnE "#[0-9a-fA-F]{3,8}\b" components/frontend/templates/divet/Listing*.tsx components/frontend/templates/divet/Directory*.tsx || echo "fara hex"
git add lib/director.ts lib/director.test.ts components/frontend/templates/divet
git commit -m "feat: componentele publice ale directorului si linkul Director in meniu

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 10: Rutele publice `/director/...`

**Files:**
- Create: `app/(frontend)/director/page.tsx`, `app/(frontend)/director/[type]/page.tsx`, `app/(frontend)/director/[type]/[city]/page.tsx`, `app/(frontend)/director/[type]/[city]/[slug]/page.tsx`

Toate: `export const dynamic = 'force-dynamic'`; `notFound()` când `loadDirectorySite()` e `null` (alt template decât `divet`) sau tipul e necunoscut.

- [ ] **Step 1: `app/(frontend)/director/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getDirectorySummary, loadDirectorySite } from '@/lib/director'
import DirectoryIndexTemplate from '@/components/frontend/templates/divet/DirectoryIndexTemplate'

export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const ctx = await loadDirectorySite()
  if (!ctx) return {}
  const summary = await getDirectorySummary(ctx.site.id)
  const base = ctx.siteData.siteUrl.replace(/\/$/, '')
  return {
    title: `Director: veterinari, dresori și toaletaj | ${ctx.siteData.siteName}`,
    description:
      'Cabinete veterinare, dresori și saloane de toaletaj din România, cu date de contact, program și servicii.',
    alternates: { canonical: `${base}/director` },
    robots: summary.total === 0 ? { index: false, follow: true } : undefined,
  }
}

export default async function DirectoryPage() {
  const ctx = await loadDirectorySite()
  if (!ctx) notFound()
  const summary = await getDirectorySummary(ctx.site.id)
  return <DirectoryIndexTemplate site={ctx.siteData} summary={summary} />
}
```

- [ ] **Step 2: `app/(frontend)/director/[type]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTypeFacets, listPublished, loadDirectorySite, resolveCounty } from '@/lib/director'
import { TYPE_LABEL, typeFromSegment, typeListPath } from '@/lib/listings'
import { parsePageParam } from '@/lib/pagination'
import { slugify } from '@/lib/slugify'
import DirectoryListTemplate from '@/components/frontend/templates/divet/DirectoryListTemplate'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ type: string }>
  searchParams: Promise<{ page?: string | string[]; judet?: string | string[]; serviciu?: string | string[] }>
}

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const type = typeFromSegment((await params).type)
  const ctx = await loadDirectorySite()
  if (!type || !ctx) return {}
  const label = TYPE_LABEL[type].plural
  const base = ctx.siteData.siteUrl.replace(/\/$/, '')
  const { total } = await listPublished({ siteId: ctx.site.id, type, page: 1 })
  return {
    title: `${label} din România | ${ctx.siteData.siteName}`,
    description: `${label} din România: date de contact, program și servicii.`,
    alternates: { canonical: `${base}${typeListPath(type)}` },
    robots: total === 0 ? { index: false, follow: true } : undefined,
  }
}

export default async function DirectoryTypePage({ params, searchParams }: Props) {
  const type = typeFromSegment((await params).type)
  if (!type) notFound()
  const ctx = await loadDirectorySite()
  if (!ctx) notFound()

  const sp = await searchParams
  const facets = await getTypeFacets(ctx.site.id, type)
  const county = resolveCounty(facets.counties, one(sp.judet))
  const serviceParam = one(sp.serviciu)
  const serviceSlug = facets.services.some((s) => s.slug === serviceParam) ? serviceParam : undefined
  const page = parsePageParam(sp.page)

  const { cards, total, totalPages } = await listPublished({
    siteId: ctx.site.id,
    type,
    county,
    serviceSlug,
    page,
  })

  const qs = new URLSearchParams()
  if (county) qs.set('judet', slugify(county))
  if (serviceSlug) qs.set('serviciu', serviceSlug)
  const query = qs.toString()
  const basePath = `${typeListPath(type)}${query ? `?${query}` : ''}`

  return (
    <DirectoryListTemplate
      site={ctx.siteData}
      type={type}
      cards={cards}
      total={total}
      page={page}
      totalPages={totalPages}
      basePath={basePath}
      facets={facets}
      selected={{ county, serviceSlug }}
    />
  )
}
```

Notă: `<select name="judet">` din formular trimite numele județului (ex. `Iași`); `resolveCounty` îl normalizează prin `slugify`, deci funcționează atât cu `Iași`, cât și cu `iasi`.

- [ ] **Step 3: `app/(frontend)/director/[type]/[city]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { listPublished, loadDirectorySite } from '@/lib/director'
import { TYPE_LABEL, cityListPath, typeFromSegment } from '@/lib/listings'
import { parsePageParam } from '@/lib/pagination'
import DirectoryListTemplate from '@/components/frontend/templates/divet/DirectoryListTemplate'

export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ type: string; city: string }>
  searchParams: Promise<{ page?: string | string[] }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { type: segment, city: citySlug } = await params
  const type = typeFromSegment(segment)
  const ctx = await loadDirectorySite()
  if (!type || !ctx) return {}
  const { rows } = await listPublished({ siteId: ctx.site.id, type, citySlug, page: 1 })
  if (rows.length === 0) return {}
  const label = TYPE_LABEL[type].plural
  const base = ctx.siteData.siteUrl.replace(/\/$/, '')
  return {
    title: `${label} în ${rows[0].city} | ${ctx.siteData.siteName}`,
    description: `${label} în ${rows[0].city}: date de contact, program și servicii.`,
    alternates: { canonical: `${base}${cityListPath(type, citySlug)}` },
  }
}

export default async function DirectoryCityPage({ params, searchParams }: Props) {
  const { type: segment, city: citySlug } = await params
  const type = typeFromSegment(segment)
  if (!type) notFound()
  const ctx = await loadDirectorySite()
  if (!ctx) notFound()

  const page = parsePageParam((await searchParams).page)
  const { rows, cards, total, totalPages } = await listPublished({ siteId: ctx.site.id, type, citySlug, page })
  // Un oras fara fise publicate nu exista pentru vizitator.
  if (total === 0) notFound()
  const cityName = rows[0]?.city ?? citySlug

  return (
    <DirectoryListTemplate
      site={ctx.siteData}
      type={type}
      city={{ name: cityName, slug: citySlug }}
      cards={cards}
      total={total}
      page={page}
      totalPages={totalPages}
      basePath={cityListPath(type, citySlug)}
    />
  )
}
```

Atenție: pe o pagină > ultima, `rows` e gol dar `total > 0`; `cityName` cade pe `citySlug`. Pentru un nume corect și pe astfel de pagini, ia numele din primul rând al paginii 1 când `rows` e gol (opțional: dacă `rows.length === 0 && total > 0`, reapelează `listPublished({ ..., page: 1 })`).

- [ ] **Step 4: `app/(frontend)/director/[type]/[city]/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublishedListing, getRelatedArticles, loadDirectorySite } from '@/lib/director'
import { TYPE_LABEL, listingPath, typeFromSegment } from '@/lib/listings'
import { generateListingSchema } from '@/lib/seo/listing-schema'
import ListingTemplate from '@/components/frontend/templates/divet/ListingTemplate'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ type: string; city: string; slug: string }> }

async function load(params: Props['params']) {
  const { type: segment, city: citySlug, slug } = await params
  const type = typeFromSegment(segment)
  if (!type) return null
  const ctx = await loadDirectorySite()
  if (!ctx) return null
  const listing = await getPublishedListing({ siteId: ctx.site.id, type, citySlug, slug })
  if (!listing) return null
  return { ctx, type, listing }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await load(params)
  if (!data) return {}
  const { ctx, type, listing } = data
  const base = ctx.siteData.siteUrl.replace(/\/$/, '')
  const fallback = `${TYPE_LABEL[type].singular} în ${listing.city}: date de contact, program și servicii.`
  return {
    title: `${listing.name} – ${TYPE_LABEL[type].singular} în ${listing.city} | ${ctx.siteData.siteName}`,
    description: (listing.description ?? fallback).slice(0, 155),
    alternates: { canonical: `${base}${listingPath(listing)}` },
  }
}

export default async function ListingPage({ params }: Props) {
  const data = await load(params)
  if (!data) notFound()
  const { ctx, type, listing } = data

  const related = await getRelatedArticles(ctx.site.id, type, ctx.siteData.siteUrl)
  const schemas = generateListingSchema(listing, ctx.siteData.siteUrl)

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, '\\u003c') }}
        />
      ))}
      <ListingTemplate
        site={ctx.siteData}
        listing={{ ...listing, services: listing.services.map((s) => s.service.name) }}
        related={related}
      />
    </>
  )
}
```

- [ ] **Step 5: Verifică și commit**

```bash
npx tsc --noEmit | tail -5
npx eslint "app/(frontend)/director" 2>&1 | tail -5
git add "app/(frontend)/director"
git commit -m "feat: rutele publice /director (index, tip, oras, fisa)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 11: Sitemap

**Files:**
- Modify: `app/sitemap.ts`

- [ ] **Step 1: Importă funcția pură**

În `app/sitemap.ts`, adaugă la importuri: `import { buildDirectoryPaths } from '@/lib/director'`.

- [ ] **Step 2: Adaugă intrările, imediat înainte de `return entries`**

```ts
  // Director: doar cu template-ul `divet` (altfel rutele dau 404) si doar fise publicate.
  const directorySite = await prisma.site.findFirst({
    where: { isActive: true },
    select: { id: true, template: true },
  })
  if (directorySite?.template === 'divet') {
    const listings = await prisma.listing.findMany({
      where: { siteId: directorySite.id, status: 'PUBLISHED' },
      select: { type: true, citySlug: true, slug: true, updatedAt: true },
    })
    for (const e of buildDirectoryPaths(listings)) {
      entries.push({
        url: `${siteUrl}${e.path}`,
        lastModified: e.lastModified,
        changeFrequency: 'weekly',
        priority: e.priority,
      })
    }
  }
```

- [ ] **Step 3: Verifică și commit**

```bash
npx tsc --noEmit | tail -3
git add app/sitemap.ts
git commit -m "feat: fisele publicate din director apar in sitemap

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 12: Administrare (`/admin/director`)

**Files:**
- Modify: `components/admin/AdminSidebar.tsx`
- Create: `app/(admin)/admin/director/page.tsx`, `app/(admin)/admin/director/[id]/page.tsx`, `app/(admin)/admin/director/servicii/page.tsx`, `components/admin/ListingForm.tsx`

Stilul urmează `app/(admin)/admin/categories/page.tsx` (tema întunecată, clase `slate-*`). Pagini client (`'use client'`) care apelează API-urile din Task 4–5.

- [ ] **Step 1: Intrare în bara laterală**

În `AdminSidebar.tsx`: adaugă `MapPin` la importul din `lucide-react` și, în `navItems`, după linia `Categorii`:

```ts
  { href: '/admin/director', label: 'Director', icon: MapPin },
```

- [ ] **Step 2: `components/admin/ListingForm.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DAYS, DAY_LABEL, LISTING_TYPES, TYPE_LABEL, parseOpeningHours, type Day, type ListingType } from '@/lib/listings'

type HoursRow = { closed: boolean; from: string; to: string }
type Service = { id: string; name: string }

type FormState = {
  type: ListingType
  name: string
  county: string
  city: string
  address: string
  phone: string
  email: string
  website: string
  description: string
  status: 'DRAFT' | 'PUBLISHED'
  serviceIds: string[]
  hoursEnabled: boolean
  hours: Record<Day, HoursRow>
}

const defaultHours = (): Record<Day, HoursRow> =>
  Object.fromEntries(
    DAYS.map((d) => [d, { closed: d === 'sat' || d === 'sun', from: '09:00', to: '18:00' }]),
  ) as Record<Day, HoursRow>

const EMPTY: FormState = {
  type: 'VET',
  name: '',
  county: '',
  city: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  description: '',
  status: 'DRAFT',
  serviceIds: [],
  hoursEnabled: false,
  hours: defaultHours(),
}

const input =
  'w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none'
const label = 'mb-1 block text-xs font-medium text-slate-400'

export default function ListingForm({ id }: { id?: string }) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(EMPTY)
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  // Fisa existenta
  useEffect(() => {
    if (!id) return
    fetch(`/api/listings/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Fișa nu a fost găsită'))))
      .then(({ listing }) => {
        const parsed = parseOpeningHours(listing.openingHours)
        const hours = defaultHours()
        if (parsed.ok) {
          for (const d of DAYS) {
            const first = parsed.value[d][0]
            hours[d] = first ? { closed: false, from: first.from, to: first.to } : { closed: true, from: '09:00', to: '18:00' }
          }
        }
        setForm({
          type: listing.type,
          name: listing.name,
          county: listing.county,
          city: listing.city,
          address: listing.address ?? '',
          phone: listing.phone ?? '',
          email: listing.email ?? '',
          website: listing.website ?? '',
          description: listing.description ?? '',
          status: listing.status,
          serviceIds: listing.services.map((s: { serviceId: string }) => s.serviceId),
          hoursEnabled: parsed.ok,
          hours,
        })
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  // Serviciile tipului ales
  useEffect(() => {
    fetch(`/api/listing-services?type=${form.type}`)
      .then((r) => r.json())
      .then(({ services }) => setServices(services ?? []))
      .catch(() => setServices([]))
  }, [form.type])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    const openingHours = form.hoursEnabled
      ? Object.fromEntries(DAYS.map((d) => [d, form.hours[d].closed ? [] : [{ from: form.hours[d].from, to: form.hours[d].to }]]))
      : null
    const validServiceIds = form.serviceIds.filter((sid) => services.some((s) => s.id === sid))
    const res = await fetch(id ? `/api/listings/${id}` : '/api/listings', {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, serviceIds: validServiceIds, openingHours }),
    })
    const data = await res.json().catch(() => ({}))
    setSaving(false)
    if (!res.ok) {
      setError(data.error ?? 'Nu am putut salva fișa')
      return
    }
    router.push('/admin/director')
    router.refresh()
  }

  if (loading) return <p className="p-6 text-slate-400">Se încarcă…</p>

  return (
    <form onSubmit={save} className="mx-auto max-w-3xl space-y-5 p-6">
      <h1 className="text-xl font-semibold text-white">{id ? 'Editează fișa' : 'Fișă nouă'}</h1>
      {error ? <p className="rounded-lg bg-red-900/40 px-3 py-2 text-sm text-red-200">{error}</p> : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={label}>Tip</label>
          <select className={input} value={form.type} onChange={(e) => set('type', e.target.value as ListingType)}>
            {LISTING_TYPES.map((t) => (
              <option key={t} value={t}>{TYPE_LABEL[t].singular}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label}>Status</label>
          <select className={input} value={form.status} onChange={(e) => set('status', e.target.value as FormState['status'])}>
            <option value="DRAFT">Ciornă (nu apare pe site)</option>
            <option value="PUBLISHED">Publicată</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Nume *</label>
          <input className={input} value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div>
          <label className={label}>Județ *</label>
          <input className={input} value={form.county} onChange={(e) => set('county', e.target.value)} required />
        </div>
        <div>
          <label className={label}>Oraș *</label>
          <input className={input} value={form.city} onChange={(e) => set('city', e.target.value)} required />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Adresă</label>
          <input className={input} value={form.address} onChange={(e) => set('address', e.target.value)} />
        </div>
        <div>
          <label className={label}>Telefon</label>
          <input className={input} value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="0721 234 567" />
        </div>
        <div>
          <label className={label}>E-mail</label>
          <input className={input} type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Site</label>
          <input className={input} value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="exemplu.ro" />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Descriere (text simplu)</label>
          <textarea className={input} rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>
      </div>

      <fieldset>
        <legend className={label}>Servicii</legend>
        {services.length === 0 ? (
          <p className="text-sm text-slate-500">Nu există servicii pentru acest tip. Adaugă-le în „Servicii”.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {services.map((s) => (
              <label key={s.id} className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={form.serviceIds.includes(s.id)}
                  onChange={(e) =>
                    set('serviceIds', e.target.checked ? [...form.serviceIds, s.id] : form.serviceIds.filter((x) => x !== s.id))
                  }
                />
                {s.name}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <fieldset>
        <legend className={label}>Program</legend>
        <label className="mb-3 flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" checked={form.hoursEnabled} onChange={(e) => set('hoursEnabled', e.target.checked)} />
          Specifică programul
        </label>
        {form.hoursEnabled ? (
          <div className="space-y-2">
            {DAYS.map((d) => (
              <div key={d} className="flex flex-wrap items-center gap-3 text-sm text-slate-200">
                <span className="w-24">{DAY_LABEL[d]}</span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={form.hours[d].closed}
                    onChange={(e) => set('hours', { ...form.hours, [d]: { ...form.hours[d], closed: e.target.checked } })}
                  />
                  Închis
                </label>
                {!form.hours[d].closed ? (
                  <>
                    <input
                      type="time"
                      className={`${input} w-28`}
                      value={form.hours[d].from}
                      onChange={(e) => set('hours', { ...form.hours, [d]: { ...form.hours[d], from: e.target.value } })}
                    />
                    <span>–</span>
                    <input
                      type="time"
                      className={`${input} w-28`}
                      value={form.hours[d].to}
                      onChange={(e) => set('hours', { ...form.hours, [d]: { ...form.hours[d], to: e.target.value } })}
                    />
                  </>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
      </fieldset>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50">
          {saving ? 'Se salvează…' : 'Salvează'}
        </button>
        <button type="button" onClick={() => router.push('/admin/director')} className="rounded-lg px-4 py-2 text-sm text-slate-300 hover:bg-slate-700">
          Anulează
        </button>
      </div>
    </form>
  )
}
```

Notă: editorul de program acceptă un singur interval pe zi (ca în spec). Dacă o fișă are mai multe intervale pe zi (introduse prin API), editorul păstrează doar primul la salvare.

- [ ] **Step 3: Paginile `new`/`[id]`**

`app/(admin)/admin/director/[id]/page.tsx`:

```tsx
import ListingForm from '@/components/admin/ListingForm'

export default async function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ListingForm id={id === 'new' ? undefined : id} />
}
```

(`/admin/director/new` folosește același segment `[id]` cu valoarea `new`.)

- [ ] **Step 4: Lista `app/(admin)/admin/director/page.tsx`**

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import { LISTING_TYPES, TYPE_LABEL, type ListingType } from '@/lib/listings'

type Row = {
  id: string
  name: string
  type: ListingType
  city: string
  county: string
  status: 'DRAFT' | 'PUBLISHED'
  services: Array<{ service: { name: string } }>
}

const select = 'rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white'

export default function DirectoryAdminPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [total, setTotal] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [page, setPage] = useState(1)
  const [type, setType] = useState('')
  const [status, setStatus] = useState('')
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const sp = new URLSearchParams({ page: String(page) })
    if (type) sp.set('type', type)
    if (status) sp.set('status', status)
    if (q.trim()) sp.set('q', q.trim())
    const res = await fetch(`/api/listings?${sp}`)
    if (res.ok) {
      const data = await res.json()
      setRows(data.listings)
      setTotal(data.total)
      setPageSize(data.pageSize)
    }
    setLoading(false)
  }, [page, type, status, q])

  useEffect(() => {
    load()
  }, [load])

  async function remove(row: Row) {
    if (!confirm(`Ștergi fișa „${row.name}”? Acțiunea nu poate fi anulată.`)) return
    const res = await fetch(`/api/listings/${row.id}`, { method: 'DELETE' })
    if (res.ok) load()
    else alert('Nu am putut șterge fișa')
  }

  const pages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold text-white">Director</h1>
        <Link href="/admin/director/servicii" className="text-sm text-slate-300 hover:text-white">Servicii</Link>
        <Link href="/admin/director/new" className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500">
          <Plus size={14} /> Fișă nouă
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <select className={select} value={type} onChange={(e) => { setPage(1); setType(e.target.value) }}>
          <option value="">Toate tipurile</option>
          {LISTING_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t].plural}</option>)}
        </select>
        <select className={select} value={status} onChange={(e) => { setPage(1); setStatus(e.target.value) }}>
          <option value="">Orice status</option>
          <option value="PUBLISHED">Publicate</option>
          <option value="DRAFT">Ciorne</option>
        </select>
        <input className={select} placeholder="Caută după nume sau oraș" value={q} onChange={(e) => { setPage(1); setQ(e.target.value) }} />
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-700 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-4 py-3">Nume</th>
              <th className="px-3 py-3">Tip</th>
              <th className="px-3 py-3">Oraș</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3 text-right">Acțiuni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-6 text-slate-400">Se încarcă…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-6 text-slate-400">Nicio fișă.</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-medium text-white">{r.name}</td>
                  <td className="px-3 py-3 text-slate-300">{TYPE_LABEL[r.type].singular}</td>
                  <td className="px-3 py-3 text-slate-300">{r.city}, {r.county}</td>
                  <td className="px-3 py-3">
                    <span className={r.status === 'PUBLISHED' ? 'text-green-400' : 'text-slate-400'}>
                      {r.status === 'PUBLISHED' ? 'Publicată' : 'Ciornă'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex justify-end gap-1">
                      <Link href={`/admin/director/${r.id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white" title="Editează">
                        <Edit2 size={14} />
                      </Link>
                      <button onClick={() => remove(r)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400" title="Șterge">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {pages > 1 ? (
        <div className="mt-4 flex items-center gap-3 text-sm text-slate-300">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40">Înapoi</button>
          <span>Pagina {page} din {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-lg px-3 py-1.5 hover:bg-slate-700 disabled:opacity-40">Înainte</button>
        </div>
      ) : null}
    </div>
  )
}
```

- [ ] **Step 5: Pagina de servicii `app/(admin)/admin/director/servicii/page.tsx`**

```tsx
'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2 } from 'lucide-react'
import { LISTING_TYPES, TYPE_LABEL, type ListingType } from '@/lib/listings'

type Service = { id: string; name: string; slug: string; _count: { listings: number } }

const input = 'rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white'

export default function ListingServicesPage() {
  const [type, setType] = useState<ListingType>('VET')
  const [services, setServices] = useState<Service[]>([])
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/listing-services?type=${type}`)
    if (res.ok) setServices((await res.json()).services)
  }, [type])

  useEffect(() => {
    load()
  }, [load])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const res = await fetch('/api/listing-services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, name }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) return setError(data.error ?? 'Nu am putut adăuga serviciul')
    setName('')
    load()
  }

  async function remove(s: Service) {
    const warning = s._count.listings > 0 ? ` Este folosit de ${s._count.listings} fișe.` : ''
    if (!confirm(`Ștergi serviciul „${s.name}”?${warning}`)) return
    const res = await fetch(`/api/listing-services/${s.id}`, { method: 'DELETE' })
    if (res.ok) load()
  }

  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-4 flex items-center gap-3">
        <h1 className="mr-auto text-xl font-semibold text-white">Servicii director</h1>
        <Link href="/admin/director" className="text-sm text-slate-300 hover:text-white">Înapoi la fișe</Link>
      </div>

      <div className="mb-4 flex gap-2">
        {LISTING_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={`rounded-lg px-3 py-1.5 text-sm ${type === t ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
          >
            {TYPE_LABEL[t].plural}
          </button>
        ))}
      </div>

      <form onSubmit={add} className="mb-4 flex gap-2">
        <input className={`${input} flex-1`} placeholder="Serviciu nou" value={name} onChange={(e) => setName(e.target.value)} required />
        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500">Adaugă</button>
      </form>
      {error ? <p className="mb-3 text-sm text-red-300">{error}</p> : null}

      <ul className="divide-y divide-slate-700/50 rounded-xl border border-slate-700">
        {services.length === 0 ? (
          <li className="px-4 py-4 text-sm text-slate-400">Niciun serviciu.</li>
        ) : (
          services.map((s) => (
            <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <span className="flex-1 text-white">{s.name}</span>
              <span className="text-xs text-slate-500">{s._count.listings} fișe</span>
              <button onClick={() => remove(s)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-700 hover:text-red-400" title="Șterge">
                <Trash2 size={14} />
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  )
}
```

- [ ] **Step 6: Verifică și commit**

```bash
npx tsc --noEmit | tail -5
npx eslint components/admin/ListingForm.tsx "app/(admin)/admin/director" components/admin/AdminSidebar.tsx 2>&1 | tail -8
npx vitest run 2>&1 | grep -E "Tests |FAIL"
git add components/admin "app/(admin)/admin/director"
git commit -m "feat: administrarea directorului (lista, formular, servicii)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

Admin-ul nu are teste automate (ca restul paginilor admin); se verifică în Task 13, în browser.

---

### Task 13: Verificare în producție locală, documentație, PR

**Files:**
- Modify: `docs/deploy-divet.ro.md`, `docs/superpowers/specs/2026-10-19-director-listings-design.md`

- [ ] **Step 1: Build de producție și server local**

```bash
npm run build 2>&1 | tail -5; echo "exit $?"      # trebuie sa treaca, fara avertismente noi
(NEXTAUTH_URL=http://localhost:3002 AUTH_URL=http://localhost:3002 npx next start -p 3002 > /tmp/start.log 2>&1 &)
sleep 8
```

Baza locală trebuie să aibă template-ul `divet` pe site (`select template from "Site"`) și să fi rulat seed-urile din Task 6.

- [ ] **Step 2: Matricea de răspunsuri (rulează tot blocul)**

Funcția `chk` trăiește doar în apelul de shell în care e definită: rulează Step 2 și Step 4 în același apel sau redefinește-o.

```bash
B=http://localhost:3002
chk() { c=$(curl -s -o /dev/null -w '%{http_code}' "$B$1"); [ "$c" = "$2" ] && echo "OK   $c $1" || echo "FAIL $c (asteptat $2) $1"; }
chk /director 200
chk /director/veterinari 200
chk /director/dresori 200
chk /director/toaletaj 200
chk /director/veterinari/cluj-napoca 200
chk /director/veterinari/cluj-napoca/cabinet-veterinar-popescu 200
chk /director/toaletaj/iasi/salon-pufi 200
chk /director/toaletaj/iasi/salon-draft-neterminat 404      # ciorna
chk /director/dresori/iasi 404                               # oras fara fise de acest tip
chk /director/veterinari/inexistent 404
chk /director/pensiuni 404                                   # tip necunoscut
chk "/director/veterinari?page=abc" 200
chk "/director/veterinari?judet=iasi" 200
chk "/director/veterinari?judet=Ia%C8%99i&serviciu=urgente-24-7" 200
chk "/director/veterinari?serviciu=nu-exista" 200
chk /sitemap.xml 200
curl -s $B/sitemap.xml | grep -c "/director"                 # >= 10
curl -s $B/sitemap.xml | grep -c "salon-draft-neterminat"    # 0
bash scripts/smoke.sh $B 60 | tail -3                        # Esuate: 0
```

Expected: toate liniile `OK`; `grep -c "/director"` ≥ 10; ciorna 0 în sitemap; smoke `Esuate: 0`.

- [ ] **Step 3: Conținut și JSON-LD**

```bash
curl -s $B/director/veterinari/cluj-napoca/cabinet-veterinar-popescu | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
const ld=[...s.matchAll(/<script type=\"application\/ld\+json\">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
console.log(ld.map(x=>x['@type']).join(','));            // VeterinaryCare,BreadcrumbList
console.log(/0264 123 456|264 123 456/.test(s) ? 'telefon formatat' : 'LIPSA telefon');
console.log(/Luni/.test(s) ? 'program afisat' : 'LIPSA program');
console.log(/<title>[^<]*Cabinet Veterinar Popescu[^<]*<\/title>/.test(s) ? 'titlu OK' : 'titlu gresit');
})"
curl -s $B/director | grep -o 'href="/director[^"]*"' | sort -u | head
curl -s $B/caini | grep -c 'href="/director"'      # >= 1: linkul din meniu apare
```

- [ ] **Step 4: Comutarea pe alt template dă 404**

```bash
PSQL="/c/Program Files/PostgreSQL/17/bin/psql.exe"
URL=$(grep -m1 '^DATABASE_URL' .env | cut -d= -f2- | tr -d '"' | sed 's/?.*//')
"$PSQL" "$URL" -c "update \"Site\" set template='fauna' where domain='divet.ro'"
chk /director 404
chk /director/veterinari 404
"$PSQL" "$URL" -c "update \"Site\" set template='divet' where domain='divet.ro'"
chk /director 200
```

- [ ] **Step 5: Admin în browser (built-in)**

Intră în `http://localhost:3002/admin/director` (autentificat cu contul local de dezvoltare, cel din `prisma/seed.ts`/`.env`; nu introduce parole reale ale altor servicii). Verifică: lista arată cele 6 fișe; filtrele (tip, status, căutare) funcționează; „Fișă nouă" cu telefon `123` arată eroarea „Telefon invalid"; o fișă completă se salvează și apare în listă; editarea păstrează serviciile și programul; ștergerea cere confirmare; `/admin/director/servicii` adaugă și șterge un serviciu; bara laterală are „Director". Dacă nu poți autentifica local, raportează asta explicit și rulează doar testele API (Task 4–5).

Verifică vizual `/director`, `/director/veterinari` și o fișă, la 1280 px și la 375 px (`resize_window` mobile): fără scroll orizontal, linkul „Director" apare în meniu (desktop) și în „Meniu" (mobil), tastatura (Tab) ajunge la formularul de filtre. Resetează fereastra la `desktop`.

- [ ] **Step 6: Repetiție a migrării pe o bază care imită producția**

Producția are o bază fără tabelele noi. Simulează-o din baza locală:

```bash
# opreste serverul local de pe 3002 (taskkill dupa PID din netstat) si orice next dev
PSQL="/c/Program Files/PostgreSQL/17/bin/psql.exe"
ADMIN_URL="postgresql://postgres@127.0.0.1:5433/postgres"     # ajusteaza userul superuser local
"$PSQL" "$ADMIN_URL" -c 'DROP DATABASE IF EXISTS scratch_listings' -c 'CREATE DATABASE scratch_listings TEMPLATE velocitycms'
SCR="postgresql://cms_user@127.0.0.1:5433/scratch_listings"   # ajusteaza userul/parola ca in .env
"$PSQL" "$SCR" -c 'DROP TABLE "ListingServiceLink","ListingService","Listing" CASCADE' -c 'DROP TYPE "ListingType","ListingStatus"' -c "DELETE FROM _prisma_migrations WHERE migration_name='20261019120000_listings'"
DATABASE_URL="$SCR" npx prisma migrate deploy 2>&1 | tail -6      # trebuie sa aplice EXACT o migrare
DATABASE_URL="$SCR" node --env-file=.env node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/seed-listing-services.ts | tail -2
DATABASE_URL="$SCR" node --env-file=.env node_modules/ts-node/dist/bin.js --compiler-options '{"module":"CommonJS"}' scripts/seed-listing-services.ts | tail -1   # a doua rulare: fara erori
"$PSQL" "$SCR" -c 'select count(*) from "ListingService"'          # 13, nu 26
"$PSQL" "$ADMIN_URL" -c 'DROP DATABASE scratch_listings'
```

`node --env-file=.env` nu suprascrie `DATABASE_URL` deja setat în mediu; dacă seed-ul s-a conectat totuși la baza principală, count-ul din `velocitycms` rămâne 13 (idempotent), dar verifică în ieșire că a folosit baza `scratch_listings`.

- [ ] **Step 7: Documentație**

În `docs/deploy-divet.ro.md`:
- La „Ce se schimbă" adaugă: `- **Director:** migrare aditivă (`Listing`, `ListingService`, `ListingServiceLink`), seed de servicii (13). Directorul rămâne gol și invizibil (fără link în meniu, fără intrări în sitemap) până adaugi fișe din `/admin/director`.`
- La „Ce face scriptul" înlocuiește `seed-uri (`--seed`)` cu `seed-uri (`--seed`: categorii, câmpuri, servicii director)`.
- La „Riscuri și limitări cunoscute" adaugă: `- Pagina `/director` face câte un `groupBy` pe cerere; suficient pentru sute de fișe, de revăzut peste câteva mii. Directorul funcționează doar cu template-ul `divet` (pe celelalte, rutele dau 404). Editorul de program din admin păstrează un singur interval pe zi.`

În `docs/superpowers/specs/2026-10-19-director-listings-design.md`:
- Înlocuiește propoziția despre `revalidateTag` din secțiunea Administrare cu: „Paginile publice nu au cache (`force-dynamic`), deci scrierile din API nu apelează `revalidateTag`."
- În „Testare și lansare", înlocuiește propoziția despre `scripts/smoke.sh` cu: „`scripts/smoke.sh` verifică automat `/director` și fișele publicate, pentru că apar în sitemap; 404-ul pentru o fișă `DRAFT` se verifică local."
- La „Model de date" notează: „`name`, `county` și `city` sunt obligatorii și pentru `DRAFT`; la publicare se cere în plus telefon sau e-mail."
- La „Rute publice" notează: „Un oraș fără fișe publicate dă 404; `/director` și `/director/<tip>` goale dau 200 cu `noindex`."
- În antet schimbă `Stare:` în `implementat pe branch-ul feat/director-fise; neaplicat pe producție`.

- [ ] **Step 8: Verificare finală, commit, push, PR**

```bash
npx vitest run 2>&1 | grep -E "Tests |FAIL"     # toate trec
npx tsc --noEmit | grep -c "error TS"            # 0
npx eslint lib/listings.ts lib/director.ts lib/seo/listing-schema.ts "app/(frontend)/director" app/api/listings app/api/listing-services 2>&1 | tail -5
git add docs
git commit -m "docs: runbook si spec actualizate pentru director

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
git push -u origin feat/director-fise
gh pr create --repo cosminstan90/velocitycms --base main --head feat/director-fise --title "Director de fise (faza 2, sub-proiectul 1)" --body-file - <<'EOF'
## Ce aduce
Directorul de cabinete veterinare, dresori si saloane de toaletaj: model `Listing`, administrare in `/admin/director`, pagini publice `/director/...`, JSON-LD (`VeterinaryCare`/`LocalBusiness` + `BreadcrumbList`), sitemap. Fara inscriere publica, planuri platite sau afiliere (sub-proiecte ulterioare). Spec: `docs/superpowers/specs/2026-10-19-director-listings-design.md`.

## Verificat
Teste Vitest, `tsc` 0 erori, build de productie; matricea de raspunsuri in modul de productie local (inclusiv ciorna 404, oras fara fise 404, template `fauna` -> 404), `scripts/smoke.sh` fara esecuri, repetitia migrarii pe o baza care imita productia.

## Lansare
Migrare aditiva (1) + seed de servicii; directorul ramane gol si invizibil pana adaugi fise. Pasii pe server cer acordul proprietarului (runbook: `docs/deploy-divet.ro.md`).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
```

**Nu face merge și nu lansa pe producție**: ambele cer acordul explicit al proprietarului, ca la faza 1.

---

## Autoverificare a planului față de spec

| Cerință din spec | Task |
|---|---|
| Model `Listing`, `ListingService`, legătură, enum-uri, migrare aditivă prin `migrate diff` | 2 |
| Rute `/director`, `/<tip>`, `/<tip>/<oras>`, `/<tip>/<oras>/<slug>`, `force-dynamic`, `parsePageParam` | 10 |
| Segmente `veterinari`/`dresori`/`toaletaj`, tip necunoscut și `DRAFT` → 404 | 1, 10, 13 |
| Slug rezervat `director` | 3 |
| Fișa cu contact, program, servicii, articole din grupul potrivit | 9, 10 (`getRelatedArticles`) |
| JSON-LD `VeterinaryCare`/`LocalBusiness`/`BreadcrumbList`, fără `aggregateRating` | 7 |
| Metadata, canonical, `noindex` pe liste goale | 10 |
| Sitemap doar cu fișe publicate; link în meniu doar cu fișe | 8 (`buildDirectoryPaths`), 9, 11 |
| Template doar `divet`, altfel 404 | 8 (`loadDirectorySite`), 13 |
| Admin: listă, formular, program, servicii, sidebar | 12 |
| API cu gardă de duplicat, 409, teste pe handlere | 4, 5 |
| Validări: telefon, site, e-mail, program, publicare | 1 |
| Seed servicii idempotent + legare în deploy; seed local de probă cu gardă | 6 |
| Testare: Vitest, smoke, repetiție de migrare, runbook | 1–8, 13 |

Tipuri și nume folosite consecvent: `ListingType`, `ListingInput`, `OpeningHours`, `parseListingInput`, `nextFreeSlug`, `listingPath`/`cityListPath`/`typeListPath`, `listingCard`, `ListingCardProps`, `DirectorySummary`, `TypeFacets`, `buildListingWhere`, `buildDirectoryPaths`, `loadDirectorySite` (definite în Task 1/8, folosite în 9–12).
