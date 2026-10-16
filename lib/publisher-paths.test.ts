import { describe, it, expect } from 'vitest'
import { buildPublicPath, humanizeSlug } from './publisher-paths'

describe('buildPublicPath', () => {
  it('fara categorie merge in /blog', () => {
    expect(buildPublicPath({ postSlug: 'labrador' })).toBe('/blog/labrador')
  })

  it('doar categorie radacina: doua niveluri', () => {
    expect(buildPublicPath({ categorySlug: 'caini', postSlug: 'labrador' })).toBe('/caini/labrador')
  })

  it('categorie si subcategorie: trei niveluri', () => {
    expect(
      buildPublicPath({ categorySlug: 'caini', subCategorySlug: 'rase', postSlug: 'labrador' }),
    ).toBe('/caini/rase/labrador')
  })

  it('ignora subcategoria cand lipseste categoria', () => {
    expect(buildPublicPath({ subCategorySlug: 'rase', postSlug: 'labrador' })).toBe('/blog/labrador')
  })

  it('trateaza null ca lipsa', () => {
    expect(
      buildPublicPath({ categorySlug: 'caini', subCategorySlug: null, postSlug: 'labrador' }),
    ).toBe('/caini/labrador')
  })
})

describe('humanizeSlug', () => {
  it('transforma slug-ul in nume cu majuscule', () => {
    expect(humanizeSlug('caini-de-talie-mare')).toBe('Caini De Talie Mare')
  })

  it('un singur cuvant', () => {
    expect(humanizeSlug('rase')).toBe('Rase')
  })

  it('sir gol', () => {
    expect(humanizeSlug('')).toBe('')
  })
})
