import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: { post: { findMany: vi.fn() }, media: { findMany: vi.fn() } },
}))
vi.mock('@/lib/prisma', () => ({ prisma }))

import { getListsOverview } from './lists-data'
import { MIN_LIST_ENTRIES } from './lists'

const post = (slug: string, fields: Record<string, string>) => ({
  title: slug,
  slug,
  featuredImageId: null,
  category: { name: 'Rase', slug: 'rase', parent: { slug: 'caini' } },
  fieldValues: Object.entries(fields).map(([fieldKey, value]) => ({ value, fieldDefinition: { fieldKey } })),
})

beforeEach(() => {
  vi.clearAllMocks()
  prisma.media.findMany.mockResolvedValue([])
})

describe('getListsOverview', () => {
  it('computes members and availability from published fiches', async () => {
    const big = Array.from({ length: MIN_LIST_ENTRIES }, (_, i) => post(`mare-${i}`, { talie: 'Mare' }))
    const small = Array.from({ length: 6 }, (_, i) => post(`mic-${i}`, { talie: 'Mic' }))
    prisma.post.findMany.mockResolvedValueOnce([...big, ...small]).mockResolvedValueOnce([])
    const overview = await getListsOverview('s1')
    const mari = overview.find((o) => o.def.slug === 'rase-de-caini-mari')!
    expect(mari.availability.available).toBe(true)
    expect(mari.members).toHaveLength(MIN_LIST_ENTRIES)
    expect(mari.members[0].fieldValues.map((v) => v.fieldDefinition.fieldKey)).toEqual(['talie'])
    const mici = overview.find((o) => o.def.slug === 'rase-de-caini-mici')!
    expect(mici.availability).toMatchObject({ available: false, reason: 'too-few', count: 6 })
  })

  it('queries only published, indexable fiches of the breeds subcategory, scoped to the site', async () => {
    prisma.post.findMany.mockResolvedValue([])
    await getListsOverview('s1')
    const where = prisma.post.findMany.mock.calls[0][0].where
    expect(where).toMatchObject({ siteId: 's1', status: 'PUBLISHED', noIndex: false, category: { slug: 'rase', parent: { slug: 'caini' } } })
  })

  it('returns an empty list without a site or on a database error', async () => {
    expect(await getListsOverview(null)).toEqual([])
    prisma.post.findMany.mockRejectedValue(new Error('db down'))
    expect(await getListsOverview('s1')).toEqual([])
  })
})
