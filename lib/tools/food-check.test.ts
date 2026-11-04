import { describe, it, expect } from 'vitest'
import { searchFood, normalizeQuery, FOOD_ENTRIES } from './food-check'

describe('normalizeQuery', () => {
  it('drops diacritics, case and punctuation', () => {
    expect(normalizeQuery('  Ciocolată!  ')).toBe('ciocolata')
    expect(normalizeQuery('Ceapă, USTUROI')).toBe('ceapa usturoi')
  })
})

describe('searchFood', () => {
  it('finds entries ignoring diacritics', () => {
    expect(searchFood('ciocolată', 'caine').map((e) => e.id)).toEqual(['ciocolata'])
    expect(searchFood('stafide', 'caine').map((e) => e.id)).toEqual(['struguri'])
  })

  it('respects the species filter', () => {
    expect(searchFood('ciocolata', 'pisica')).toEqual([])
    expect(searchFood('crin', 'caine')).toEqual([])
    expect(searchFood('crini', 'pisica').map((e) => e.id)).toEqual(['crini'])
    expect(searchFood('ceapa', 'pisica')).toHaveLength(1)
    expect(searchFood('ceapa', 'caine')).toHaveLength(1)
  })

  it('searches both species when none is chosen', () => {
    expect(searchFood('crini', null)).toHaveLength(1)
  })

  it('returns nothing for very short or unknown queries', () => {
    expect(searchFood('ci', null)).toEqual([])
    expect(searchFood('morcov', null)).toEqual([])
  })

  it('never states that something is safe', () => {
    for (const e of FOOD_ENTRIES) expect(e.summary).not.toMatch(/\bsigur\b|\bfără risc\b|\bpoate mânca\b/i)
  })

  it('has a unique id and a slug for every entry', () => {
    expect(new Set(FOOD_ENTRIES.map((e) => e.id)).size).toBe(FOOD_ENTRIES.length)
    for (const e of FOOD_ENTRIES) expect(e.articleSlug).toMatch(/^[a-z0-9-]+$/)
  })
})
