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
