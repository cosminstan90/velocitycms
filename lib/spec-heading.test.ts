import { describe, it, expect } from 'vitest'
import { specHeading } from './spec-heading'

describe('specHeading', () => {
  it('uses the breed wording only for dogs and cats', () => {
    expect(specHeading('caini')).toBe('Caracteristicile rasei')
    expect(specHeading('pisici')).toBe('Caracteristicile rasei')
  })
  it('is neutral for every other group', () => {
    for (const g of ['marine', 'insecte', 'salbatice', null, undefined]) expect(specHeading(g)).toBe('Caracteristici')
  })
})
