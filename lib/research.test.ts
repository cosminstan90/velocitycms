import { describe, it, expect } from 'vitest'
import {
  alphabetExpansion,
  buildKeywordRows,
  classifyKeyword,
  csvField,
  defaultQueries,
  normalizeKeyword,
  toCsv,
} from './research'

describe('normalizeKeyword', () => {
  it('drops diacritics, case and punctuation', () => {
    expect(normalizeKeyword('  Câine, ȘI Pisică! ')).toBe('caine si pisica')
  })
})

describe('classifyKeyword', () => {
  const cases: Array<[string, string]> = [
    ['labrador vs golden retriever', 'comparison'],
    ['husky vs malamut', 'comparison'],
    ['rase de câini mici', 'list'],
    ['rase de caini pentru apartament', 'list'],
    ['cele mai mari animale din lume', 'list'],
    ['cel mai inteligent caine', 'informational'],
    ['balena albastră cât trăiește', 'short-answer'],
    ['urs polar unde trăiește', 'short-answer'],
    ['parvoviroza la câini simptome', 'health'],
    ['căpușe câine tratament', 'health'],
    ['labrador pret pui', 'commercial'],
    ['maine coon de vanzare', 'commercial'],
    ['caracatita pescobar carrefour', 'noise'],
    ['licurici impex srl', 'noise'],
    ['animale marine poze', 'noise'],
    ['beagle', 'informational'],
  ]
  for (const [k, expected] of cases) {
    it(`"${k}" -> ${expected}`, () => expect(classifyKeyword(k)).toBe(expected))
  }
})

describe('buildKeywordRows', () => {
  const rows = buildKeywordRows([
    { seed: 'labrador', suggestions: ['labrador', 'Labrador vs Golden', 'labrador vs golden', 'labrador pret pui', 'labrador sau golden retriever', 'ab'] },
    { seed: 'husky', suggestions: ['husky vs malamut', 'labrador vs golden', '123'] },
  ])
  const by = (k: string) => rows.find((r) => r.keyword === k)

  it('deduplicates by normalized key across seeds and drops the seed itself, tiny and non-letter keys', () => {
    expect(rows.map((r) => r.keyword)).toEqual(['Labrador vs Golden', 'labrador pret pui', 'labrador sau golden retriever', 'husky vs malamut'])
  })

  it('keeps served intents in the backlog and marks the rest with the reason', () => {
    expect(by('Labrador vs Golden')).toMatchObject({ intent: 'comparison', dropReason: '' })
    expect(by('labrador pret pui')).toMatchObject({ intent: 'commercial', dropReason: 'commercial' })
  })

  it('flags "sau" comparisons for manual check but not "vs"', () => {
    expect(by('labrador sau golden retriever')?.dropReason).toContain('manual')
    expect(by('husky vs malamut')?.dropReason).toBe('')
  })
})

describe('csv helpers', () => {
  it('quotes fields with commas, quotes and newlines', () => {
    expect(csvField('simplu')).toBe('simplu')
    expect(csvField('a,b')).toBe('"a,b"')
    expect(csvField('a "b"')).toBe('"a ""b"""')
    expect(csvField('a\nb')).toBe('"a\nb"')
  })
  it('renders header and rows with a trailing newline', () => {
    expect(toCsv(['x', 'y'], [['1', 'a,b']])).toBe('x,y\n1,"a,b"\n')
  })
})

describe('seeds', () => {
  it('builds the default queries and the a-z expansion', () => {
    const q = defaultQueries()
    expect(q.length).toBeGreaterThan(100)
    expect(new Set(q).size).toBe(q.length)
    expect(q).toContain('labrador cat traieste')
    expect(alphabetExpansion('beagle')).toHaveLength(26)
    expect(alphabetExpansion('beagle')[0]).toBe('beagle a')
  })
})
