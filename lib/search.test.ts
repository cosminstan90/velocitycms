import { describe, it, expect } from 'vitest'
import {
  foldDiacritics,
  escapeLike,
  toContainsPattern,
  SQL_TRANSLATE_FROM,
  SQL_TRANSLATE_TO,
} from './search'

describe('foldDiacritics', () => {
  it('scoate diacriticele romanesti (virgula si sedila)', () => {
    expect(foldDiacritics('Câini')).toBe('caini')
    expect(foldDiacritics('ăâîșțĂÂÎȘȚ')).toBe('aaistaaist')
    expect(foldDiacritics('şţŞŢ')).toBe('stst')
  })
  it('lasa neatins textul fara diacritice', () => {
    expect(foldDiacritics('labrador retriever')).toBe('labrador retriever')
  })
})

describe('escapeLike / toContainsPattern', () => {
  it('escapeaza metacaracterele LIKE', () => {
    expect(escapeLike('100%_a\\b')).toBe('100\\%\\_a\\\\b')
  })
  it('construieste modelul „contine" normalizat', () => {
    expect(toContainsPattern('Pisică 50%')).toBe('%pisica 50\\%%')
  })
})

describe('lista SQL', () => {
  it('sursa si tinta au aceeasi lungime', () => {
    expect([...SQL_TRANSLATE_FROM].length).toBe([...SQL_TRANSLATE_TO].length)
  })
  it('fiecare caracter sursa se mapeaza la litera lui de baza', () => {
    const from = [...SQL_TRANSLATE_FROM]
    const to = [...SQL_TRANSLATE_TO]
    from.forEach((c, i) => {
      expect(to[i].toLowerCase()).toBe(foldDiacritics(c))
    })
  })
})
