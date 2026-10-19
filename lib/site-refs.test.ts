import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    category: { findFirst: vi.fn() },
    tag: { count: vi.fn() },
    media: { findFirst: vi.fn() },
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma }))

import { findInvalidSiteRef } from './site-refs'

beforeEach(() => {
  vi.clearAllMocks()
  prisma.category.findFirst.mockResolvedValue({ id: 'c1' })
  prisma.tag.count.mockResolvedValue(0)
  prisma.media.findFirst.mockResolvedValue({ id: 'm1' })
})

describe('findInvalidSiteRef', () => {
  it('returns null and queries nothing when refs are absent, null or empty', async () => {
    expect(await findInvalidSiteRef('s1', {})).toBeNull()
    expect(await findInvalidSiteRef('s1', { categoryId: null, tagIds: [], featuredImageId: null, ogImageId: '' })).toBeNull()
    expect(prisma.category.findFirst).not.toHaveBeenCalled()
    expect(prisma.tag.count).not.toHaveBeenCalled()
    expect(prisma.media.findFirst).not.toHaveBeenCalled()
  })
  it('scopes every lookup to the site', async () => {
    prisma.tag.count.mockResolvedValue(1)
    expect(await findInvalidSiteRef('s1', { categoryId: 'c1', tagIds: ['t1'], featuredImageId: 'm1', ogImageId: 'm2' })).toBeNull()
    expect(prisma.category.findFirst).toHaveBeenCalledWith({ where: { id: 'c1', siteId: 's1' }, select: { id: true } })
    expect(prisma.tag.count).toHaveBeenCalledWith({ where: { id: { in: ['t1'] }, siteId: 's1' } })
    expect(prisma.media.findFirst).toHaveBeenCalledTimes(2)
  })
  it('dedupes tag ids before comparing counts', async () => {
    prisma.tag.count.mockResolvedValue(2)
    expect(await findInvalidSiteRef('s1', { tagIds: ['t1', 't2', 't1'] })).toBeNull()
    expect(prisma.tag.count).toHaveBeenCalledWith({ where: { id: { in: ['t1', 't2'] }, siteId: 's1' } })
  })
  it('flags a tag of another site and a nonexistent tag the same way', async () => {
    prisma.tag.count.mockResolvedValue(1)
    expect(await findInvalidSiteRef('s1', { tagIds: ['t1', 'foreign'] })).toBe('tagIds')
    expect(await findInvalidSiteRef('s1', { tagIds: ['t1', 'ghost'] })).toBe('tagIds')
  })
  it('flags a category of another site or nonexistent', async () => {
    prisma.category.findFirst.mockResolvedValue(null)
    expect(await findInvalidSiteRef('s1', { categoryId: 'foreign' })).toBe('categoryId')
    expect(await findInvalidSiteRef('s1', { categoryId: 'ghost' })).toBe('categoryId')
  })
  it('flags featuredImageId and ogImageId independently', async () => {
    prisma.media.findFirst.mockResolvedValueOnce({ id: 'm1' }).mockResolvedValueOnce(null)
    expect(await findInvalidSiteRef('s1', { featuredImageId: 'm1', ogImageId: 'foreign' })).toBe('ogImageId')
    prisma.media.findFirst.mockResolvedValueOnce(null)
    expect(await findInvalidSiteRef('s1', { featuredImageId: 'foreign' })).toBe('featuredImageId')
  })
  it('flags tagIds that is present but not an array', async () => {
    expect(await findInvalidSiteRef('s1', { tagIds: 'abc' })).toBe('tagIds')
    expect(await findInvalidSiteRef('s1', { tagIds: { length: 1 } })).toBe('tagIds')
    expect(prisma.tag.count).not.toHaveBeenCalled()
  })
})
