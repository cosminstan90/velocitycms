import { describe, it, expect } from 'vitest'
import { buildComparisonRows, differingRows } from './comparison'
import type { SplitFields } from './fields'

const fields = (over: Partial<SplitFields>): SplitFields => ({
  tldr: null,
  specs: [],
  behavior: [],
  conservation: [],
  health: [],
  ...over,
})
const item = (key: string, label: string, value: string) => ({ key, label, value })

describe('buildComparisonRows', () => {
  const a = fields({
    specs: [item('talie', 'Talie', 'Mare'), item('greutate', 'Greutate', '25–36 kg')],
    behavior: [item('nivel_energie', 'Nivel de energie', 'Ridicat')],
  })
  const b = fields({
    specs: [item('talie', 'Talie', 'mare'), item('greutate', 'Greutate', '27–36 kg'), item('origine', 'Origine', 'Scoția')],
    behavior: [item('nivel_energie', 'Nivel de energie', 'Mediu')],
  })

  it('merges by key, A first then B-only, specs before behavior', () => {
    expect(buildComparisonRows(a, b).map((r) => r.key)).toEqual(['talie', 'greutate', 'origine', 'nivel_energie'])
  })

  it('marks equal values (case/diacritics-insensitive) as same', () => {
    const rows = buildComparisonRows(a, b)
    expect(rows.find((r) => r.key === 'talie')?.same).toBe(true)
    expect(rows.find((r) => r.key === 'greutate')?.same).toBe(false)
  })

  it('keeps null for a value missing on one side and never marks it same', () => {
    const origine = buildComparisonRows(a, b).find((r) => r.key === 'origine')!
    expect(origine.a).toBeNull()
    expect(origine.b).toBe('Scoția')
    expect(origine.same).toBe(false)
  })

  it('returns an empty list when neither has fields', () => {
    expect(buildComparisonRows(fields({}), fields({}))).toEqual([])
  })
})

describe('differingRows', () => {
  it('keeps only rows that differ or are missing on one side', () => {
    const rows = buildComparisonRows(
      fields({ specs: [item('talie', 'Talie', 'Mare'), item('greutate', 'Greutate', '30 kg')] }),
      fields({ specs: [item('talie', 'Talie', 'Mare'), item('greutate', 'Greutate', '10 kg')] }),
    )
    expect(differingRows(rows).map((r) => r.key)).toEqual(['greutate'])
  })
})
