import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    listing: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn(), update: vi.fn(), delete: vi.fn() },
    listingService: { findMany: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))

import { auth } from '@/auth'
import { GET, PUT, DELETE } from './route'

const ctx = { params: Promise.resolve({ id: 'l1' }) }
const existing = {
  id: 'l1',
  siteId: 's1',
  type: 'VET',
  slug: 'popescu',
  citySlug: 'cluj-napoca',
  publishedAt: null,
}
const body = {
  type: 'VET',
  name: 'Cabinet Vet Popescu',
  county: 'Cluj',
  city: 'Cluj-Napoca',
  phone: '0721 234 567',
}
const put = (b: unknown) =>
  PUT(new NextRequest('http://localhost/api/listings/l1', { method: 'PUT', body: JSON.stringify(b) }), ctx)

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.listing.findUnique.mockResolvedValue(existing)
  prisma.listing.findFirst.mockResolvedValue(null)
  prisma.listing.findMany.mockResolvedValue([])
  prisma.listing.update.mockImplementation(async ({ data }: { data: object }) => ({ ...existing, ...data }))
  prisma.listing.delete.mockResolvedValue({})
  prisma.listingService.findMany.mockResolvedValue([])
})

describe('GET /api/listings/[id]', () => {
  it('404 when missing', async () => {
    prisma.listing.findUnique.mockResolvedValue(null)
    expect((await GET(new NextRequest('http://localhost/api/listings/l1'), ctx)).status).toBe(404)
  })
})

describe('PUT /api/listings/[id]', () => {
  it('404 when missing', async () => {
    prisma.listing.findUnique.mockResolvedValue(null)
    expect((await put(body)).status).toBe(404)
  })

  it('400 for an invalid body', async () => {
    expect((await put({ ...body, phone: '123' })).status).toBe(400)
    expect(prisma.listing.update).not.toHaveBeenCalled()
  })

  it('keeps the existing slug and skips the conflict query when the key is unchanged', async () => {
    const res = await put(body)
    expect(res.status).toBe(200)
    expect(prisma.listing.findFirst).not.toHaveBeenCalled()
    expect(prisma.listing.update.mock.calls[0][0].data.slug).toBe('popescu')
  })

  it('409 when an explicit new slug is taken in the same city', async () => {
    prisma.listing.findFirst.mockResolvedValue({ id: 'other' })
    expect((await put({ ...body, slug: 'altul' })).status).toBe(409)
  })

  it('moving to another city picks a free variant of the current slug on conflict', async () => {
    prisma.listing.findFirst.mockResolvedValueOnce({ id: 'other' }).mockResolvedValue(null)
    const res = await put({ ...body, city: 'Iași', county: 'Iași' })
    expect(res.status).toBe(200)
    const data = prisma.listing.update.mock.calls[0][0].data
    expect(data.citySlug).toBe('iasi')
    expect(data.slug).toBe('popescu-2')
  })

  it('stores the already-saved spelling of city and county', async () => {
    prisma.listing.findMany.mockResolvedValueOnce([{ city: 'Iași' }]).mockResolvedValueOnce([{ county: 'Iași' }])
    const res = await put({ ...body, city: 'Iasi', county: 'Iasi' })
    expect(res.status).toBe(200)
    const data = prisma.listing.update.mock.calls[0][0].data
    expect(data).toMatchObject({ city: 'Iași', county: 'Iași', citySlug: 'iasi' })
    expect(prisma.listing.findMany.mock.calls[0][0].where).toMatchObject({ id: { not: 'l1' } })
  })

  it('sets publishedAt on first publish and clears it on unpublish', async () => {
    await put({ ...body, status: 'PUBLISHED' })
    expect(prisma.listing.update.mock.calls[0][0].data.publishedAt).toBeInstanceOf(Date)
    await put({ ...body, status: 'DRAFT' })
    expect(prisma.listing.update.mock.calls[1][0].data.publishedAt).toBeNull()
  })

  it('replaces the service links', async () => {
    prisma.listingService.findMany.mockResolvedValue([{ id: 'sv1' }])
    await put({ ...body, serviceIds: ['sv1'] })
    expect(prisma.listing.update.mock.calls[0][0].data.services).toEqual({
      deleteMany: {},
      create: [{ serviceId: 'sv1' }],
    })
  })
})

describe('PUT /api/listings/[id] edge cases', () => {
  it('409 on a unique-key race (P2002)', async () => {
    prisma.listing.update.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }))
    expect((await put(body)).status).toBe(409)
  })
  it('400 for an over-long explicit slug', async () => {
    expect((await put({ ...body, slug: 'a'.repeat(241) })).status).toBe(400)
  })
  it('400 when the city slug is longer than 100 chars', async () => {
    expect((await put({ ...body, city: 'ß'.repeat(60) })).status).toBe(400)
  })
  it('400 when a type change leaves services of the old type', async () => {
    prisma.listingService.findMany.mockResolvedValue([])
    expect((await put({ ...body, type: 'GROOMER', serviceIds: ['sv1'] })).status).toBe(400)
    expect(prisma.listingService.findMany.mock.calls[0][0].where).toMatchObject({ type: 'GROOMER', siteId: 's1' })
  })
  it('clears the service links when serviceIds is omitted', async () => {
    await put(body)
    expect(prisma.listing.update.mock.calls[0][0].data.services).toEqual({ deleteMany: {}, create: [] })
  })
  it('401 without a session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    expect((await put(body)).status).toBe(401)
  })
})

describe('DELETE /api/listings/[id]', () => {
  it('404 when missing, 200 otherwise', async () => {
    prisma.listing.findUnique.mockResolvedValueOnce(null)
    expect((await DELETE(new NextRequest('http://localhost/api/listings/l1', { method: 'DELETE' }), ctx)).status).toBe(404)
    expect((await DELETE(new NextRequest('http://localhost/api/listings/l1', { method: 'DELETE' }), ctx)).status).toBe(200)
    expect(prisma.listing.delete).toHaveBeenCalledWith({ where: { id: 'l1' } })
  })
})

describe('site access', () => {
  beforeEach(() => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
  })
  it('404 on GET for a listing of a site the user cannot access', async () => {
    const res = await GET(new NextRequest('http://localhost/api/listings/l1'), ctx)
    expect(res.status).toBe(404)
    expect(prisma.userSiteAccess.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId_siteId: { userId: 'u1', siteId: 's1' } } }),
    )
  })
  it('404 on PUT and no update', async () => {
    expect((await put(body)).status).toBe(404)
    expect(prisma.listing.update).not.toHaveBeenCalled()
  })
  it('404 on DELETE and no delete', async () => {
    const res = await DELETE(new NextRequest('http://localhost/api/listings/l1', { method: 'DELETE' }), ctx)
    expect(res.status).toBe(404)
    expect(prisma.listing.delete).not.toHaveBeenCalled()
  })
})
