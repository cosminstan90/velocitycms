import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    category: { findFirst: vi.fn(), findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

import { GET, POST } from './route'

const post = (b: unknown) =>
  POST(new NextRequest('http://localhost/api/categories', { method: 'POST', body: JSON.stringify(b) }))

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.category.findFirst.mockResolvedValue(null)
  prisma.category.findUnique.mockResolvedValue({ id: 'p1', siteId: 's1' })
  prisma.category.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 'c1', ...data }))
})

describe('POST /api/categories reserved slug', () => {
  it('400 for a root category with the reserved slug', async () => {
    expect((await post({ name: 'Director' })).status).toBe(400)
    expect((await post({ name: 'Altceva', slug: 'director' })).status).toBe(400)
    expect(prisma.category.create).not.toHaveBeenCalled()
  })
  it('allows the same slug under a parent', async () => {
    const res = await post({ name: 'Director', parentId: 'p1' })
    expect(res.status).toBe(201)
    expect(prisma.category.create).toHaveBeenCalled()
  })
  it('allows other root slugs', async () => {
    expect((await post({ name: 'Sanatate' })).status).toBe(201)
  })
})

describe('site access and parent', () => {
  it('403 on POST without access to the site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect((await post({ name: 'Sanatate' })).status).toBe(403)
    expect(prisma.category.create).not.toHaveBeenCalled()
  })
  it('403 on GET without access to the site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect((await GET(new NextRequest('http://localhost/api/categories'))).status).toBe(403)
    expect(prisma.category.findMany).not.toHaveBeenCalled()
  })
  it('400 when the parent belongs to another site', async () => {
    prisma.category.findUnique.mockResolvedValue({ id: 'p1', siteId: 's2' })
    const res = await post({ name: 'Sub', parentId: 'p1' })
    expect(res.status).toBe(400)
    expect(prisma.category.create).not.toHaveBeenCalled()
  })
  it('400 when the parent does not exist', async () => {
    prisma.category.findUnique.mockResolvedValue(null)
    expect((await post({ name: 'Sub', parentId: 'nope' })).status).toBe(400)
  })
})
