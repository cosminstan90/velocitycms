import { describe, it, expect } from 'vitest'
import { relatedScore, pickRelated, type RelatedSubject } from './related'

const NOW = new Date('2026-11-04T00:00:00Z')
const OLD = '2025-01-01T00:00:00Z'

const s = (id: string, over: Partial<RelatedSubject> = {}): RelatedSubject & { title: string } => ({
  id,
  title: id,
  groupSlug: 'caini',
  subSlug: 'rase',
  tagSlugs: [],
  fields: {},
  publishedAt: OLD,
  ...over,
})

describe('relatedScore', () => {
  it('is zero for the same article and for unrelated ones', () => {
    expect(relatedScore(s('a'), s('a'), NOW)).toBe(0)
    expect(relatedScore(s('a', { groupSlug: 'marine', subSlug: 'x' }), s('b', { groupSlug: 'insecte', subSlug: 'y' }), NOW)).toBe(0)
  })

  it('weights shared tags most, with a cap', () => {
    const a = s('a', { tagSlugs: ['t1', 't2', 't3', 't4', 't5'], groupSlug: null, subSlug: null })
    const one = s('b', { tagSlugs: ['t1'], groupSlug: null, subSlug: null })
    const many = s('c', { tagSlugs: ['t1', 't2', 't3', 't4', 't5'], groupSlug: null, subSlug: null })
    expect(relatedScore(a, one, NOW)).toBe(3)
    expect(relatedScore(a, many, NOW)).toBe(9)
  })

  it('same subcategory beats same group only', () => {
    const a = s('a')
    expect(relatedScore(a, s('b'), NOW)).toBeGreaterThan(relatedScore(a, s('c', { subSlug: 'ingrijire' }), NOW))
  })

  it('counts equal field values ignoring case and diacritics, capped', () => {
    const a = s('a', { groupSlug: null, subSlug: null, fields: { talie: 'Mare', specie: 'Câini', habitat: 'Pădure', dieta: 'Carnivor' } })
    const b = s('b', { groupSlug: null, subSlug: null, fields: { talie: 'mare', specie: 'Caini', habitat: 'pădure', dieta: 'carnivor' } })
    expect(relatedScore(a, b, NOW)).toBe(3)
  })

  it('adds a small recency bonus only for recent articles', () => {
    const a = s('a', { groupSlug: null, subSlug: null, tagSlugs: ['t'] })
    const recent = s('b', { groupSlug: null, subSlug: null, tagSlugs: ['t'], publishedAt: '2026-10-20T00:00:00Z' })
    const old = s('c', { groupSlug: null, subSlug: null, tagSlugs: ['t'] })
    expect(relatedScore(a, recent, NOW) - relatedScore(a, old, NOW)).toBe(0.5)
  })

  it('is symmetric apart from recency', () => {
    const a = s('a', { tagSlugs: ['t1', 't2'], fields: { talie: 'Mare' } })
    const b = s('b', { tagSlugs: ['t2'], fields: { talie: 'Mare' }, subSlug: 'ingrijire' })
    expect(relatedScore(a, b, NOW)).toBe(relatedScore(b, a, NOW))
  })
})

describe('pickRelated', () => {
  it('orders by score, then recency, then title, and drops zero scores', () => {
    const cur = s('cur', { tagSlugs: ['t1'] })
    const list = [
      s('z-old', { tagSlugs: ['t1'] }),
      s('a-old', { tagSlugs: ['t1'] }),
      s('new', { tagSlugs: ['t1'], publishedAt: '2026-10-30T00:00:00Z' }),
      s('strong', { tagSlugs: ['t1'], fields: {} , subSlug: 'rase' }),
      s('none', { groupSlug: 'marine', subSlug: 'm', tagSlugs: [] }),
    ]
    const out = pickRelated(cur, list, 10, NOW).map((r) => r.item.title)
    expect(out).not.toContain('none')
    expect(out[0]).toBe('new')
    expect(out.indexOf('a-old')).toBeLessThan(out.indexOf('z-old'))
  })

  it('respects the limit and excludes the current article', () => {
    const cur = s('cur')
    const list = Array.from({ length: 10 }, (_, i) => s(`p${i}`))
    list.push(cur)
    const out = pickRelated(cur, list, 4, NOW)
    expect(out).toHaveLength(4)
    expect(out.some((r) => r.item.id === 'cur')).toBe(false)
  })

  it('can relate across groups through shared tags (e.g. breed and health article)', () => {
    const breed = s('lab', { groupSlug: 'caini', subSlug: 'rase', tagSlugs: ['sanatate-caini'] })
    const health = s('parvo', { groupSlug: 'sanatate', subSlug: 'boli', tagSlugs: ['sanatate-caini'] })
    expect(pickRelated(breed, [health], 6, NOW)[0]?.item.id).toBe('parvo')
  })
})
