import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    post: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    category: { findFirst: vi.fn() },
    tag: { count: vi.fn() },
    media: { findFirst: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { GET, POST } from './route'

const post = (b: unknown) =>
  POST(new NextRequest('http://localhost/api/posts', { method: 'POST', body: JSON.stringify(b) }))

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.post.findMany.mockResolvedValue([])
  prisma.post.count.mockResolvedValue(0)
  prisma.post.findFirst.mockResolvedValue(null)
  prisma.post.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 'p1', ...data }))
  prisma.category.findFirst.mockResolvedValue({ id: 'c1' })
  prisma.tag.count.mockResolvedValue(2)
  prisma.media.findFirst.mockResolvedValue({ id: 'm1' })
})

describe('GET /api/posts', () => {
  it('lists posts for an accessible site', async () => {
    const res = await GET(new NextRequest('http://localhost/api/posts'))
    expect(res.status).toBe(200)
    expect(prisma.post.findMany.mock.calls[0][0].where.siteId).toBe('s1')
  })
  it('403 when the user has no access to the site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/posts'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site access denied' })
    expect(prisma.post.findMany).not.toHaveBeenCalled()
  })
})

describe('POST /api/posts', () => {
  it('201 on the positive path with related entities of the same site', async () => {
    const res = await post({ siteId: 's1', title: 'Hello', categoryId: 'c1', tagIds: ['t1', 't2'], featuredImageId: 'm1' })
    expect(res.status).toBe(201)
    expect(prisma.category.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'c1', siteId: 's1' } }))
    expect(prisma.tag.count).toHaveBeenCalledWith({ where: { id: { in: ['t1', 't2'] }, siteId: 's1' } })
    expect(prisma.media.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'm1', siteId: 's1' } }))
    expect(prisma.post.create).toHaveBeenCalled()
  })
  it('403 when the user has no access to the body siteId', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await post({ siteId: 's2', title: 'Hello' })
    expect(res.status).toBe(403)
    expect(prisma.userSiteAccess.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_siteId: { userId: 'u1', siteId: 's2' } } }),
    )
    expect(prisma.post.create).not.toHaveBeenCalled()
  })
  it('400 Invalid categoryId for a category of another site', async () => {
    prisma.category.findFirst.mockResolvedValue(null)
    const res = await post({ siteId: 's1', title: 'Hello', categoryId: 'other' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid categoryId' })
    expect(prisma.post.create).not.toHaveBeenCalled()
  })
  it('400 Invalid tagIds when a tag belongs to another site', async () => {
    prisma.tag.count.mockResolvedValue(1)
    const res = await post({ siteId: 's1', title: 'Hello', tagIds: ['t1', 'foreign'] })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid tagIds' })
    expect(prisma.post.create).not.toHaveBeenCalled()
  })
  it('400 Invalid ogImageId for media of another site', async () => {
    prisma.media.findFirst.mockResolvedValue(null)
    const res = await post({ siteId: 's1', title: 'Hello', ogImageId: 'foreign' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid ogImageId' })
    expect(prisma.post.create).not.toHaveBeenCalled()
  })
  it('400 Invalid tagIds when tagIds is not an array', async () => {
    const res = await post({ siteId: 's1', title: 'Hello', tagIds: 'abc' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid tagIds' })
    expect(prisma.post.create).not.toHaveBeenCalled()
  })
  it('400 Invalid featuredImageId for media of another site', async () => {
    prisma.media.findFirst.mockResolvedValue(null)
    const res = await post({ siteId: 's1', title: 'Hello', featuredImageId: 'foreign' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid featuredImageId' })
    expect(prisma.post.create).not.toHaveBeenCalled()
  })
})
