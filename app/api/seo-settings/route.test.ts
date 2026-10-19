import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    seoSettings: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { GET, PUT } from './route'

const put = (b: unknown) =>
  PUT(new NextRequest('http://localhost/api/seo-settings', { method: 'PUT', body: JSON.stringify(b) }))

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.seoSettings.findUnique.mockResolvedValue({ siteId: 's1' })
  prisma.seoSettings.upsert.mockResolvedValue({ siteId: 's1' })
})

describe('/api/seo-settings', () => {
  it('GET and PUT work with access', async () => {
    expect((await GET(new NextRequest('http://localhost/api/seo-settings'))).status).toBe(200)
    expect((await put({ siteName: 'X' })).status).toBe(200)
    expect(prisma.seoSettings.upsert).toHaveBeenCalled()
  })
  it('403 on GET and PUT without access, no upsert', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/seo-settings'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site access denied' })
    expect((await put({ siteName: 'X' })).status).toBe(403)
    expect(prisma.seoSettings.findUnique).not.toHaveBeenCalled()
    expect(prisma.seoSettings.upsert).not.toHaveBeenCalled()
  })
})
