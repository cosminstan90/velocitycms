import { describe, it, expect } from 'vitest'
import { buildPostPath, buildCanonicalUrl } from './canonical-builder'

describe('buildPostPath', () => {
  it('fara categorie: /blog/{slug}', () => {
    expect(buildPostPath({ slug: 'labrador' })).toBe('/blog/labrador')
  })

  it('categorie radacina: /{cat}/{slug}', () => {
    expect(buildPostPath({ slug: 'labrador' }, { slug: 'caini' })).toBe('/caini/labrador')
  })

  it('subcategorie: /{parinte}/{cat}/{slug}', () => {
    expect(buildPostPath({ slug: 'labrador' }, { slug: 'rase', parent: { slug: 'caini' } })).toBe(
      '/caini/rase/labrador',
    )
  })

  it('parent null inseamna radacina', () => {
    expect(buildPostPath({ slug: 'labrador' }, { slug: 'caini', parent: null })).toBe('/caini/labrador')
  })
})

describe('buildCanonicalUrl (regresie dupa refactor)', () => {
  it('foloseste canonicalUrl cand exista', () => {
    expect(
      buildCanonicalUrl({ slug: 'x', canonicalUrl: 'https://alt.ro/x' }, { siteUrl: 'https://divet.ro' }),
    ).toBe('https://alt.ro/x')
  })

  it('URL absolut pe trei niveluri si taie slash-ul final din siteUrl', () => {
    expect(
      buildCanonicalUrl(
        { slug: 'labrador' },
        { siteUrl: 'https://divet.ro/' },
        { slug: 'rase', parent: { slug: 'caini' } },
      ),
    ).toBe('https://divet.ro/caini/rase/labrador')
  })
})
