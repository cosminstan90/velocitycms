import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prisma } = vi.hoisted(() => ({ prisma: { post: { findMany: vi.fn() }, media: { findMany: vi.fn() } } }))
vi.mock('@/lib/prisma', () => ({ prisma }))

import { getRelatedPosts } from './related-data'

const row = (id: string, tags: string[], over: Record<string, unknown> = {}) => ({
  id,
  title: id,
  slug: id,
  excerpt: null,
  publishedAt: new Date('2025-01-01T00:00:00Z'),
  featuredImageId: null,
  category: { name: 'Rase', slug: 'rase', parent: { name: 'Câini', slug: 'caini' } },
  tags: tags.map((slug) => ({ tag: { slug } })),
  fieldValues: [],
  ...over,
})

const current = { id: 'cur', groupSlug: 'caini', subSlug: 'rase', tagSlugs: ['t1'], fields: {}, publishedAt: null }

beforeEach(() => {
  vi.clearAllMocks()
  prisma.media.findMany.mockResolvedValue([])
})

describe('getRelatedPosts', () => {
  it('returns the best-scoring posts in the shape the article page expects', async () => {
    prisma.post.findMany.mockResolvedValue([row('weak', []), row('strong', ['t1'])])
    const out = await getRelatedPosts('s1', current)
    expect(out.map((p) => p.id)).toEqual(['strong', 'weak'])
    expect(out[0]).toMatchObject({ author: null, featuredImage: null, category: { slug: 'rase', parent: { slug: 'caini' } } })
  })

  it('queries only published, indexable posts of the site, excluding the current one and comparisons', async () => {
    prisma.post.findMany.mockResolvedValue([])
    await getRelatedPosts('s1', current)
    const where = prisma.post.findMany.mock.calls[0][0].where
    expect(where).toMatchObject({
      siteId: 's1',
      status: 'PUBLISHED',
      noIndex: false,
      id: { not: 'cur' },
      NOT: { category: { slug: 'comparatie', parentId: null } },
    })
  })

  it('drops posts with no relation at all and respects the limit', async () => {
    const unrelated = row('x', [], { category: { name: 'Marine', slug: 'marine', parent: null } })
    prisma.post.findMany.mockResolvedValue([unrelated, ...Array.from({ length: 10 }, (_, i) => row(`p${i}`, ['t1']))])
    const out = await getRelatedPosts('s1', current, 4)
    expect(out).toHaveLength(4)
    expect(out.some((p) => p.id === 'x')).toBe(false)
  })

  it('attaches featured images found in the media table', async () => {
    prisma.post.findMany.mockResolvedValue([row('a', ['t1'], { featuredImageId: 'm1' })])
    prisma.media.findMany.mockResolvedValue([{ id: 'm1', url: '/media/a.webp', altText: 'alt' }])
    expect((await getRelatedPosts('s1', current))[0].featuredImage).toEqual({ url: '/media/a.webp', altText: 'alt' })
  })

  it('never throws', async () => {
    prisma.post.findMany.mockRejectedValue(new Error('db down'))
    expect(await getRelatedPosts('s1', current)).toEqual([])
  })
})
