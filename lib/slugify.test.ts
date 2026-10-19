import { describe, it, expect } from 'vitest'
import { slugify } from './slugify'

describe('slugify', () => {
  it('diacritice cu virgula', () => {
    expect(slugify('Rasă de câini: șofer și țară')).toBe('rasa-de-caini-sofer-si-tara')
  })
  it('diacritice cu sedila nu dispar', () => {
    expect(slugify('Caşcaval şi ţară Şerban Ţepeş')).toBe('cascaval-si-tara-serban-tepes')
  })
  it('curata simboluri si spatii multiple', () => {
    expect(slugify('  Câine   &  pisică!  ')).toBe('caine-pisica')
  })
})
