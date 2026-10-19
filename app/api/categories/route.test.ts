import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: { category: { findFirst: vi.fn(), create: vi.fn() } },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))
vi.mock('next/cache', () => ({ revalidateTag: vi.fn() }))

import { POST } from './route'

const post = (b: unknown) =>
  POST(new NextRequest('http://localhost/api/categories', { method: 'POST', body: JSON.stringify(b) }))

beforeEach(() => {
  vi.clearAllMocks()
  prisma.category.findFirst.mockResolvedValue(null)
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
