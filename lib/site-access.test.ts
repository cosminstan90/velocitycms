import { describe, it, expect, vi, beforeEach } from 'vitest'

const { prisma } = vi.hoisted(() => ({ prisma: { userSiteAccess: { findUnique: vi.fn() } } }))
vi.mock('@/lib/prisma', () => ({ prisma }))

import { hasSiteAccess } from './site-access'

beforeEach(() => vi.clearAllMocks())

describe('hasSiteAccess', () => {
  it('true when a UserSiteAccess row exists, queried by the composite key', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
    expect(await hasSiteAccess('u1', 's1')).toBe(true)
    expect(prisma.userSiteAccess.findUnique).toHaveBeenCalledWith({
      where: { userId_siteId: { userId: 'u1', siteId: 's1' } },
      select: { id: true },
    })
  })
  it('false when there is no row', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect(await hasSiteAccess('u1', 's2')).toBe(false)
  })
})
