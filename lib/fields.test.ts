import { describe, it, expect } from 'vitest'
import { ratingToPercent, RATING_SCALE, splitFieldValues, iucnLabel } from './fields'

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

const fv = (fieldKey: string, value: string, sortOrder: number, fieldLabel = fieldKey) => ({
  value,
  fieldDefinition: { fieldKey, fieldLabel, sortOrder },
})

describe('splitFieldValues', () => {
  it('lista goala -> structura goala', () => {
    expect(splitFieldValues([])).toEqual({ tldr: null, specs: [], behavior: [], conservation: [] })
  })

  it('extrage tldr cu trim', () => {
    const out = splitFieldValues([fv('tldr', '  Rezumat scurt.  ', 10)])
    expect(out.tldr).toBe('Rezumat scurt.')
    expect(out.specs).toEqual([])
  })

  it('imparte pe blocuri dupa sortOrder', () => {
    const out = splitFieldValues([
      fv('origine', 'Regatul Unit', 100, 'Origine'),
      fv('nivel_energie', 'Ridicat', 200, 'Nivel de energie'),
      fv('statut_conservare', 'LC', 300, 'Statut de conservare'),
    ])
    expect(out.specs.map((f) => f.key)).toEqual(['origine'])
    expect(out.behavior.map((f) => f.key)).toEqual(['nivel_energie'])
    expect(out.conservation.map((f) => f.key)).toEqual(['statut_conservare'])
  })

  it('sorteaza dupa sortOrder in fiecare bloc, indiferent de ordinea de intrare', () => {
    const out = splitFieldValues([
      fv('greutate', '25–36 kg', 120),
      fv('origine', 'Regatul Unit', 100),
      fv('talie', 'Mare', 110),
    ])
    expect(out.specs.map((f) => f.key)).toEqual(['origine', 'talie', 'greutate'])
  })

  it('pastreaza bun_cu_copiii in blocul de comportament', () => {
    const out = splitFieldValues([fv('bun_cu_copiii', 'Da', 240), fv('nivel_energie', 'Ridicat', 200)])
    expect(out.behavior.map((f) => f.key)).toEqual(['nivel_energie', 'bun_cu_copiii'])
  })

  it('omite valorile goale sau doar spatii', () => {
    const out = splitFieldValues([fv('origine', '   ', 100), fv('talie', '', 110), fv('greutate', '3 kg', 120)])
    expect(out.specs.map((f) => f.key)).toEqual(['greutate'])
  })

  it('ignora campurile din afara blocurilor cunoscute', () => {
    const out = splitFieldValues([fv('altceva', 'x', 50), fv('custom', 'y', 400), fv('origine', 'RO', 100)])
    expect(out.specs.map((f) => f.key)).toEqual(['origine'])
    expect(out.behavior).toEqual([])
    expect(out.conservation).toEqual([])
  })

  it('propaga eticheta din definitie si taie valoarea', () => {
    const out = splitFieldValues([fv('inaltime', ' 55–62 cm ', 130, 'Înălțime')])
    expect(out.specs[0]).toEqual({ key: 'inaltime', label: 'Înălțime', value: '55–62 cm' })
  })
})

describe('iucnLabel', () => {
  it('mapeaza codurile IUCN pe etichete romanesti', () => {
    expect(iucnLabel('LC')).toBe('Risc minim')
    expect(iucnLabel('VU')).toBe('Vulnerabil')
    expect(iucnLabel('CR')).toBe('Critic periclitat')
  })

  it('tolereaza spatii si litere mici', () => {
    expect(iucnLabel(' en ')).toBe('Periclitat')
  })

  it('returneaza null pentru cod necunoscut', () => {
    expect(iucnLabel('XX')).toBeNull()
    expect(iucnLabel('')).toBeNull()
  })
})
