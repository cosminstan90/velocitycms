import { describe, it, expect } from 'vitest'
import { buildCollectionSchema } from './collection-schema'

describe('buildCollectionSchema', () => {
  const schema = buildCollectionSchema({
    siteUrl: 'https://divet.ro/',
    siteName: 'DiVet',
    path: '/eticheta/rase-mari',
    name: 'Rase mari',
    description: 'Articole despre rase mari.',
    items: [{ name: 'Beagle', path: '/caini/rase/beagle' }],
  })
  const graph = schema['@graph'] as Record<string, any>[]

  it('builds absolute breadcrumb and item URLs without double slashes', () => {
    const bc = graph.find((n) => n['@type'] === 'BreadcrumbList')!
    expect(bc.itemListElement.map((i: any) => i.item)).toEqual(['https://divet.ro/', 'https://divet.ro/eticheta/rase-mari'])
    const list = graph.find((n) => n['@type'] === 'CollectionPage')!.mainEntity
    expect(list.itemListElement[0].url).toBe('https://divet.ro/caini/rase/beagle')
    expect(list.numberOfItems).toBe(1)
  })

  it('omits mainEntity when there are no items', () => {
    const empty = buildCollectionSchema({ siteUrl: 'https://divet.ro', siteName: 'DiVet', path: '/x', name: 'X', description: 'd', items: [] })
    const page = (empty['@graph'] as Record<string, any>[]).find((n) => n['@type'] === 'CollectionPage')!
    expect(page.mainEntity).toBeUndefined()
  })
})
