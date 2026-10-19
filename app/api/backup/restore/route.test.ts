import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma, auth, execMock } = vi.hoisted(() => ({
  prisma: { userSiteAccess: { findUnique: vi.fn() } },
  auth: vi.fn(),
  execMock: vi.fn(),
}))

vi.mock('@/auth', () => ({ auth }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))
vi.mock('child_process', () => ({ exec: execMock, default: { exec: execMock } }))
vi.mock('fs/promises', () => ({ default: { access: vi.fn(async () => {}) }, access: vi.fn(async () => {}) }))

import { POST } from './route'

const post = (b: unknown) =>
  POST(new NextRequest('http://localhost/api/backup/restore', { method: 'POST', body: JSON.stringify(b) }))
const ok = { backupFile: '/backups/a.sql.gz', confirm: true }

beforeEach(() => {
  vi.clearAllMocks()
  process.env.DATABASE_URL = 'postgresql://u:p@localhost:5432/db'
  auth.mockResolvedValue({ user: { id: 'u1', role: 'ADMIN' } })
  prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'ADMIN' })
  execMock.mockImplementation((_c: string, _o: unknown, cb: (e: null, r: object) => void) =>
    cb(null, { stdout: '', stderr: '' }),
  )
})

describe('POST /api/backup/restore', () => {
  it('403 for a global non-ADMIN', async () => {
    auth.mockResolvedValue({ user: { id: 'u1', role: 'EDITOR' } })
    expect((await post(ok)).status).toBe(403)
    expect(execMock).not.toHaveBeenCalled()
  })
  it('403 for a global ADMIN who is not admin of the site, nothing executed', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'EDITOR' })
    const res = await post(ok)
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site admin required' })
    expect(execMock).not.toHaveBeenCalled()
  })
  it('checks the site named in the body', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect((await post({ ...ok, siteId: 's9' })).status).toBe(403)
    expect(prisma.userSiteAccess.findUnique).toHaveBeenCalledWith({
      where: { userId_siteId: { userId: 'u1', siteId: 's9' } },
      select: { role: true },
    })
    expect(execMock).not.toHaveBeenCalled()
  })
  it('restores for a global + site admin', async () => {
    const res = await post(ok)
    expect(res.status).toBe(200)
    expect(execMock).toHaveBeenCalledTimes(1)
  })
})
