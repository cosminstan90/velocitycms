import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    aPIKey: { findUnique: vi.fn(), update: vi.fn() },
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { DELETE } from './route'

const del = () =>
  DELETE(new NextRequest('http://localhost/api/api-keys/k1', { method: 'DELETE' }), {
    params: Promise.resolve({ id: 'k1' }),
  })

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'ADMIN' })
  prisma.aPIKey.findUnique.mockResolvedValue({ siteId: 's1' })
  prisma.aPIKey.update.mockResolvedValue({})
})

describe('DELETE /api/api-keys/[id]', () => {
  it('404 when the key is missing', async () => {
    prisma.aPIKey.findUnique.mockResolvedValue(null)
    expect((await del()).status).toBe(404)
    expect(prisma.aPIKey.update).not.toHaveBeenCalled()
  })
  it('403 for a non-admin, key not revoked', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'EDITOR' })
    expect((await del()).status).toBe(403)
    expect(prisma.aPIKey.update).not.toHaveBeenCalled()
  })
  it('403 when the key belongs to another site', async () => {
    prisma.aPIKey.findUnique.mockResolvedValue({ siteId: 's2' })
    expect((await del()).status).toBe(403)
    expect(prisma.aPIKey.update).not.toHaveBeenCalled()
  })
  it('200 revokes for a site admin', async () => {
    expect((await del()).status).toBe(200)
    expect(prisma.aPIKey.update).toHaveBeenCalledWith({ where: { id: 'k1' }, data: { isActive: false } })
  })
})
