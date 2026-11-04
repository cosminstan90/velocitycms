import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prisma } = vi.hoisted(() => ({ prisma: { post: { findMany: vi.fn() } } }))
vi.mock('@/lib/prisma', () => ({ prisma }))

import { getComparisonPair, getComparisonsFor } from './comparison-data'

const row = (slug: string, sub = 'rase', group = 'caini') => ({
  id: slug,
  title: slug.toUpperCase(),
  slug,
  excerpt: null,
  featuredImageId: null,
  category: { slug: sub, parent: { slug: group } },
  fieldValues: [],
})

beforeEach(() => vi.clearAllMocks())

describe('getComparisonPair', () => {
  it('returns both posts with their canonical paths', async () => {
    prisma.post.findMany.mockResolvedValue([row('labrador'), row('golden')])
    const pair = await getComparisonPair('s1', 'labrador', 'golden')
    expect(pair?.a.href).toBe('/caini/rase/labrador')
    expect(pair?.b.href).toBe('/caini/rase/golden')
    expect(prisma.post.findMany.mock.calls[0][0].where).toMatchObject({ siteId: 's1', status: 'PUBLISHED' })
  })

  it('refuses the pair when one of the posts is missing or unpublished', async () => {
    prisma.post.findMany.mockResolvedValue([row('labrador')])
    expect(await getComparisonPair('s1', 'labrador', 'golden')).toBeNull()
  })

  it('refuses missing or identical slugs without querying', async () => {
    expect(await getComparisonPair('s1', null, 'golden')).toBeNull()
    expect(await getComparisonPair('s1', 'x', 'x')).toBeNull()
    expect(prisma.post.findMany).not.toHaveBeenCalled()
  })
})

describe('getComparisonsFor', () => {
  it('lists published comparisons that reference the slug', async () => {
    prisma.post.findMany.mockResolvedValue([{ title: 'Labrador vs Golden', slug: 'labrador-vs-golden' }])
    expect(await getComparisonsFor('s1', 'labrador')).toEqual([{ title: 'Labrador vs Golden', href: '/comparatie/labrador-vs-golden' }])
  })

  it('never throws', async () => {
    prisma.post.findMany.mockRejectedValue(new Error('db down'))
    expect(await getComparisonsFor('s1', 'labrador')).toEqual([])
  })
})
