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
  if (url.username || url.password) return null
  if (!url.hostname.includes('.')) return null
  const out = url.toString()
  return url.pathname === '/' && !url.search && !url.hash ? out.slice(0, -1) : out
}

export function isValidEmail(input: string): boolean {
  return /^[^\s@?<>,;:"]+@[^\s@?<>,;:"]+\.[a-z]{2,}$/i.test(input)
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
    intervals.sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0))
    for (let i = 1; i < intervals.length; i++) {
      if (intervals[i - 1].to > intervals[i].from) return { ok: false, error: `Intervale suprapuse pentru ${DAY_LABEL[day]}` }
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
    if (slug.length > 240) return fail('Slug-ul poate avea cel mult 240 de caractere')
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
