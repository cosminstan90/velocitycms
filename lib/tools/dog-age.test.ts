import { describe, it, expect } from 'vitest'
import { dogAgeInHumanYears, toDogYears, DOG_AGE_MIN, DOG_AGE_MAX } from './dog-age'

describe('dogAgeInHumanYears', () => {
  it('matches the published formula 16·ln(age)+31', () => {
    expect(dogAgeInHumanYears(1)?.humanYears).toBe(31)
    expect(dogAgeInHumanYears(4)?.humanYears).toBe(53)
    expect(dogAgeInHumanYears(10)?.humanYears).toBe(68)
    expect(dogAgeInHumanYears(Math.E)?.humanYears).toBe(47)
  })

  it('grows monotonically with age', () => {
    let prev = -Infinity
    for (let a = DOG_AGE_MIN; a <= DOG_AGE_MAX; a += 0.25) {
      const r = dogAgeInHumanYears(a)!.humanYears
      expect(r).toBeGreaterThanOrEqual(prev)
      prev = r
    }
  })

  it('flags ages above the studied range as extrapolated', () => {
    expect(dogAgeInHumanYears(16)?.extrapolated).toBe(false)
    expect(dogAgeInHumanYears(17)?.extrapolated).toBe(true)
  })

  it('rejects out-of-range and non-finite input', () => {
    for (const bad of [0, 0.1, -3, DOG_AGE_MAX + 1, NaN, Infinity]) expect(dogAgeInHumanYears(bad)).toBeNull()
  })
})

describe('toDogYears', () => {
  it('adds months as fractions of a year', () => {
    expect(toDogYears(2, 6)).toBe(2.5)
    expect(toDogYears(0, 3)).toBe(0.25)
  })
})
