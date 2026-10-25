import { describe, it, expect } from 'vitest'
import { buildSilo, shortTitle, type SiloCategoryRow, type SiloPostRow } from './silo'
import { CATEGORY_CONTENT } from './category-content'

const cat = (id: string, slug: string, parentId: string | null, sortOrder = 10, name = slug): SiloCategoryRow => ({ id, name, slug, parentId, sortOrder, showInNav: true })
const cats = [
  cat('c', 'caini', null, 10), cat('cr', 'rase', 'c', 10), cat('ci', 'ingrijire', 'c', 20),
  cat('p', 'pisici', null, 20), cat('pr', 'rase', 'p'),
  cat('m', 'marine', null, 30), cat('mm', 'mamifere-marine', 'm'),
  cat('s', 'salbatice', null, 40), cat('sm', 'mamifere', 's'),
  cat('g', 'gol', null, 50),
]
const post = (slug: string, sub: string, root: string, title = slug): SiloPostRow => ({ title, slug, category: { slug: sub, parent: { slug: root } } })
const posts = [post('a', 'rase', 'caini', 'Labrador - Rasa de caini'), post('b', 'rase', 'caini'), post('c', 'ingrijire', 'caini'), post('d', 'rase', 'pisici'), post('e', 'mamifere-marine', 'marine'), post('f', 'mamifere', 'salbatice')]
const counts = new Map([['cr', 2], ['ci', 1], ['pr', 1], ['mm', 1], ['sm', 1]])

describe('shortTitle', () => {
  it('taie sufixul descriptiv', () => expect(shortTitle('Labrador - Rasa de caini')).toBe('Labrador'))
})

describe('buildSilo', () => {
  it('pe grup: toate subcategoriile cu articole, cu cele mai noi', () => {
    const s = buildSilo(cats, counts, posts, 'caini')
    expect(s.subs.map((x) => x.href)).toEqual(['/caini/rase', '/caini/ingrijire'])
    expect(s.subs[0].latest[0]).toEqual({ title: 'Labrador', href: '/caini/rase/a' })
  })
  it('pe subcategorie: doar surorile, nu si ea insasi', () => {
    const s = buildSilo(cats, counts, posts, 'caini', 'rase')
    expect(s.subs.map((x) => x.href)).toEqual(['/caini/ingrijire'])
  })
  it('related declarat apare, fara linkuri catre grupuri goale', () => {
    const s = buildSilo(cats, counts, posts, 'caini')
    expect(s.related.map((r) => r.href)).toEqual(['/pisici', '/salbatice'])
    expect(s.related.every((r) => r.count > 0)).toBe(true)
    expect(s.related.find((r) => r.href === '/pisici')!.subs[0].href).toBe('/pisici/rase')
  })
  it('un grup fara continut definit primeste vecini completati automat', () => {
    const s = buildSilo(cats, counts, posts, 'gol')
    expect(s.related.length).toBeGreaterThan(0)
    expect(s.related.some((r) => r.href === '/gol')).toBe(false)
  })
  it('nu leaga un grup de el insusi', () => {
    for (const group of ['caini', 'pisici', 'marine', 'salbatice']) {
      expect(buildSilo(cats, counts, posts, group).related.some((r) => r.href === `/${group}`)).toBe(false)
    }
  })
})

describe('CATEGORY_CONTENT', () => {
  const entries = Object.entries(CATEGORY_CONTENT)
  it('meta description intre 125 si 160 de caractere', () => {
    for (const [k, c] of entries) expect(c.metaDesc.length, k).toBeGreaterThanOrEqual(125), expect(c.metaDesc.length, k).toBeLessThanOrEqual(160)
  })
  it('metaTitle scurt (sufixul de site se adauga separat)', () => {
    for (const [k, c] of entries) expect(c.metaTitle.length, k).toBeLessThanOrEqual(52)
  })
  it('are introducere de 3 paragrafe, 3 intrebari si cel putin un link catre alta sectiune', () => {
    for (const [k, c] of entries) {
      expect(c.intro.length, k).toBe(3)
      expect(c.faq.length, k).toBeGreaterThanOrEqual(3)
      expect(c.related.length, k).toBeGreaterThanOrEqual(1)
    }
  })
  it('related nu trimite spre propriul grup', () => {
    for (const [k, c] of entries) for (const r of c.related) expect(k.split('/')[0], k).not.toBe(r.group)
  })
})
