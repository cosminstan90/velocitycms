import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma, runBackup } = vi.hoisted(() => ({
  prisma: { userSiteAccess: { findUnique: vi.fn() }, site: { findFirst: vi.fn() } },
  runBackup: vi.fn(),
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))
vi.mock('@/lib/backup/backup-runner', () => ({ runBackup }))
vi.mock('@/lib/notifications/email-service', () => ({
  notifyBackupResult: vi.fn(async () => {}),
  check404SpikeAndNotify: vi.fn(async () => {}),
}))

import { GET, POST } from './route'

const post = (b: unknown) =>
  POST(new NextRequest('http://localhost/api/backup/run', { method: 'POST', body: JSON.stringify(b) }))

beforeEach(() => {
  vi.clearAllMocks()
  process.env.CRON_SECRET = 'secret'
  prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'ADMIN' })
  prisma.site.findFirst.mockResolvedValue({ id: 's1' })
  runBackup.mockResolvedValue({ logId: 'l1', status: 'SUCCESS', filePath: 'x', fileSize: 1, duration: 1, error: null })
})

describe('POST /api/backup/run', () => {
  it('403 for a non-admin, backup not executed', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'EDITOR' })
    const res = await post({ type: 'database' })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site admin required' })
    expect(runBackup).not.toHaveBeenCalled()
  })
  it('200 runs the backup for a site admin', async () => {
    const res = await post({ type: 'database' })
    expect(res.status).toBe(200)
    expect(runBackup).toHaveBeenCalledWith('s1', 'database')
  })
})

describe('GET /api/backup/run (cron secret path, unchanged)', () => {
  it('403 without the secret', async () => {
    const res = await GET(new NextRequest('http://localhost/api/backup/run'))
    expect(res.status).toBe(403)
    expect(runBackup).not.toHaveBeenCalled()
  })
  it('runs with the secret and needs no session role', async () => {
    const res = await GET(
      new NextRequest('http://localhost/api/backup/run', { headers: { 'x-cron-secret': 'secret' } }),
    )
    expect(res.status).toBe(200)
    expect(runBackup).toHaveBeenCalledWith('s1', 'database')
    expect(prisma.userSiteAccess.findUnique).not.toHaveBeenCalled()
  })
})
