import { describe, it, expect } from 'vitest'
import {
  generatePostSchema,
  generateCategorySchema,
  type SchemaPost,
  type SchemaCategory,
  type SchemaSite,
} from './schema-generator'
import { extractFaqItems } from '@/lib/faq'

const site: SchemaSite = { siteName: 'DiVet', siteUrl: 'https://divet.ro', defaultOgImage: null }

function makePost(over: Partial<SchemaPost> = {}): SchemaPost {
  return {
    id: 'p1',
    title: 'Titlu',
    slug: 'titlu',
    excerpt: null,
    contentJson: { type: 'doc', content: [] },
    metaTitle: null,
    metaDescription: null,
    publishedAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-02T00:00:00.000Z',
    createdAt: '2026-01-01T00:00:00.000Z',
    author: null,
    featuredImage: null,
    category: null,
    noIndex: false,
    canonicalUrl: null,
    ...over,
  }
}

function makeCategory(over: Partial<SchemaCategory> = {}): SchemaCategory {
  return {
    id: 'c1',
    name: 'Câini',
    slug: 'caini',
    description: null,
    metaTitle: null,
    metaDesc: null,
    ...over,
  }
}

type Node = Record<string, unknown>
function graph(schema: Record<string, unknown>): Node[] {
  return schema['@graph'] as Node[]
}
function crumbs(schema: Record<string, unknown>) {
  const bc = graph(schema).find((n) => n['@type'] === 'BreadcrumbList')!
  return (bc.itemListElement as Node[]).map((i) => ({
    position: i.position,
    name: i.name,
    item: i.item,
  }))
}
function article(schema: Record<string, unknown>): Node {
  return graph(schema).find((n) => n['@type'] === 'Article')!
}

const subPost = () =>
  makePost({
    title: 'Labrador Retriever',
    slug: 'labrador-retriever',
    category: { name: 'Rase de câini', slug: 'rase', parent: { name: 'Câini', slug: 'caini' } },
  })
const rootPost = () =>
  makePost({
    title: 'Cum alegi primul câine',
    slug: 'cum-alegi-primul-caine',
    category: { name: 'Câini', slug: 'caini' },
  })
const noCatPost = () => makePost({ title: 'Fara categorie', slug: 'fara-categorie' })

describe('speakable', () => {
  it('Article are SpeakableSpecification pe titlu si blocul Pe scurt', () => {
    const a = article(generatePostSchema(subPost(), site)) as any
    expect(a.speakable['@type']).toBe('SpeakableSpecification')
    expect(a.speakable.cssSelector).toEqual(['article h1', '[data-speakable="tldr"]'])
  })
})

describe('generatePostSchema URLs', () => {
  it('1. subcategory post breadcrumb', () => {
    expect(crumbs(generatePostSchema(subPost(), site))).toEqual([
      { position: 1, name: 'DiVet', item: 'https://divet.ro' },
      { position: 2, name: 'Câini', item: 'https://divet.ro/caini' },
      { position: 3, name: 'Rase de câini', item: 'https://divet.ro/caini/rase' },
      { position: 4, name: 'Labrador Retriever', item: 'https://divet.ro/caini/rase/labrador-retriever' },
    ])
  })

  it('2. root category post breadcrumb', () => {
    expect(crumbs(generatePostSchema(rootPost(), site))).toEqual([
      { position: 1, name: 'DiVet', item: 'https://divet.ro' },
      { position: 2, name: 'Câini', item: 'https://divet.ro/caini' },
      { position: 3, name: 'Cum alegi primul câine', item: 'https://divet.ro/caini/cum-alegi-primul-caine' },
    ])
  })

  it('3. post without category breadcrumb', () => {
    expect(crumbs(generatePostSchema(noCatPost(), site))).toEqual([
      { position: 1, name: 'DiVet', item: 'https://divet.ro' },
      { position: 2, name: 'Fara categorie', item: 'https://divet.ro/blog/fara-categorie' },
    ])
  })

  it('4. article url equals the full article URL', () => {
    const a = article(generatePostSchema(subPost(), site))
    expect(a.url).toBe('https://divet.ro/caini/rase/labrador-retriever')
    expect(a['@id']).toBe('https://divet.ro/caini/rase/labrador-retriever/#article')
  })

  it('5. no /categorie/ anywhere', () => {
    for (const p of [subPost(), rootPost(), noCatPost()]) {
      expect(JSON.stringify(generatePostSchema(p, site))).not.toContain('/categorie/')
    }
  })

  it('6. canonicalUrl wins for article url and last crumb', () => {
    const schema = generatePostSchema({ ...subPost(), canonicalUrl: 'https://alt.ro/x' }, site)
    expect(article(schema).url).toBe('https://alt.ro/x')
    const c = crumbs(schema)
    expect(c[c.length - 1].item).toBe('https://alt.ro/x')
  })

  it('7. trailing slash in siteUrl does not produce //', () => {
    const s = { ...site, siteUrl: 'https://divet.ro/' }
    expect(JSON.stringify(generatePostSchema(subPost(), s))).not.toContain('.ro//')
    expect(JSON.stringify(generateCategorySchema(makeCategory(), s))).not.toContain('.ro//')
  })

  it('8. FAQPage matches extractFaqItems', () => {
    const contentJson = {
      type: 'doc',
      content: [
        {
          type: 'faqBlock',
          attrs: { items: [{ question: 'A?', answer: 'B.' }, { question: 'C?', answer: 'D.' }] },
        },
      ],
    }
    const schema = generatePostSchema(makePost({ contentJson }), site)
    const faq = graph(schema).find((n) => n['@type'] === 'FAQPage')!
    const names = (faq.mainEntity as Node[]).map((q) => q.name)
    expect(names).toEqual(extractFaqItems(contentJson).map((i) => i.question))
    expect(names).toEqual(['A?', 'C?'])
  })
})

describe('generateCategorySchema URLs', () => {
  it('9. root category', () => {
    const schema = generateCategorySchema(makeCategory(), site)
    const page = graph(schema).find((n) => n['@type'] === 'CollectionPage')!
    expect(page.url).toBe('https://divet.ro/caini')
    expect(page['@id']).toBe('https://divet.ro/caini/#collectionpage')
    expect(crumbs(schema)).toEqual([
      { position: 1, name: 'DiVet', item: 'https://divet.ro' },
      { position: 2, name: 'Câini', item: 'https://divet.ro/caini' },
    ])
  })

  it('10. subcategory', () => {
    const schema = generateCategorySchema(
      makeCategory({ name: 'Rase de câini', slug: 'rase', parent: { name: 'Câini', slug: 'caini' } }),
      site
    )
    const page = graph(schema).find((n) => n['@type'] === 'CollectionPage')!
    expect(page.url).toBe('https://divet.ro/caini/rase')
    expect(crumbs(schema)).toEqual([
      { position: 1, name: 'DiVet', item: 'https://divet.ro' },
      { position: 2, name: 'Câini', item: 'https://divet.ro/caini' },
      { position: 3, name: 'Rase de câini', item: 'https://divet.ro/caini/rase' },
    ])
  })
})
