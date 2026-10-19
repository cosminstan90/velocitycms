import { describe, it, expect } from 'vitest'
import {
  buildListingWhere,
  resolveCounty,
  summarizeDirectory,
  listingCard,
  buildDirectoryPaths,
  PAGE_SIZE,
  countyVariants,
  metaDescription,
  mergeCities,
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

describe('buildListingWhere cu variante de judet', () => {
  it('filtreaza dupa toate scrierile', () => {
    expect(buildListingWhere({ siteId: 's1', type: 'VET', counties: ['Iași', 'Iasi'] })).toMatchObject({
      county: { in: ['Iași', 'Iasi'] },
    })
  })
  it('lista goala nu filtreaza', () => {
    expect(buildListingWhere({ siteId: 's1', type: 'VET', counties: [] })).not.toHaveProperty('county')
  })
})

describe('countyVariants', () => {
  it('returneaza toate scrierile cu acelasi slug', () => {
    expect(countyVariants(['Iași', 'Iasi', 'Cluj'], 'iasi')).toEqual(['Iași', 'Iasi'])
    expect(countyVariants(['Cluj'], 'nu-exista')).toEqual([])
    expect(countyVariants(['Cluj'], undefined)).toEqual([])
  })
})

describe('mergeCities / duplicate citySlug', () => {
  it('insumeaza si pastreaza numele cel mai frecvent', () => {
    expect(
      mergeCities([
        { citySlug: 'iasi', city: 'Iasi', count: 1 },
        { citySlug: 'iasi', city: 'Iași', count: 2 },
      ]),
    ).toEqual([{ citySlug: 'iasi', city: 'Iași', count: 3 }])
  })
  it('summarizeDirectory nu dubleaza orasele', () => {
    const s = summarizeDirectory([
      { type: 'VET', citySlug: 'iasi', city: 'Iasi', _count: { _all: 1 } },
      { type: 'VET', citySlug: 'iasi', city: 'Iași', _count: { _all: 2 } },
    ])
    expect(s.total).toBe(3)
    expect(s.byType.VET.cities).toEqual([{ citySlug: 'iasi', city: 'Iași', count: 3 }])
  })
})

describe('metaDescription', () => {
  it('colapseaza spatiile si foloseste fallback pentru gol', () => {
    expect(metaDescription('  a  b ', 'fb')).toBe('a b')
    expect(metaDescription(null, 'fb')).toBe('fb')
    expect(metaDescription('   ', 'fb')).toBe('fb')
  })
  it('taie la limita de cuvant, max 155', () => {
    const text = 'cuvant '.repeat(40)
    const out = metaDescription(text, 'fb')
    expect(out.length).toBeLessThanOrEqual(155)
    expect(out.endsWith('cuvant')).toBe(true)
  })
  it('un cuvant foarte lung se taie la 155', () => {
    expect(metaDescription('x'.repeat(300), 'fb')).toHaveLength(155)
  })
})
