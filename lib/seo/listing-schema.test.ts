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
