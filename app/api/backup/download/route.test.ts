import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { Readable } from 'stream'

const { prisma, fsMock } = vi.hoisted(() => ({
  prisma: { userSiteAccess: { findUnique: vi.fn() }, backupLog: { findMany: vi.fn() } },
  fsMock: { accessSync: vi.fn(), statSync: vi.fn(), createReadStream: vi.fn() },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))
vi.mock('fs', () => ({ default: fsMock, ...fsMock }))

import { GET } from './route'

const get = (file: string) =>
  GET(new NextRequest(`http://localhost/api/backup/download?file=${encodeURIComponent(file)}`))

beforeEach(() => {
  vi.clearAllMocks()
  process.env.BACKUP_PATH = '/backups'
  prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'ADMIN' })
  prisma.backupLog.findMany.mockResolvedValue([{ filePath: '/backups/s1/db.sql.gz' }])
  fsMock.statSync.mockReturnValue({ size: 3 })
  fsMock.createReadStream.mockImplementation(() => Readable.from([Buffer.from('abc')]))
})

describe('GET /api/backup/download', () => {
  it('403 for a non-admin, no lookup and no stream', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue({ role: 'EDITOR' })
    const res = await get('/backups/s1/db.sql.gz')
    expect(res.status).toBe(403)
    expect(prisma.backupLog.findMany).not.toHaveBeenCalled()
    expect(fsMock.createReadStream).not.toHaveBeenCalled()
  })
  it('404 for a file not in this site logs, no stream', async () => {
    prisma.backupLog.findMany.mockResolvedValue([])
    const res = await get('/backups/s2/db.sql.gz')
    expect(res.status).toBe(404)
    expect(prisma.backupLog.findMany.mock.calls[0][0].where).toMatchObject({ siteId: 's1' })
    expect(fsMock.createReadStream).not.toHaveBeenCalled()
  })
  it('404 when a log only matches by substring', async () => {
    prisma.backupLog.findMany.mockResolvedValue([{ filePath: '/backups/s1/xdb.sql.gz' }])
    expect((await get('/backups/s1/db.sql.gz')).status).toBe(404)
    expect(fsMock.createReadStream).not.toHaveBeenCalled()
  })
  it('still rejects traversal', async () => {
    expect((await get('../../etc/passwd')).status).toBe(400)
    expect(fsMock.createReadStream).not.toHaveBeenCalled()
  })
  it('streams a file recorded in the site logs', async () => {
    const res = await get('/backups/s1/db.sql.gz')
    expect(res.status).toBe(200)
    expect(fsMock.createReadStream).toHaveBeenCalledTimes(1)
  })
  it('streams the db part of a FULL log (db|media)', async () => {
    prisma.backupLog.findMany.mockResolvedValue([{ filePath: '/backups/s1/db.sql.gz|/backups/s1/media' }])
    expect((await get('/backups/s1/db.sql.gz')).status).toBe(200)
  })
})
