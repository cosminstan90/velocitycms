import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prisma } = vi.hoisted(() => ({ prisma: { post: { count: vi.fn() } } }))
vi.mock('@/lib/prisma', () => ({ prisma }))

import { categoryRobots } from './category-visibility-data'
import { CATEGORY_INDEX_MIN } from './category-visibility'

beforeEach(() => vi.clearAllMocks())

describe('categoryRobots', () => {
  it('noindex,follow below the threshold; nothing (indexable) at or above it', async () => {
    prisma.post.count.mockResolvedValue(CATEGORY_INDEX_MIN - 1)
    expect(await categoryRobots('c1', false)).toEqual({ index: false, follow: true })
    prisma.post.count.mockResolvedValue(CATEGORY_INDEX_MIN)
    expect(await categoryRobots('c1', false)).toBeUndefined()
  })

  it('a group counts its subcategories, a subcategory only itself', async () => {
    prisma.post.count.mockResolvedValue(5)
    await categoryRobots('g1', true)
    expect(prisma.post.count.mock.calls[0][0].where.category).toEqual({ OR: [{ id: 'g1' }, { parentId: 'g1' }] })
    await categoryRobots('s1', false)
    expect(prisma.post.count.mock.calls[1][0].where.category).toEqual({ id: 's1' })
  })

  it('counts only published, indexable posts', async () => {
    prisma.post.count.mockResolvedValue(10)
    await categoryRobots('c1', false)
    expect(prisma.post.count.mock.calls[0][0].where).toMatchObject({ status: 'PUBLISHED', noIndex: false })
  })

  it('stays indexable when the database fails', async () => {
    prisma.post.count.mockRejectedValue(new Error('db down'))
    expect(await categoryRobots('c1', true)).toBeUndefined()
  })
})
