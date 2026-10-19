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
  ])('returns a null-status entry and never fetches an unsafe path (%s)', async (_n, p) => {
    const res = await call(['/ok', p])
    expect(res.status).toBe(200)
    const { results } = await res.json()
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({ path: '/ok', status: 200 })
    expect(results[1]).toEqual({ path: p, status: null, redirected: false, finalUrl: null })
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual(['https://site.example/ok'])
  })
  it('keeps a path prefix of the site URL', async () => {
    prisma.seoSettings.findUnique.mockResolvedValue({ siteUrl: 'https://site.example/sub/' })
    await call(['/a?x=1'])
    expect(fetchMock.mock.calls.map((c) => String(c[0]))).toEqual(['https://site.example/sub/a?x=1'])
  })
  it('400 when paths is missing or not an array', async () => {
    expect((await call('/a')).status).toBe(400)
  })
})
