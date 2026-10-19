import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma, authMock } = vi.hoisted(() => ({
  prisma: { userSiteAccess: { findUnique: vi.fn() }, seoSettings: { findUnique: vi.fn() } },
  authMock: vi.fn(),
}))

vi.mock('@/auth', () => ({ auth: authMock }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { POST } from './route'

const call = (paths: unknown) =>
  POST(new NextRequest('http://localhost/api/check-url', { method: 'POST', body: JSON.stringify({ paths }) }))

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'u1', activeSiteId: 's1' } })
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.seoSettings.findUnique.mockResolvedValue({ siteUrl: 'https://site.example/' })
  fetchMock = vi.fn(async (u: URL) => ({ status: 200, redirected: false, url: String(u) }))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('POST /api/check-url', () => {
  it('401 without a session, no fetch', async () => {
    authMock.mockResolvedValue(null)
    expect((await call(['/a'])).status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('403 without access to the site, no fetch', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect((await call(['/a'])).status).toBe(403)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('scopes the settings lookup to the site and checks paths on its origin', async () => {
    const res = await call(['/a', '/b?x=1'])
    expect(res.status).toBe(200)
    expect(prisma.seoSettings.findUnique).toHaveBeenCalledWith({ where: { siteId: 's1' } })
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual(['https://site.example/a', 'https://site.example/b?x=1'])
    expect((await res.json()).results).toHaveLength(2)
  })
  it.each([
    ['protocol-relative //', '//evil.example/x'],
    ['no leading slash', 'evil.example'],
    ['@', '/@evil.example'],
    ['backslash', '/\\evil.example'],
    ['whitespace', '/a b'],
    ['control character', '/a\u0000b'],
    ['newline', '/a\nb'],
    ['non-string', 5],
  ])('400 and no fetch for an unsafe path (%s)', async (_n, p) => {
    const res = await call(['/ok', p])
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('400 when paths is not an array', async () => {
    expect((await call('/a')).status).toBe(400)
  })
})
