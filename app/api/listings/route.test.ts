import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    listing: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
    listingService: { findMany: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { auth } from '@/auth'
import { GET, POST } from './route'

const body = {
  type: 'VET',
  name: 'Cabinet Vet Popescu',
  county: 'Cluj',
  city: 'Cluj-Napoca',
  phone: '0721 234 567',
}
const post = (b: unknown) =>
  POST(new NextRequest('http://localhost/api/listings', { method: 'POST', body: JSON.stringify(b) }))

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.listing.findFirst.mockResolvedValue(null)
  prisma.listing.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 'l1', ...data }))
  prisma.listing.findMany.mockResolvedValue([])
  prisma.listing.count.mockResolvedValue(0)
  prisma.listingService.findMany.mockResolvedValue([])
})

describe('POST /api/listings', () => {
  it('400 for an invalid body', async () => {
    expect((await post({ ...body, type: 'XYZ' })).status).toBe(400)
    expect(prisma.listing.create).not.toHaveBeenCalled()
  })

  it('201 creates with derived slug, citySlug and normalized phone', async () => {
    const res = await post(body)
    expect(res.status).toBe(201)
    const data = prisma.listing.create.mock.calls[0][0].data
    expect(data).toMatchObject({
      siteId: 's1',
      type: 'VET',
      slug: 'cabinet-vet-popescu',
      citySlug: 'cluj-napoca',
      phone: '+40721234567',
      status: 'DRAFT',
      publishedAt: null,
    })
  })

  it('stores the already-saved spelling of city and county', async () => {
    prisma.listing.findMany.mockResolvedValueOnce([{ city: 'Iași' }]).mockResolvedValueOnce([{ county: 'Iași' }])
    const res = await post({ ...body, city: 'Iasi', county: 'Iasi' })
    expect(res.status).toBe(201)
    expect(prisma.listing.create.mock.calls[0][0].data).toMatchObject({ city: 'Iași', county: 'Iași', citySlug: 'iasi' })
  })

  it('keeps the typed spelling when nothing similar exists', async () => {
    await post({ ...body, city: 'Iasi', county: 'Iasi' })
    expect(prisma.listing.create.mock.calls[0][0].data).toMatchObject({ city: 'Iasi', county: 'Iasi' })
  })

  it('sets publishedAt when created as PUBLISHED', async () => {
    await post({ ...body, status: 'PUBLISHED' })
    expect(prisma.listing.create.mock.calls[0][0].data.publishedAt).toBeInstanceOf(Date)
  })

  it('adds a numeric suffix when the derived slug is taken', async () => {
    prisma.listing.findFirst.mockResolvedValueOnce({ id: 'x' }).mockResolvedValue(null)
    await post(body)
    expect(prisma.listing.create.mock.calls[0][0].data.slug).toBe('cabinet-vet-popescu-2')
  })

  it('409 when an explicit slug is taken', async () => {
    prisma.listing.findFirst.mockResolvedValue({ id: 'x' })
    expect((await post({ ...body, slug: 'popescu' })).status).toBe(409)
  })

  it('400 when a service does not exist for this type', async () => {
    prisma.listingService.findMany.mockResolvedValue([])
    expect((await post({ ...body, serviceIds: ['s-x'] })).status).toBe(400)
  })

  it('links the given services', async () => {
    prisma.listingService.findMany.mockResolvedValue([{ id: 'sv1' }])
    await post({ ...body, serviceIds: ['sv1'] })
    expect(prisma.listing.create.mock.calls[0][0].data.services).toEqual({ create: [{ serviceId: 'sv1' }] })
  })
})

describe('POST /api/listings edge cases', () => {
  it('409 on a unique-key race (P2002)', async () => {
    prisma.listing.create.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }))
    expect((await post(body)).status).toBe(409)
  })
  it('rethrows other create errors', async () => {
    prisma.listing.create.mockRejectedValue(new Error('boom'))
    await expect(post(body)).rejects.toThrow('boom')
  })
  it('400 for an over-long explicit slug', async () => {
    expect((await post({ ...body, slug: 'a'.repeat(241) })).status).toBe(400)
  })
  it('400 when the city slug is longer than 100 chars', async () => {
    expect((await post({ ...body, city: 'ß'.repeat(60) })).status).toBe(400)
  })
  it('truncates the derived base slug to 240 chars', async () => {
    await post({ ...body, name: 'a'.repeat(255) })
    expect(prisma.listing.create.mock.calls[0][0].data.slug).toHaveLength(240)
  })
})

describe('GET /api/listings', () => {
  it('401 without a session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    expect((await GET(new NextRequest('http://localhost/api/listings'))).status).toBe(401)
  })
  it('scopes by site and applies filters', async () => {
    await GET(new NextRequest('http://localhost/api/listings?type=VET&status=DRAFT&page=2'))
    const args = prisma.listing.findMany.mock.calls[0][0]
    expect(args.where).toMatchObject({ siteId: 's1', type: 'VET', status: 'DRAFT' })
    expect(args.skip).toBe(20)
  })
  it('ignores unknown filter values', async () => {
    await GET(new NextRequest('http://localhost/api/listings?type=ZZZ&status=ARCHIVED&page=abc'))
    const args = prisma.listing.findMany.mock.calls[0][0]
    expect(args.where).toEqual({ siteId: 's1' })
    expect(args.skip).toBe(0)
  })
})

describe('site access', () => {
  it('403 on GET when the user has no access to the site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await GET(new NextRequest('http://localhost/api/listings'))
    expect(res.status).toBe(403)
    expect(prisma.listing.findMany).not.toHaveBeenCalled()
  })
  it('403 on POST when the user has no access to the site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect((await post(body)).status).toBe(403)
    expect(prisma.listing.create).not.toHaveBeenCalled()
  })
})
