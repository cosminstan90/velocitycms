import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    page: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { GET, POST } from './route'

const post = (b: unknown) =>
  POST(new NextRequest('http://localhost/api/pages', { method: 'POST', body: JSON.stringify(b) }))

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.page.findMany.mockResolvedValue([])
  prisma.page.count.mockResolvedValue(0)
  prisma.page.findFirst.mockResolvedValue(null)
  prisma.page.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 'pg1', ...data }))
})

describe('/api/pages', () => {
  it('GET lists pages for an accessible site', async () => {
    const res = await GET(new NextRequest('http://localhost/api/pages'))
    expect(res.status).toBe(200)
  })
  it('GET 403 without access', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/pages'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site access denied' })
    expect(prisma.page.findMany).not.toHaveBeenCalled()
  })
  it('POST 201 with access', async () => {
    expect((await post({ siteId: 's1', title: 'About' })).status).toBe(201)
    expect(prisma.page.create).toHaveBeenCalled()
  })
  it('POST 403 without access to the body siteId', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect((await post({ siteId: 's2', title: 'About' })).status).toBe(403)
    expect(prisma.page.create).not.toHaveBeenCalled()
  })
})
