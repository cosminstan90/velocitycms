import { describe, it, expect } from 'vitest'
import { categoryLastModified } from './sitemap-categories'

const cat = (id: string, parentId: string | null = null) => ({ id, parentId })
const stat = (categoryId: string, iso: string) => ({ categoryId, maxUpdatedAt: new Date(iso) })

describe('categoryLastModified', () => {
  it('o categorie cu articole apare cu cea mai recenta data a articolelor ei', () => {
    const out = categoryLastModified([cat('a')], [stat('a', '2026-10-01T00:00:00Z')])
    expect(out.get('a')).toEqual(new Date('2026-10-01T00:00:00Z'))
  })

  it('o categorie fara articole nu apare', () => {
    const out = categoryLastModified([cat('a'), cat('b')], [stat('a', '2026-10-01T00:00:00Z')])
    expect(out.has('b')).toBe(false)
  })

  it('un grup radacina fara articole proprii apare daca un copil are articole, cu data copilului', () => {
    const out = categoryLastModified(
      [cat('g'), cat('c1', 'g'), cat('c2', 'g')],
      [stat('c1', '2026-09-15T00:00:00Z')],
    )
    expect(out.get('g')).toEqual(new Date('2026-09-15T00:00:00Z'))
    expect(out.has('c2')).toBe(false)
  })

  it('un grup cu articole proprii si ale copiilor ia cea mai mare data', () => {
    const out = categoryLastModified(
      [cat('g'), cat('c1', 'g')],
      [stat('g', '2026-08-01T00:00:00Z'), stat('c1', '2026-10-10T00:00:00Z')],
    )
    expect(out.get('g')).toEqual(new Date('2026-10-10T00:00:00Z'))
  })

  it('data unui copil nu ajunge la un frate si nici in sus pentru alt grup', () => {
    const out = categoryLastModified(
      [cat('g1'), cat('a', 'g1'), cat('g2'), cat('b', 'g2')],
      [stat('a', '2026-10-01T00:00:00Z'), stat('b', '2026-05-01T00:00:00Z')],
    )
    expect(out.get('g1')).toEqual(new Date('2026-10-01T00:00:00Z'))
    expect(out.get('g2')).toEqual(new Date('2026-05-01T00:00:00Z'))
    expect(out.get('a')).toEqual(new Date('2026-10-01T00:00:00Z'))
    expect(out.get('b')).toEqual(new Date('2026-05-01T00:00:00Z'))
  })

  it('un grup fara nicio activitate (nici propria, nici a copiilor) nu apare', () => {
    const out = categoryLastModified([cat('g'), cat('c', 'g')], [])
    expect(out.size).toBe(0)
  })

  it('ignora statistici pentru categorii necunoscute si valori lipsa', () => {
    const out = categoryLastModified([cat('a')], [stat('zzz', '2026-10-01T00:00:00Z'), { categoryId: 'a', maxUpdatedAt: null }])
    expect(out.size).toBe(0)
  })
})
