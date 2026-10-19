import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    redirect: {
      findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn(), findUnique: vi.fn(),
      create: vi.fn(), update: vi.fn(), delete: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))
vi.mock('@/lib/redis/redirects', () => ({ refreshRedirectsCache: vi.fn(async () => {}) }))

import { refreshRedirectsCache } from '@/lib/redis/redirects'
import { GET, POST } from './route'
import { POST as bulkImport } from './bulk-import/route'
import { PUT, DELETE } from './[id]/route'
import { PUT as toggle } from './[id]/toggle/route'
import { PATCH as hits } from './[id]/hits/route'

const ctx = { params: Promise.resolve({ id: 'r1' }) }
const row = { id: 'r1', siteId: 's1', fromPath: '/a', toPath: '/b', statusCode: 301, isActive: true }
const req = (method: string, body?: unknown) =>
  new NextRequest('http://localhost/api/redirects', { method, body: body === undefined ? undefined : JSON.stringify(body) })

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.redirect.findUnique.mockResolvedValue(row)
  prisma.redirect.update.mockResolvedValue(row)
  prisma.redirect.create.mockResolvedValue(row)
  prisma.redirect.count.mockResolvedValue(0)
  prisma.redirect.aggregate.mockResolvedValue({ _sum: { hits: 0 } })
  prisma.$transaction.mockResolvedValue([[], 0])
})

describe('redirects collection routes', () => {
  it('GET lists with access', async () => {
    expect((await GET(req('GET'))).status).toBe(200)
  })
  it('POST creates with access', async () => {
    const res = await POST(req('POST', { fromPath: '/a', toPath: '/b' }))
    expect(res.status).toBe(201)
    expect(refreshRedirectsCache).toHaveBeenCalledWith('s1')
  })
  it('bulk-import imports with access', async () => {
    const res = await bulkImport(req('POST', { csv: '/a,/b' }))
    expect(res.status).toBe(200)
    expect((await res.json()).imported).toBe(1)
  })
  it('403 on GET, POST and bulk-import without access, and nothing is written', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const g = await GET(req('GET'))
    expect(g.status).toBe(403)
    expect(await g.json()).toEqual({ error: 'Site access denied' })
    expect((await POST(req('POST', { siteId: 's2', fromPath: '/a', toPath: '/b' }))).status).toBe(403)
    expect((await bulkImport(req('POST', { siteId: 's2', csv: '/a,/b' }))).status).toBe(403)
    expect(prisma.redirect.create).not.toHaveBeenCalled()
    expect(refreshRedirectsCache).not.toHaveBeenCalled()
  })
})

describe('redirects [id] routes', () => {
  it('PUT, toggle and DELETE work with access', async () => {
    expect((await PUT(req('PUT', { toPath: '/c' }), ctx)).status).toBe(200)
    expect((await toggle(req('PUT'), ctx)).status).toBe(200)
    expect((await DELETE(req('DELETE'), ctx)).status).toBe(200)
    expect(prisma.redirect.delete).toHaveBeenCalledWith({ where: { id: 'r1' } })
  })
  it('404 and no write for a redirect of an inaccessible site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await PUT(req('PUT', { toPath: '/c' }), ctx)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect((await toggle(req('PUT'), ctx)).status).toBe(404)
    expect((await DELETE(req('DELETE'), ctx)).status).toBe(404)
    expect(prisma.redirect.update).not.toHaveBeenCalled()
    expect(prisma.redirect.delete).not.toHaveBeenCalled()
    expect(refreshRedirectsCache).not.toHaveBeenCalled()
  })
  it('hits counter stays session-less (internal key only)', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await hits(req('PATCH'), ctx)
    expect(res.status).toBe(200)
    expect(prisma.userSiteAccess.findUnique).not.toHaveBeenCalled()
  })
})
