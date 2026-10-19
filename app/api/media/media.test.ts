import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma, fsMock } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    media: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), update: vi.fn(), delete: vi.fn(), create: vi.fn() },
    post: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
  fsMock: { unlink: vi.fn(async () => {}), mkdir: vi.fn(async () => {}), writeFile: vi.fn(async () => {}) },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))
vi.mock('fs/promises', () => ({ default: fsMock, ...fsMock }))
vi.mock('@/lib/media/storage', () => ({
  siteUploadDir: vi.fn(() => '/tmp/uploads/s1'),
  sitePublicPrefix: vi.fn(() => '/uploads/s1'),
}))
vi.mock('@/lib/media/image-processor', () => ({
  processImage: vi.fn(),
  saveProcessedImage: vi.fn(),
  generateAltText: vi.fn(async () => null),
}))
vi.mock('@/lib/rate-limit', () => ({
  rateLimit: vi.fn(async () => ({ allowed: true })),
  rateLimitResponse: vi.fn(),
}))

import { GET as list } from './route'
import { GET, PUT, DELETE } from './[id]/route'
import { POST as upload } from './upload/route'
import { POST as uploadUrl } from './upload/url/route'

const ctx = { params: Promise.resolve({ id: 'm1' }) }
const row = { id: 'm1', siteId: 's1', filename: 'a.webp', urlOriginal: null }
const json = (method: string, body?: unknown) =>
  new NextRequest('http://localhost/api/media/m1', { method, body: body === undefined ? undefined : JSON.stringify(body) })

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.media.findUnique.mockResolvedValue(row)
  prisma.media.update.mockResolvedValue(row)
  prisma.post.findFirst.mockResolvedValue(null)
  prisma.$transaction.mockResolvedValue([[], 0])
})

describe('GET /api/media', () => {
  it('lists media with access', async () => {
    expect((await list(new NextRequest('http://localhost/api/media'))).status).toBe(200)
  })
  it('403 without access', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await list(new NextRequest('http://localhost/api/media'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site access denied' })
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})

describe('/api/media/[id]', () => {
  it('GET / PUT / DELETE succeed for an accessible site', async () => {
    expect((await GET(json('GET'), ctx)).status).toBe(200)
    expect((await PUT(json('PUT', { altText: 'x' }), ctx)).status).toBe(200)
    expect((await DELETE(json('DELETE'), ctx)).status).toBe(200)
    expect(prisma.media.delete).toHaveBeenCalledWith({ where: { id: 'm1' } })
  })
  it('404 on every method for media of an inaccessible site, with no write or file delete', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect((await GET(json('GET'), ctx)).status).toBe(404)
    expect((await PUT(json('PUT', { altText: 'x' }), ctx)).status).toBe(404)
    const res = await DELETE(json('DELETE'), ctx)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(prisma.media.update).not.toHaveBeenCalled()
    expect(prisma.media.delete).not.toHaveBeenCalled()
    expect(fsMock.unlink).not.toHaveBeenCalled()
  })
})

describe('media upload routes', () => {
  beforeEach(() => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
  })
  it('upload 403 without access to the site, before anything is written', async () => {
    const fd = new FormData()
    fd.set('file', new File(['x'], 'a.pdf', { type: 'application/pdf' }))
    const res = await upload(new NextRequest('http://localhost/api/media/upload', { method: 'POST', body: fd }))
    expect(res.status).toBe(403)
    expect(fsMock.writeFile).not.toHaveBeenCalled()
    expect(prisma.media.create).not.toHaveBeenCalled()
  })
  it('upload/url 403 without access and no download is attempted', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    const res = await uploadUrl(
      new NextRequest('http://localhost/api/media/upload/url', { method: 'POST', body: JSON.stringify({ url: 'https://example.com/a.png' }) }),
    )
    expect(res.status).toBe(403)
    expect(fetchSpy).not.toHaveBeenCalled()
    expect(prisma.media.create).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
  it('upload stores a pdf for an accessible site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
    prisma.media.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 'm9', ...data }))
    const fd = new FormData()
    fd.set('file', new File(['x'], 'a.pdf', { type: 'application/pdf' }))
    const res = await upload(new NextRequest('http://localhost/api/media/upload', { method: 'POST', body: fd }))
    expect(res.status).toBe(201)
    expect(prisma.media.create).toHaveBeenCalled()
  })
})
