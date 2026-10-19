import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma, fsMock, authMock, importer } = vi.hoisted(() => ({
  prisma: { userSiteAccess: { findUnique: vi.fn() } },
  fsMock: { writeFile: vi.fn(async () => {}), unlink: vi.fn(async () => {}) },
  authMock: vi.fn(),
  importer: {
    parseXML: vi.fn(),
    detectOldDomain: vi.fn(() => 'old.example'),
    importAll: vi.fn(),
  },
}))

vi.mock('@/auth', () => ({ auth: authMock }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async (r: NextRequest) => r.nextUrl.searchParams.get('siteId')) }))
vi.mock('fs/promises', () => ({ default: fsMock, ...fsMock }))
vi.mock('@/lib/import/wordpress-importer', () => ({
  WordPressImporter: vi.fn(function () {
    return importer
  }),
}))

import { POST } from './route'
import { WordPressImporter } from '@/lib/import/wordpress-importer'

function request(url = 'http://localhost/api/import/wordpress?siteId=s1') {
  const fd = new FormData()
  fd.set('file', new File(['<rss/>'], 'export.xml', { type: 'text/xml' }))
  fd.set('parseOnly', 'true')
  const req = new NextRequest(url, { method: 'POST', body: fd })
  const spy = vi.spyOn(req, 'formData')
  return { req, spy }
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.mockResolvedValue({ user: { id: 'u1', activeSiteId: 's1' } })
  prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'ADMIN' })
  importer.parseXML.mockResolvedValue({ rss: { channel: { item: [{ 'wp:post_type': 'post' }, { 'wp:post_type': 'page' }] } } })
})

describe('POST /api/import/wordpress', () => {
  it('401 without a session, nothing read or written', async () => {
    authMock.mockResolvedValue(null)
    const { req, spy } = request()
    expect((await POST(req)).status).toBe(401)
    expect(spy).not.toHaveBeenCalled()
    expect(fsMock.writeFile).not.toHaveBeenCalled()
    expect(WordPressImporter).not.toHaveBeenCalled()
  })
  it('403 for a non-admin role, before the body is read or any file is written', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'EDITOR' })
    const { req, spy } = request()
    const res = await POST(req)
    expect(res.status).toBe(403)
    expect(await res.text()).toBe('Site admin required')
    expect(spy).not.toHaveBeenCalled()
    expect(fsMock.writeFile).not.toHaveBeenCalled()
    expect(WordPressImporter).not.toHaveBeenCalled()
  })
  it('403 when the user has no access row at all', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const { req } = request()
    expect((await POST(req)).status).toBe(403)
    expect(fsMock.writeFile).not.toHaveBeenCalled()
  })
  it('falls back to the session active site when no site is given', async () => {
    const { req } = request('http://localhost/api/import/wordpress')
    expect((await POST(req)).status).toBe(200)
    expect(prisma.userSiteAccess.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_siteId: { userId: 'u1', siteId: 's1' } } }),
    )
  })
  it('site admin can parse an export (parseOnly)', async () => {
    const { req } = request()
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ posts: 1, pages: 1, categories: 0, oldDomain: 'old.example' })
    expect(fsMock.writeFile).toHaveBeenCalledTimes(1)
    expect(fsMock.unlink).toHaveBeenCalledTimes(1)
  })
})
