import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    post: { findUnique: vi.fn(), update: vi.fn(), count: vi.fn() },
    category: { findUnique: vi.fn() },
    fieldValue: { findMany: vi.fn(), upsert: vi.fn() },
    siteScheduleSettings: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))
vi.mock('@/lib/notifications/email-service', () => ({ notifyPostPublished: vi.fn(async () => {}) }))
vi.mock('@/lib/seo/internal-linker', () => ({
  getLinksAlreadyInContent: vi.fn(() => ({ internal: [], external: [] })),
  getSuggestedLinks: vi.fn(async () => []),
  invalidateLinkSuggestionsCache: vi.fn(async () => {}),
}))
vi.mock('@/lib/scheduler/smart-scheduler', () => ({
  getNextAvailableSlot: vi.fn(),
  schedulePost: vi.fn(async () => ({ scheduledAt: new Date('2030-01-01T00:00:00Z'), logId: 'log1' })),
  cancelSchedule: vi.fn(async () => {}),
}))

import { GET as getFieldValues, PUT as putFieldValues } from './field-values/route'
import { GET as getLinks } from './links/route'
import { POST as publish } from './publish/route'
import { POST as unpublish } from './unpublish/route'
import { POST as restore } from './restore/[version]/route'
import { GET as getRevisions } from './revisions/route'
import { POST as schedule, DELETE as unschedule } from './schedule/route'
import { POST as suggestLinks } from './suggest-links/route'
import { cancelSchedule, schedulePost } from '@/lib/scheduler/smart-scheduler'

const ctx = { params: Promise.resolve({ id: 'p1' }) }
const vctx = { params: Promise.resolve({ id: 'p1', version: '1' }) }
const req = (method = 'GET', body?: unknown) =>
  new NextRequest('http://localhost/api/posts/p1/x', { method, body: body === undefined ? undefined : JSON.stringify(body) })

const postRow = {
  id: 'p1', siteId: 's1', slug: 't', title: 'T', status: 'DRAFT', categoryId: null, category: null,
  contentJson: {}, contentHtml: '<p>x</p>', metaTitle: null, metaDescription: null,
  revisions: [{ version: 1, title: 'Old', contentJson: {}, contentHtml: '', metaTitle: null, metaDescription: null }],
}

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.post.findUnique.mockResolvedValue(postRow)
  prisma.post.update.mockResolvedValue({ id: 'p1', slug: 't', status: 'PUBLISHED', publishedAt: null })
  prisma.fieldValue.findMany.mockResolvedValue([])
  prisma.fieldValue.upsert.mockReturnValue({})
  prisma.$transaction.mockResolvedValue([])
  prisma.siteScheduleSettings.findUnique.mockResolvedValue(null)
  prisma.post.count.mockResolvedValue(0)
})

describe('post subroutes: positive path', () => {
  it('field-values GET', async () => expect((await getFieldValues(req(), ctx)).status).toBe(200))
  it('field-values PUT', async () => expect((await putFieldValues(req('PUT', []), ctx)).status).toBe(200))
  it('links GET', async () => expect((await getLinks(req(), ctx)).status).toBe(200))
  it('publish', async () => {
    expect((await publish(req('POST'), ctx)).status).toBe(200)
    expect(prisma.post.update).toHaveBeenCalled()
  })
  it('unpublish', async () => expect((await unpublish(req('POST'), ctx)).status).toBe(200))
  it('restore', async () => expect((await restore(req('POST'), vctx)).status).toBe(200))
  it('revisions GET', async () => expect((await getRevisions(req(), ctx)).status).toBe(200))
  it('schedule POST', async () => {
    const res = await schedule(req('POST', { scheduledAt: '2030-01-01T00:00:00Z' }), ctx)
    expect(res.status).toBe(200)
    expect(schedulePost).toHaveBeenCalled()
  })
  it('schedule DELETE', async () => {
    expect((await unschedule(req('DELETE'), ctx)).status).toBe(200)
    expect(cancelSchedule).toHaveBeenCalledWith('p1')
  })
  it('suggest-links POST', async () => expect((await suggestLinks(req('POST'), ctx)).status).toBe(200))
})

describe('post subroutes: post of an inaccessible site', () => {
  beforeEach(() => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
  })
  const cases: Array<[string, () => Promise<Response>]> = [
    ['field-values GET', () => getFieldValues(req(), ctx)],
    ['field-values PUT', () => putFieldValues(req('PUT', [{ fieldDefinitionId: 'f', value: 'v' }]), ctx)],
    ['links GET', () => getLinks(req(), ctx)],
    ['publish', () => publish(req('POST'), ctx)],
    ['unpublish', () => unpublish(req('POST'), ctx)],
    ['restore', () => restore(req('POST'), vctx)],
    ['revisions GET', () => getRevisions(req(), ctx)],
    ['schedule POST', () => schedule(req('POST', { scheduledAt: '2030-01-01T00:00:00Z' }), ctx)],
    ['schedule DELETE', () => unschedule(req('DELETE'), ctx)],
    ['suggest-links POST', () => suggestLinks(req('POST'), ctx)],
  ]
  it.each(cases)('404 and no side effects: %s', async (_name, call) => {
    const res = await call()
    expect(res.status).toBe(404)
    expect(prisma.post.update).not.toHaveBeenCalled()
    expect(prisma.fieldValue.upsert).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(schedulePost).not.toHaveBeenCalled()
    expect(cancelSchedule).not.toHaveBeenCalled()
  })
})
