import { describe, it, expect } from 'vitest'
import { ratingToPercent, RATING_SCALE } from './fields'

describe('ratingToPercent', () => {
  it('mapeaza cele cinci trepte pe 20..100', () => {
    expect(ratingToPercent('Foarte scăzut')).toBe(20)
    expect(ratingToPercent('Scăzut')).toBe(40)
    expect(ratingToPercent('Mediu')).toBe(60)
    expect(ratingToPercent('Ridicat')).toBe(80)
    expect(ratingToPercent('Foarte ridicat')).toBe(100)
  })

  it('tolereaza spatii si majuscule', () => {
    expect(ratingToPercent('  mediu  ')).toBe(60)
    expect(ratingToPercent('RIDICAT')).toBe(80)
  })

  it('tolereaza lipsa diacriticelor', () => {
    expect(ratingToPercent('Scazut')).toBe(40)
    expect(ratingToPercent('Foarte scazut')).toBe(20)
  })

  it('returneaza null pentru valori necunoscute', () => {
    expect(ratingToPercent('mare')).toBeNull()
    expect(ratingToPercent('')).toBeNull()
  })

  it('expune scala in ordine', () => {
    expect(RATING_SCALE).toHaveLength(5)
    expect(RATING_SCALE[0]).toBe('Foarte scăzut')
  })
})
