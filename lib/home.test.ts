import { describe, it, expect } from 'vitest'
import { buildHomeData, shortName, type HomeCategoryRow, type HomePostRow } from './home'
import { buildHomeSchema } from './home-schema'
import { HOME_FAQ } from './home-content'

const cat = (id: string, slug: string, parentId: string | null, sortOrder = 10): HomeCategoryRow => ({ id, name: slug.toUpperCase(), slug, parentId, sortOrder, showInNav: true })
const cats = [cat('c', 'caini', null, 10), cat('cr', 'rase', 'c'), cat('p', 'pisici', null, 20), cat('pr', 'rase', 'p'), cat('g', 'gol', null, 30)]
const post = (slug: string, catId: string, withImg = true, tldr: string | null = 'x'): HomePostRow => {
  const c = cats.find((x) => x.id === catId)!
  const parent = c.parentId ? cats.find((x) => x.id === c.parentId)! : null
  return {
    title: `${slug} - Rasa de test`, slug, publishedAt: '2026-10-23', updatedAt: '2026-10-24',
    image: withImg ? { url: `/m/${slug}.jpg`, alt: slug } : null,
    category: { id: c.id, name: c.name, slug: c.slug, parentId: c.parentId, parent: parent ? { name: parent.name, slug: parent.slug } : null },
    tldr, meta: null,
  }
}

describe('shortName', () => {
  it('taie sufixul descriptiv', () => {
    expect(shortName('Labrador - Rasă de câini')).toBe('Labrador')
    expect(shortName('Beagle')).toBe('Beagle')
  })
})

describe('buildHomeData', () => {
  const posts = [post('a', 'cr'), post('b', 'cr'), post('c', 'pr'), post('d', 'pr'), post('e', 'cr', false)]
  const counts = new Map([['cr', 3], ['pr', 2]])
  const h = buildHomeData(cats, counts, posts)

  it('exclude grupurile fara fise si numara corect', () => {
    expect(h.groups.map((g) => g.slug)).toEqual(['caini', 'pisici'])
    expect(h.groups[0].count).toBe(3)
    expect(h.totalPosts).toBe(5)
  })
  it('subcategoriile au numaratori si href complet', () => {
    expect(h.groups[0].children).toEqual([{ name: 'RASE', href: '/caini/rase', count: 3 }])
  })
  it('recomandatele alterneaza grupurile', () => {
    expect(h.featured.map((p) => p.groupSlug).slice(0, 2)).toEqual(['caini', 'pisici'])
  })
  it('recomandate si mozaic nu contin fise fara imagine', () => {
    expect([...h.featured, ...h.mosaic].every((p) => p.image)).toBe(true)
  })
  it('href-ul fiselor are subcategorie', () => {
    expect(h.latest[0].href).toBe('/caini/rase/a')
  })
  it('fara date nu crapa', () => {
    const e = buildHomeData([], new Map(), [])
    expect(e.groups).toEqual([])
    expect(e.featured).toEqual([])
  })
})

describe('buildHomeSchema', () => {
  const s = buildHomeSchema({ base: 'https://x.ro', siteName: 'X', description: 'd', posts: [{ title: 'T', url: 'https://x.ro/a' }] })
  const types = (s['@graph'] as Array<{ '@type': string }>).map((n) => n['@type'])
  it('contine tipurile asteptate', () => {
    expect(types).toEqual(['Organization', 'WebSite', 'CollectionPage', 'FAQPage'])
  })
  it('FAQPage are aceleasi intrebari ca blocul vizibil', () => {
    const faq = (s['@graph'] as Array<{ '@type': string; mainEntity?: Array<{ name: string }> }>).find((n) => n['@type'] === 'FAQPage')!
    expect(faq.mainEntity!.map((q) => q.name)).toEqual(HOME_FAQ.map((q) => q.question))
  })
})
