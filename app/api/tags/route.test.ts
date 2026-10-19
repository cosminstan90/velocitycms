import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    tag: { findMany: vi.fn(), findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), delete: vi.fn() },
    postTag: { count: vi.fn(), deleteMany: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { GET, POST } from './route'
import { DELETE } from './[id]/route'

const ctx = { params: Promise.resolve({ id: 't1' }) }
const del = () => DELETE(new NextRequest('http://localhost/api/tags/t1', { method: 'DELETE' }), ctx)

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.tag.findMany.mockResolvedValue([])
  prisma.tag.findFirst.mockResolvedValue(null)
  prisma.tag.findUnique.mockResolvedValue({ id: 't1', siteId: 's1' })
  prisma.tag.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 't1', ...data }))
  prisma.postTag.count.mockResolvedValue(0)
})

describe('/api/tags', () => {
  it('GET lists tags with access', async () => {
    expect((await GET(new NextRequest('http://localhost/api/tags'))).status).toBe(200)
  })
  it('GET 403 without access', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/tags'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site access denied' })
    expect(prisma.tag.findMany).not.toHaveBeenCalled()
  })
  it('POST 201 with access', async () => {
    const res = await POST(new NextRequest('http://localhost/api/tags', { method: 'POST', body: JSON.stringify({ name: 'Cats' }) }))
    expect(res.status).toBe(201)
  })
  it('POST 403 without access', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await POST(new NextRequest('http://localhost/api/tags', { method: 'POST', body: JSON.stringify({ name: 'Cats' }) }))
    expect(res.status).toBe(403)
    expect(prisma.tag.create).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/tags/[id]', () => {
  it('deletes a tag of an accessible site', async () => {
    expect((await del()).status).toBe(200)
    expect(prisma.tag.delete).toHaveBeenCalledWith({ where: { id: 't1' } })
  })
  it('404 and no delete when the tag belongs to an inaccessible site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await del()
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(prisma.postTag.deleteMany).not.toHaveBeenCalled()
    expect(prisma.tag.delete).not.toHaveBeenCalled()
  })
  it('404 when the tag does not exist', async () => {
    prisma.tag.findUnique.mockResolvedValue(null)
    expect((await del()).status).toBe(404)
    expect(prisma.tag.delete).not.toHaveBeenCalled()
  })
})
