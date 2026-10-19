import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    listingService: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { auth } from '@/auth'
import { GET, POST } from './route'

const post = (body: unknown) =>
  POST(new NextRequest('http://localhost/api/listing-services', { method: 'POST', body: JSON.stringify(body) }))

beforeEach(() => {
  vi.clearAllMocks()
  prisma.listingService.findFirst.mockResolvedValue(null)
  prisma.listingService.create.mockImplementation(async ({ data }: { data: object }) => ({ id: 'n1', ...data }))
  prisma.listingService.findMany.mockResolvedValue([])
})

describe('POST /api/listing-services', () => {
  it('400 for an invalid type', async () => {
    expect((await post({ type: 'XYZ', name: 'Tuns' })).status).toBe(400)
  })
  it('400 for a too short name', async () => {
    expect((await post({ type: 'GROOMER', name: 'T' })).status).toBe(400)
  })
  it('409 when the slug exists for the same site and type', async () => {
    prisma.listingService.findFirst.mockResolvedValue({ id: 'x' })
    expect((await post({ type: 'GROOMER', name: 'Tuns' })).status).toBe(409)
  })
  it('201 creates with a slug derived from the name', async () => {
    const res = await post({ type: 'VET', name: 'Urgențe 24/7' })
    expect(res.status).toBe(201)
    expect(prisma.listingService.create).toHaveBeenCalledWith({
      data: { siteId: 's1', type: 'VET', name: 'Urgențe 24/7', slug: 'urgente-247' },
    })
  })
})

describe('POST /api/listing-services edge cases', () => {
  it('409 on a unique-key race (P2002)', async () => {
    prisma.listingService.create.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }))
    expect((await post({ type: 'VET', name: 'Urgențe' })).status).toBe(409)
  })
  it('400 for a slug longer than 100 chars', async () => {
    expect((await post({ type: 'VET', name: 'Urgențe', slug: 'a'.repeat(101) })).status).toBe(400)
  })
  it('401 without a session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    expect((await post({ type: 'VET', name: 'Urgențe' })).status).toBe(401)
  })
})

describe('GET /api/listing-services', () => {
  it('filters by type when given', async () => {
    await GET(new NextRequest('http://localhost/api/listing-services?type=VET'))
    expect(prisma.listingService.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { siteId: 's1', type: 'VET' } }),
    )
  })
})
