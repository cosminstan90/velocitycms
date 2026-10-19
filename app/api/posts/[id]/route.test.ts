import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    post: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    category: { findFirst: vi.fn(), findUnique: vi.fn() },
    tag: { count: vi.fn() },
    media: { findFirst: vi.fn() },
    seoSettings: { findFirst: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/navigation', () => ({ revalidateNavigation: vi.fn(), NAVIGATION_TAG: 'navigation' }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))

import { revalidateNavigation } from '@/lib/navigation'
import { GET, PUT, DELETE } from './route'

const ctx = { params: Promise.resolve({ id: 'p1' }) }
const existing = {
  id: 'p1', siteId: 's1', title: 'T', slug: 't', status: 'DRAFT',
  contentJson: {}, contentHtml: '', revisions: [], metaTitle: null, metaDescription: null,
}
const put = (b: unknown) =>
  PUT(new NextRequest('http://localhost/api/posts/p1', { method: 'PUT', body: JSON.stringify(b) }), ctx)
const del = () => DELETE(new NextRequest('http://localhost/api/posts/p1', { method: 'DELETE' }), ctx)

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.post.findUnique.mockResolvedValue(existing)
  prisma.post.findFirst.mockResolvedValue(null)
  prisma.post.update.mockResolvedValue({ ...existing, author: null, category: null, tags: [] })
  prisma.category.findFirst.mockResolvedValue({ id: 'c1' })
  prisma.tag.count.mockResolvedValue(1)
  prisma.media.findFirst.mockResolvedValue({ id: 'm1' })
  prisma.seoSettings.findFirst.mockResolvedValue(null)
})

describe('/api/posts/[id] with access', () => {
  it('GET returns the post', async () => {
    const res = await GET(new NextRequest('http://localhost/api/posts/p1'), ctx)
    expect(res.status).toBe(200)
  })
  it('PUT updates the post', async () => {
    const res = await put({ title: 'New', categoryId: 'c1', tagIds: ['t1'], featuredImageId: 'm1' })
    expect(res.status).toBe(200)
    expect(prisma.post.update).toHaveBeenCalled()
    expect(revalidateNavigation).toHaveBeenCalledTimes(1)
  })
  it('PUT 400 Invalid categoryId for a category of another site (no update)', async () => {
    prisma.category.findFirst.mockResolvedValue(null)
    const res = await put({ categoryId: 'foreign' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid categoryId' })
    expect(prisma.category.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'foreign', siteId: 's1' } }))
    expect(prisma.post.update).not.toHaveBeenCalled()
  })
  it('PUT 400 Invalid tagIds when a tag belongs to another site', async () => {
    prisma.tag.count.mockResolvedValue(0)
    const res = await put({ tagIds: ['foreign'] })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid tagIds' })
    expect(prisma.post.update).not.toHaveBeenCalled()
  })
  it('PUT 400 Invalid featuredImageId for media of another site', async () => {
    prisma.media.findFirst.mockResolvedValue(null)
    const res = await put({ featuredImageId: 'foreign' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid featuredImageId' })
    expect(prisma.post.update).not.toHaveBeenCalled()
  })
  it('PUT 400 Invalid ogImageId for media of another site', async () => {
    prisma.media.findFirst.mockResolvedValue(null)
    const res = await put({ ogImageId: 'foreign' })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid ogImageId' })
    expect(prisma.post.update).not.toHaveBeenCalled()
  })
  it.each([['a string', 'abc'], ['an object', { length: 1 }], ['null', null]])('PUT 400 Invalid tagIds when tagIds is %s (not a 500)', async (_n, tagIds) => {
    const res = await put({ tagIds })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Invalid tagIds' })
    expect(prisma.post.update).not.toHaveBeenCalled()
  })
  it('PUT allows clearing relations with null', async () => {
    const res = await put({ categoryId: null, featuredImageId: null, tagIds: [] })
    expect(res.status).toBe(200)
    expect(prisma.category.findFirst).not.toHaveBeenCalled()
    expect(prisma.media.findFirst).not.toHaveBeenCalled()
  })
  it('DELETE removes a draft post', async () => {
    expect((await del()).status).toBe(200)
    expect(prisma.post.delete).toHaveBeenCalledWith({ where: { id: 'p1' } })
  })
})

describe('/api/posts/[id] site access', () => {
  beforeEach(() => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
  })
  it('404 on GET for a post of an inaccessible site', async () => {
    const res = await GET(new NextRequest('http://localhost/api/posts/p1'), ctx)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(prisma.userSiteAccess.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_siteId: { userId: 'u1', siteId: 's1' } } }),
    )
  })
  it('404 on PUT and no update', async () => {
    expect((await put({ title: 'x' })).status).toBe(404)
    expect(prisma.post.update).not.toHaveBeenCalled()
  })
  it('404 on DELETE and no delete', async () => {
    expect((await del()).status).toBe(404)
    expect(prisma.post.delete).not.toHaveBeenCalled()
  })
})
