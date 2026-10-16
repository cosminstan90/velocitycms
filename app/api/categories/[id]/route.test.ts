import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma, revalidateTag, revalidatePath } = vi.hoisted(() => ({
  prisma: {
    category: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
    post: { count: vi.fn() },
  },
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('next/cache', () => ({ revalidatePath, revalidateTag }))

import { PUT, DELETE } from './route'

const ctx = { params: Promise.resolve({ id: 'c1' }) }
const put = (body: unknown) =>
  PUT(new NextRequest('http://localhost/api/categories/c1', { method: 'PUT', body: JSON.stringify(body) }), ctx)
const del = () =>
  DELETE(new NextRequest('http://localhost/api/categories/c1', { method: 'DELETE' }), ctx)

const existing = { id: 'c1', siteId: 's1', slug: 'old', name: 'Old', parentId: 'p1' }

beforeEach(() => {
  vi.clearAllMocks()
  prisma.category.findUnique.mockResolvedValue(existing)
  prisma.category.findFirst.mockResolvedValue(null)
  prisma.category.update.mockImplementation(async ({ data }: any) => ({ ...existing, ...data }))
  prisma.category.count.mockResolvedValue(0)
  prisma.post.count.mockResolvedValue(0)
  prisma.category.delete.mockResolvedValue({})
})

describe('PUT /api/categories/[id]', () => {
  it('409 when renaming to a slug existing at the same parent level', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'other' })
    const res = await put({ slug: 'taken' })
    expect(res.status).toBe(409)
    expect(prisma.category.findFirst).toHaveBeenCalledWith({
      where: { siteId: 's1', slug: 'taken', parentId: 'p1', id: { not: 'c1' } },
    })
  })

  it('409 when moving (slug unchanged) under a parent with a same-slug sibling', async () => {
    prisma.category.findFirst.mockResolvedValue({ id: 'other' })
    const res = await put({ parentId: 'p2' })
    expect(res.status).toBe(409)
    expect(prisma.category.update).not.toHaveBeenCalled()
  })

  it('200 when moving under a parent with no sibling conflict', async () => {
    const res = await put({ parentId: 'p2' })
    expect(res.status).toBe(200)
    expect(prisma.category.update).toHaveBeenCalled()
    expect(prisma.category.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ parentId: 'p2', slug: 'old' }) }),
    )
  })

  it('no conflict query when only name/description change', async () => {
    const res = await put({ description: 'new desc' })
    expect(res.status).toBe(200)
    expect(prisma.category.findFirst).not.toHaveBeenCalled()
  })

  it('normalises parentId "" to null', async () => {
    await put({ parentId: '' })
    expect(prisma.category.update.mock.calls[0][0].data.parentId).toBeNull()
  })

  it('invalidates the navigation tag after success', async () => {
    await put({ description: 'x' })
    expect(revalidateTag).toHaveBeenCalledWith('navigation', { expire: 0 })
  })
})

describe('DELETE /api/categories/[id]', () => {
  it('409 when the category has children, and does not delete', async () => {
    prisma.category.count.mockResolvedValue(2)
    const res = await del()
    expect(res.status).toBe(409)
    expect(prisma.category.count).toHaveBeenCalledWith({ where: { parentId: 'c1' } })
    expect(prisma.category.delete).not.toHaveBeenCalled()
  })

  it('deletes a leaf and invalidates navigation', async () => {
    const res = await del()
    expect(res.status).toBe(200)
    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'c1' } })
    expect(revalidateTag).toHaveBeenCalledWith('navigation', { expire: 0 })
  })
})
