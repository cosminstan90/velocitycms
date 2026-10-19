import { describe, it, expect } from 'vitest'
import {
  buildNavTree, toGroupPost,
  type CategoryRow, type RecentPostRow,
} from './navigation-tree'

const row = (p: Partial<CategoryRow>): CategoryRow => ({
  id: 'x', name: 'X', slug: 'x', parentId: null, sortOrder: 0, showInNav: true, postCount: 1, ...p,
})

describe('buildNavTree', () => {
  it('returneaza grupuri radacina sortate dupa sortOrder', () => {
    const tree = buildNavTree([
      row({ id: 'b', name: 'Pisici', slug: 'pisici', sortOrder: 20 }),
      row({ id: 'a', name: 'Câini', slug: 'caini', sortOrder: 10 }),
    ])
    expect(tree.map((g) => g.slug)).toEqual(['caini', 'pisici'])
  })

  it('sorteaza alfabetic la sortOrder egal', () => {
    const tree = buildNavTree([
      row({ id: 'b', name: 'Pisici', slug: 'pisici', sortOrder: 0 }),
      row({ id: 'a', name: 'Câini', slug: 'caini', sortOrder: 0 }),
    ])
    expect(tree.map((g) => g.slug)).toEqual(['caini', 'pisici'])
  })

  it('cuibareste copiii sub parinte si construieste href-ul complet', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini' }),
      row({ id: 'a1', name: 'Rase', slug: 'rase', parentId: 'a', sortOrder: 10 }),
    ])
    expect(tree[0].href).toBe('/caini')
    expect(tree[0].children).toHaveLength(1)
    expect(tree[0].children[0].href).toBe('/caini/rase')
  })

  it('exclude grupurile cu showInNav fals', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini' }),
      row({ id: 'b', name: 'Ascuns', slug: 'ascuns', showInNav: false }),
    ])
    expect(tree.map((g) => g.slug)).toEqual(['caini'])
  })

  it('exclude copiii cu showInNav fals', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini' }),
      row({ id: 'a1', name: 'Rase', slug: 'rase', parentId: 'a' }),
      row({ id: 'a2', name: 'Ascuns', slug: 'ascuns', parentId: 'a', showInNav: false }),
    ])
    expect(tree[0].children.map((c) => c.slug)).toEqual(['rase'])
  })

  it('ascunde grupul fara articole si fara subcategorii vizibile', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini', postCount: 0 }),
      row({ id: 'b', name: 'Pisici', slug: 'pisici', postCount: 0 }),
      row({ id: 'b1', name: 'Rase', slug: 'rase', parentId: 'b', postCount: 0 }),
    ])
    expect(tree).toEqual([])
  })

  it('pastreaza grupul cu articole proprii si fara copii vizibili', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini', postCount: 3 }),
      row({ id: 'a1', name: 'Rase', slug: 'rase', parentId: 'a', postCount: 0 }),
    ])
    expect(tree.map((g) => g.slug)).toEqual(['caini'])
    expect(tree[0].children).toEqual([])
  })

  it('pastreaza grupul gol daca o subcategorie are articole', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini', postCount: 0 }),
      row({ id: 'a1', name: 'Rase', slug: 'rase', parentId: 'a', postCount: 2 }),
    ])
    expect(tree.map((g) => g.slug)).toEqual(['caini'])
    expect(tree[0].children.map((c) => c.slug)).toEqual(['rase'])
  })

  it('ascunde subcategoria fara articole', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini', postCount: 1 }),
      row({ id: 'a1', name: 'Rase', slug: 'rase', parentId: 'a', postCount: 2 }),
      row({ id: 'a2', name: 'Goala', slug: 'goala', parentId: 'a', postCount: 0 }),
    ])
    expect(tree[0].children.map((c) => c.slug)).toEqual(['rase'])
  })

  it('showInNav fals ramane ascuns chiar daca are articole', () => {
    const tree = buildNavTree([
      row({ id: 'a', name: 'Câini', slug: 'caini', postCount: 5, showInNav: false }),
      row({ id: 'b', name: 'Pisici', slug: 'pisici' }),
      row({ id: 'b1', name: 'Rase', slug: 'rase', parentId: 'b', postCount: 5, showInNav: false }),
    ])
    expect(tree.map((g) => g.slug)).toEqual(['pisici'])
    expect(tree[0].children).toEqual([])
  })

  it('ignora copiii al caror parinte lipseste sau e ascuns', () => {
    const tree = buildNavTree([
      row({ id: 'a1', name: 'Orfan', slug: 'orfan', parentId: 'inexistent' }),
      row({ id: 'b', name: 'Ascuns', slug: 'ascuns', showInNav: false }),
      row({ id: 'b1', name: 'Copil', slug: 'copil', parentId: 'b' }),
    ])
    expect(tree).toEqual([])
  })

  it('returneaza lista goala pentru intrare goala', () => {
    expect(buildNavTree([])).toEqual([])
  })
})

describe('toGroupPost', () => {
  it('articol intr-o subcategorie: href pe trei niveluri', () => {
    const row: RecentPostRow = {
      title: 'Labrador Retriever',
      slug: 'labrador-retriever',
      category: { slug: 'rase', parent: { slug: 'caini' } },
    }
    expect(toGroupPost(row)).toEqual({ title: 'Labrador Retriever', href: '/caini/rase/labrador-retriever' })
  })

  it('articol direct in categoria radacina: href pe doua niveluri', () => {
    const row: RecentPostRow = {
      title: 'Cum alegi primul caine',
      slug: 'cum-alegi-primul-caine',
      category: { slug: 'caini', parent: null },
    }
    expect(toGroupPost(row)).toEqual({ title: 'Cum alegi primul caine', href: '/caini/cum-alegi-primul-caine' })
  })

  it('articol fara categorie: /blog', () => {
    const row: RecentPostRow = { title: 'Stire', slug: 'stire', category: null }
    expect(toGroupPost(row)).toEqual({ title: 'Stire', href: '/blog/stire' })
  })
})
