import { describe, it, expect } from 'vitest'
import { LISTS, getList, listAvailability, MIN_LIST_ENTRIES, type FieldMap } from './lists'

const dog = (f: FieldMap) => ({ fields: f })

describe('list definitions', () => {
  it('have unique slugs, 2+ intro paragraphs and 3+ FAQ items', () => {
    expect(new Set(LISTS.map((l) => l.slug)).size).toBe(LISTS.length)
    for (const l of LISTS) {
      expect(l.intro.length, l.slug).toBeGreaterThanOrEqual(2)
      expect(l.faq.length, l.slug).toBeGreaterThanOrEqual(3)
      expect(l.metaTitle.length, l.slug).toBeLessThanOrEqual(60)
      expect(l.metaDesc.length, l.slug).toBeGreaterThanOrEqual(110)
      expect(l.metaDesc.length, l.slug).toBeLessThanOrEqual(170)
    }
  })

  it('never promise safety, health outcomes or numbers the fiches do not carry', () => {
    for (const l of LISTS) {
      const text = [...l.intro, ...l.faq.map((q) => q.answer)].join(' ')
      expect(text, l.slug).not.toMatch(/\bhipoalergen|\bnu năpârlește|\bsigur\b|\bgarantat/i)
    }
  })
})

describe('filters', () => {
  const by = (slug: string) => getList(slug)!

  it('size lists use the talie field, diacritics and case insensitive', () => {
    expect(by('rase-de-caini-mari').match({ talie: 'Mare' })).toBe(true)
    expect(by('rase-de-caini-mari').match({ talie: 'mare' })).toBe(true)
    expect(by('rase-de-caini-mari').match({ talie: 'Mic' })).toBe(false)
    expect(by('rase-de-caini-mici').match({ talie: 'Mic' })).toBe(true)
    expect(by('rase-de-caini-mari').match({})).toBe(false)
  })

  it('apartment list needs small/medium size AND low/medium energy', () => {
    const l = by('rase-de-caini-pentru-apartament')
    expect(l.match({ talie: 'Mic', nivel_energie: 'Scăzut' })).toBe(true)
    expect(l.match({ talie: 'Mediu', nivel_energie: 'Mediu' })).toBe(true)
    expect(l.match({ talie: 'Mic', nivel_energie: 'Ridicat' })).toBe(false)
    expect(l.match({ talie: 'Mare', nivel_energie: 'Scăzut' })).toBe(false)
    expect(l.match({ talie: 'Mic' })).toBe(false)
  })

  it('intelligence list uses training ease only', () => {
    const l = by('cele-mai-inteligente-rase-de-caini')
    expect(l.match({ usurinta_dresaj: 'Foarte ridicat' })).toBe(true)
    expect(l.match({ usurinta_dresaj: 'Mediu' })).toBe(false)
  })
})

describe('listAvailability', () => {
  const def = getList('rase-de-caini-mari')!
  const many = (n: number, f: FieldMap) => Array.from({ length: n }, () => dog(f))

  it('needs the minimum number of entries', () => {
    const posts = [...many(MIN_LIST_ENTRIES - 1, { talie: 'Mare' }), ...many(10, { talie: 'Mic' })]
    expect(listAvailability(def, posts, MIN_LIST_ENTRIES)).toMatchObject({ available: false, reason: 'too-few' })
    posts.push(dog({ talie: 'Mare' }))
    expect(listAvailability(def, posts, MIN_LIST_ENTRIES)).toMatchObject({ available: true, count: MIN_LIST_ENTRIES })
  })

  it('refuses a filter that contains almost every fiche', () => {
    const posts = [...many(9, { talie: 'Mare' }), ...many(1, { talie: 'Mic' })]
    expect(listAvailability(def, posts, 8)).toMatchObject({ available: false, reason: 'not-selective' })
  })

  it('works on an empty group', () => {
    expect(listAvailability(def, [], 8)).toMatchObject({ available: false, count: 0, total: 0 })
  })
})
