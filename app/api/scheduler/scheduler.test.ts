import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    post: { findMany: vi.fn(), update: vi.fn(), count: vi.fn() },
    schedulerLog: { updateMany: vi.fn() },
    siteScheduleSettings: { findUnique: vi.fn(), upsert: vi.fn() },
    notFoundLog: { findMany: vi.fn(), count: vi.fn(), findUnique: vi.fn(), delete: vi.fn(), deleteMany: vi.fn() },
    seoSettings: { findUnique: vi.fn(), upsert: vi.fn() },
    page: { count: vi.fn() },
    category: { count: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('@/lib/site', () => ({ getSiteIdFromRequest: vi.fn(async () => 's1') }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/notifications/email-service', () => ({ notifyPostPublished: vi.fn(async () => {}) }))

import { GET as calendar } from './calendar/route'
import { GET as run } from './run/route'
import { GET as getSettings, PUT as putSettings } from './settings/route'
import { POST as rebuild, GET as stats } from '../sitemap/rebuild/route'
import { GET as ping } from '../sitemap/ping/route'
import { GET as listLogs, DELETE as clearLogs } from '../not-found-log/route'
import { DELETE as deleteLog } from '../not-found-log/[id]/route'

const get = (url: string, headers?: Record<string, string>) => new NextRequest(`http://localhost${url}`, { headers })
const send = (url: string, method: string, body?: unknown) =>
  new NextRequest(`http://localhost${url}`, { method, body: body === undefined ? undefined : JSON.stringify(body) })
const ctx = { params: Promise.resolve({ id: 'n1' }) }

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.post.findMany.mockResolvedValue([])
  prisma.siteScheduleSettings.findUnique.mockResolvedValue(null)
  prisma.siteScheduleSettings.upsert.mockResolvedValue({ siteId: 's1' })
  prisma.notFoundLog.findUnique.mockResolvedValue({ id: 'n1', siteId: 's1' })
  prisma.notFoundLog.delete.mockResolvedValue({})
  prisma.notFoundLog.deleteMany.mockResolvedValue({ count: 0 })
  prisma.seoSettings.findUnique.mockResolvedValue(null)
  prisma.seoSettings.upsert.mockResolvedValue({})
  prisma.post.update.mockResolvedValue({})
  prisma.post.count.mockResolvedValue(0)
  prisma.page.count.mockResolvedValue(0)
  prisma.category.count.mockResolvedValue(0)
  prisma.$transaction.mockResolvedValue([[], 0])
})

describe('scheduler calendar and settings', () => {
  it('work with access', async () => {
    expect((await calendar(get('/api/scheduler/calendar?siteId=s1'))).status).toBe(200)
    expect((await getSettings(get('/api/scheduler/settings?siteId=s1'))).status).toBe(200)
    expect((await putSettings(send('/api/scheduler/settings', 'PUT', { siteId: 's1', maxPerDay: 2 }))).status).toBe(200)
  })
  it('403 without access to the requested site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await calendar(get('/api/scheduler/calendar?siteId=s2'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site access denied' })
    expect((await getSettings(get('/api/scheduler/settings?siteId=s2'))).status).toBe(403)
    expect((await putSettings(send('/api/scheduler/settings', 'PUT', { siteId: 's2', maxPerDay: 2 }))).status).toBe(403)
    expect(prisma.post.findMany).not.toHaveBeenCalled()
    expect(prisma.siteScheduleSettings.upsert).not.toHaveBeenCalled()
  })
})

describe('scheduler/run (cron secret path)', () => {
  const original = process.env.CRON_SECRET
  beforeEach(() => {
    process.env.CRON_SECRET = 'topsecret'
  })
  afterEach(() => {
    process.env.CRON_SECRET = original
  })
  it('still works with the secret and never consults UserSiteAccess', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await run(get('/api/scheduler/run', { 'x-cron-secret': 'topsecret' }))
    expect(res.status).toBe(200)
    expect(prisma.userSiteAccess.findUnique).not.toHaveBeenCalled()
  })
  it('401 without the secret', async () => {
    expect((await run(get('/api/scheduler/run'))).status).toBe(401)
  })
})

describe('sitemap routes', () => {
  it('rebuild and stats work with access', async () => {
    expect((await rebuild(send('/api/sitemap/rebuild', 'POST'))).status).toBe(200)
    expect((await stats(get('/api/sitemap/rebuild'))).status).toBe(200)
  })
  it('403 on rebuild and stats without access, no upsert', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await rebuild(send('/api/sitemap/rebuild', 'POST'))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Site access denied' })
    expect((await stats(get('/api/sitemap/rebuild'))).status).toBe(403)
    expect(prisma.seoSettings.upsert).not.toHaveBeenCalled()
  })
  it('ping takes no site and stays session-only', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await ping(get('/api/sitemap/ping?url=https://evil.example/x'))
    expect(res.status).toBe(400)
    expect(prisma.userSiteAccess.findUnique).not.toHaveBeenCalled()
  })
})

describe('not-found-log', () => {
  it('list, clear and delete-one work with access', async () => {
    expect((await listLogs(get('/api/not-found-log'))).status).toBe(200)
    expect((await clearLogs(send('/api/not-found-log', 'DELETE'))).status).toBe(200)
    expect((await deleteLog(send('/api/not-found-log/n1', 'DELETE'), ctx)).status).toBe(200)
    expect(prisma.notFoundLog.delete).toHaveBeenCalledWith({ where: { id: 'n1' } })
  })
  it('403 on list and clear without access, nothing deleted', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    expect((await listLogs(get('/api/not-found-log'))).status).toBe(403)
    expect((await clearLogs(send('/api/not-found-log', 'DELETE'))).status).toBe(403)
    expect(prisma.notFoundLog.deleteMany).not.toHaveBeenCalled()
  })
  it('404 and no delete for a log of an inaccessible site', async () => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
    const res = await deleteLog(send('/api/not-found-log/n1', 'DELETE'), ctx)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: 'Not found' })
    expect(prisma.notFoundLog.delete).not.toHaveBeenCalled()
  })
  it('keeps the idempotent success for a log that no longer exists', async () => {
    prisma.notFoundLog.findUnique.mockResolvedValue(null)
    const res = await deleteLog(send('/api/not-found-log/n1', 'DELETE'), ctx)
    expect(res.status).toBe(200)
    expect(prisma.notFoundLog.delete).not.toHaveBeenCalled()
  })
})
