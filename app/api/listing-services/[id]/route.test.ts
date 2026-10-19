import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    listingService: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))

import { auth } from '@/auth'
import { PUT, DELETE } from './route'

const ctx = { params: Promise.resolve({ id: 'sv1' }) }
const existing = { id: 'sv1', siteId: 's1', type: 'VET', slug: 'urgente', name: 'Urgențe' }
const put = (b: unknown) =>
  PUT(new NextRequest('http://localhost/api/listing-services/sv1', { method: 'PUT', body: JSON.stringify(b) }), ctx)
const del = () =>
  DELETE(new NextRequest('http://localhost/api/listing-services/sv1', { method: 'DELETE' }), ctx)

beforeEach(() => {
  vi.clearAllMocks()
  prisma.listingService.findUnique.mockResolvedValue(existing)
  prisma.listingService.findFirst.mockResolvedValue(null)
  prisma.listingService.update.mockImplementation(async ({ data }: { data: object }) => ({ ...existing, ...data }))
  prisma.listingService.delete.mockResolvedValue({})
})

describe('PUT /api/listing-services/[id]', () => {
  it('401 without a session', async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as never)
    expect((await put({ name: 'Nou' })).status).toBe(401)
  })
  it('404 when missing', async () => {
    prisma.listingService.findUnique.mockResolvedValue(null)
    expect((await put({ name: 'Nou' })).status).toBe(404)
  })
  it('400 for a too short name', async () => {
    expect((await put({ name: 'N' })).status).toBe(400)
  })
  it('400 for a slug longer than 100 chars', async () => {
    expect((await put({ name: 'Nou', slug: 'a'.repeat(101) })).status).toBe(400)
  })
  it('409 when the new slug conflicts', async () => {
    prisma.listingService.findFirst.mockResolvedValue({ id: 'other' })
    expect((await put({ name: 'Nou', slug: 'altul' })).status).toBe(409)
  })
  it('409 on a unique-key race (P2002)', async () => {
    prisma.listingService.update.mockRejectedValue(Object.assign(new Error('dup'), { code: 'P2002' }))
    expect((await put({ name: 'Nou', slug: 'altul' })).status).toBe(409)
  })
  it('keeps the slug when not provided', async () => {
    const res = await put({ name: 'Nou' })
    expect(res.status).toBe(200)
    expect(prisma.listingService.findFirst).not.toHaveBeenCalled()
    expect(prisma.listingService.update).toHaveBeenCalledWith({
      where: { id: 'sv1' },
      data: { name: 'Nou', slug: 'urgente' },
    })
  })
})

describe('DELETE /api/listing-services/[id]', () => {
  it('404 when missing', async () => {
    prisma.listingService.findUnique.mockResolvedValue(null)
    expect((await del()).status).toBe(404)
  })
  it('200 deletes', async () => {
    expect((await del()).status).toBe(200)
    expect(prisma.listingService.delete).toHaveBeenCalledWith({ where: { id: 'sv1' } })
  })
})
