import { describe, it, expect } from 'vitest'
import { LISTS, getList, listAvailability, listMatches, MIN_LIST_ENTRIES, CURATED_MIN_ENTRIES, type FieldMap } from './lists'

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

describe('curated „rase asemănătoare" lists', () => {
  const curated = LISTS.filter((l) => l.curated)

  it('exist, each with 3+ distinct members and a short note per member', () => {
    expect(curated.length).toBeGreaterThanOrEqual(3)
    for (const l of curated) {
      const slugs = l.curated!.map((c) => c.slug)
      expect(slugs.length, l.slug).toBeGreaterThanOrEqual(CURATED_MIN_ENTRIES)
      expect(new Set(slugs).size, l.slug).toBe(slugs.length)
      expect(l.slug, l.slug).toMatch(/^rase-asemanatoare-cu-/)
      for (const c of l.curated!) {
        const words = c.note.split(/\s+/).length
        expect(words, `${l.slug}/${c.slug}`).toBeGreaterThanOrEqual(12)
        expect(words, `${l.slug}/${c.slug}`).toBeLessThanOrEqual(45)
      }
      if (l.subject) expect(slugs.some((s) => l.subject!.href.endsWith(`/${s}`)), l.slug).toBe(false)
    }
  })

  it('match by slug only, never by fields', () => {
    const l = getList('rase-asemanatoare-cu-labrador')!
    expect(listMatches(l, { slug: 'vizsla', fields: {} })).toBe(true)
    expect(listMatches(l, { slug: 'beagle', fields: { talie: 'Mare' } })).toBe(false)
    expect(listMatches(l, { fields: { talie: 'Mare' } })).toBe(false)
  })

  it('publish with CURATED_MIN_ENTRIES published members, without the selectivity rule', () => {
    const l = getList('rase-asemanatoare-cu-bichon')!
    const two = [{ slug: 'coton-de-tulear', fields: {} }, { slug: 'lagotto-romagnolo', fields: {} }]
    expect(listAvailability(l, two)).toMatchObject({ available: false, reason: 'too-few', count: 2 })
    const three = [...two, { slug: 'bichon-maltez', fields: {} }]
    // 3 din 3 fișe ale grupului: o listă filtrată ar fi „not-selective", una aleasă manual se publică.
    expect(listAvailability(l, three)).toMatchObject({ available: true, count: 3, total: 3 })
  })
})
