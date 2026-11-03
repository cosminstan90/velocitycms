import { describe, it, expect } from 'vitest'
import { LEGACY_STATIC_REDIRECTS } from './legacy-static-redirects'

describe('LEGACY_STATIC_REDIRECTS', () => {
  it('has no duplicate sources and no self-redirects', () => {
    const sources = LEGACY_STATIC_REDIRECTS.map((r) => r.source)
    expect(new Set(sources).size).toBe(sources.length)
    for (const r of LEGACY_STATIC_REDIRECTS) expect(r.destination).not.toBe(r.source)
  })

  it('never chains: no destination is itself a redirect source', () => {
    const sources = new Set(LEGACY_STATIC_REDIRECTS.map((r) => r.source))
    for (const r of LEGACY_STATIC_REDIRECTS) expect(sources.has(r.destination)).toBe(false)
  })

  it('covers the Search Console 404 samples', () => {
    const map = new Map(LEGACY_STATIC_REDIRECTS.map((r) => [r.source, r.destination]))
    expect(map.get('/rase/bichon-frise-rasa-caini-caracteristici')).toBe(
      '/caini/rase/bichon-frise-rasa-caini-caracteristici',
    )
    expect(map.get('/eticheta/rase-mici-1')).toBe('/eticheta/rase-mici')
    expect(map.get('/index.php')).toBe('/')
    expect(map.get('/politica-de-confidentialitate')).toBe('/politica-confidentialitate')
  })
})
