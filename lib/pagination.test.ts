import { describe, it, expect } from 'vitest'
import { parsePageParam, MAX_PAGE } from './pagination'

describe('parsePageParam', () => {
  it('lipsa parametrului -> pagina 1', () => {
    expect(parsePageParam(undefined)).toBe(1)
    expect(parsePageParam(null)).toBe(1)
    expect(parsePageParam('')).toBe(1)
  })

  it('numar valid', () => {
    expect(parsePageParam('1')).toBe(1)
    expect(parsePageParam('2')).toBe(2)
    expect(parsePageParam('37')).toBe(37)
  })

  it('tolereaza spatii si zerouri la inceput', () => {
    expect(parsePageParam(' 3 ')).toBe(3)
    expect(parsePageParam('007')).toBe(7)
  })

  it('text, simboluri sau zecimale -> pagina 1 (nu NaN)', () => {
    expect(parsePageParam('abc')).toBe(1)
    expect(parsePageParam('1.5')).toBe(1)
    expect(parsePageParam('2abc')).toBe(1)
    expect(parsePageParam('NaN')).toBe(1)
    expect(parsePageParam('Infinity')).toBe(1)
    expect(parsePageParam('1e3')).toBe(1)
  })

  it('zero si negative -> pagina 1', () => {
    expect(parsePageParam('0')).toBe(1)
    expect(parsePageParam('-1')).toBe(1)
    expect(parsePageParam('-999')).toBe(1)
  })

  it('valori uriase sunt limitate, ca skip sa ramana in intervalul unui intreg pe 32 de biti', () => {
    expect(parsePageParam('99999999999999999999')).toBe(MAX_PAGE)
    expect(parsePageParam(String(MAX_PAGE + 1))).toBe(MAX_PAGE)
    expect(parsePageParam(String(MAX_PAGE))).toBe(MAX_PAGE)
    expect((MAX_PAGE - 1) * 100).toBeLessThan(2 ** 31 - 1)
  })

  it('parametru repetat (?page=2&page=5) -> primul', () => {
    expect(parsePageParam(['2', '5'])).toBe(2)
    expect(parsePageParam([])).toBe(1)
    expect(parsePageParam(['abc', '3'])).toBe(1)
  })
})
