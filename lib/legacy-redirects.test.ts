import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    post: { findMany: vi.fn(), findFirst: vi.fn() },
    category: { findFirst: vi.fn() },
  },
}))
vi.mock('@/lib/prisma', () => ({ prisma }))

import { findLegacyRedirect, legacyAliasFor } from './legacy-redirects'

const found = (slug: string, sub: string, group: string) => ({
  slug,
  category: { slug: sub, parent: { slug: group } },
})

beforeEach(() => {
  vi.clearAllMocks()
  prisma.post.findMany.mockResolvedValue([])
  prisma.post.findFirst.mockResolvedValue(null)
  prisma.category.findFirst.mockResolvedValue(null)
})

describe('legacyAliasFor', () => {
  it('maps known old paths, tolerant of trailing slash and case', () => {
    expect(legacyAliasFor('/caini/bichon-frise')).toBe('/caini/rase/bichon-frise-rasa-caini-caracteristici')
    expect(legacyAliasFor('/caini/Caini-Mari/')).toBe('/caini/rase')
  })
  it('returns null for unknown paths', () => {
    expect(legacyAliasFor('/caini/nu-exista')).toBeNull()
    expect(legacyAliasFor('/constructor')).toBeNull()
  })
})

describe('findLegacyRedirect', () => {
  it('redirects to the single matching subcategory post, site-scoped', async () => {
    prisma.post.findMany.mockResolvedValue([found('husky', 'rase', 'caini')])
    expect(await findLegacyRedirect({ siteId: 's1', group: 'caini', slug: 'husky' })).toBe('/caini/rase/husky')
    expect(prisma.post.findMany.mock.calls[0][0].where.siteId).toBe('s1')
  })

  it('does not redirect when several subcategories contain the slug', async () => {
    prisma.post.findMany.mockResolvedValue([found('x', 'rase', 'caini'), found('x', 'sanatate', 'caini')])
    expect(await findLegacyRedirect({ siteId: 's1', group: 'caini', slug: 'x' })).toBeNull()
  })

  it('returns null when nothing matches and no alias', async () => {
    expect(await findLegacyRedirect({ siteId: 's1', group: 'caini', slug: 'nimic' })).toBeNull()
  })

  it('applies an alias only if the target post exists', async () => {
    prisma.post.findFirst.mockResolvedValue({ id: 'p' })
    expect(await findLegacyRedirect({ siteId: 's1', group: 'caini', slug: 'bichon-frise' })).toBe(
      '/caini/rase/bichon-frise-rasa-caini-caracteristici'
    )
    prisma.post.findFirst.mockResolvedValue(null)
    expect(await findLegacyRedirect({ siteId: 's1', group: 'caini', slug: 'bichon-frise' })).toBeNull()
  })

  it('applies a list-page alias when the category exists, else null', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'c' })
    expect(await findLegacyRedirect({ siteId: 's1', group: 'caini', slug: 'caini-mari' })).toBe('/caini/rase')
    prisma.category.findFirst.mockResolvedValue(null)
    expect(await findLegacyRedirect({ siteId: 's1', group: 'caini', slug: 'caini-mari' })).toBeNull()
  })
})
