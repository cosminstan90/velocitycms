import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    backupLog: { findMany: vi.fn(), count: vi.fn(), findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))

import { GET } from './route'

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'ADMIN' })
  prisma.$transaction.mockImplementation(async (qs: unknown[]) => (qs.length === 2 ? [[], 0] : [null, null, null]))
})

describe('GET /api/backup/list', () => {
  it('403 for a non-admin, no log query', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'EDITOR' })
    const res = await GET(new NextRequest('http://localhost/api/backup/list'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site admin required' })
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(prisma.backupLog.findMany).not.toHaveBeenCalled()
  })
  it('200 for a site admin', async () => {
    expect((await GET(new NextRequest('http://localhost/api/backup/list'))).status).toBe(200)
  })
})
