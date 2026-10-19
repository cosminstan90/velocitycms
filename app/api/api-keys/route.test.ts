import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    aPIKey: { findMany: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { GET, POST } from './route'

const post = (b: unknown) =>
  POST(new NextRequest('http://localhost/api/api-keys', { method: 'POST', body: JSON.stringify(b) }))

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'ADMIN' })
  prisma.aPIKey.findMany.mockResolvedValue([])
  prisma.aPIKey.create.mockResolvedValue({
    id: 'k1',
    name: 'n',
    description: null,
    keyPrefix: 'sk-12345678',
    createdAt: new Date(),
  })
})

describe('api-keys', () => {
  it('GET 403 for a non-admin site member, no query', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'EDITOR' })
    const res = await GET(new NextRequest('http://localhost/api/api-keys'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site admin required' })
    expect(prisma.aPIKey.findMany).not.toHaveBeenCalled()
  })
  it('GET 403 without any access row', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect((await GET(new NextRequest('http://localhost/api/api-keys'))).status).toBe(403)
  })
  it('GET 200 for a site admin', async () => {
    expect((await GET(new NextRequest('http://localhost/api/api-keys'))).status).toBe(200)
    expect(prisma.aPIKey.findMany).toHaveBeenCalled()
  })
  it('POST 403 for a non-admin, nothing created', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'AUTHOR' })
    const res = await post({ name: 'k', scopes: ['*'] })
    expect(res.status).toBe(403)
    expect(prisma.aPIKey.create).not.toHaveBeenCalled()
  })
  it('POST 201 for a site admin, key bound to the resolved site', async () => {
    const res = await post({ name: 'k', scopes: ['posts:read'] })
    expect(res.status).toBe(201)
    expect(prisma.aPIKey.create.mock.calls[0][0].data).toMatchObject({ siteId: 's1', scopes: ['posts:read'] })
    expect(prisma.userSiteAccess.findUnique).toHaveBeenCalledWith({
      where: { userId_siteId: { userId: 'u1', siteId: 's1' } },
      select: { role: true },
    })
  })
})
