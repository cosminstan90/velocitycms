import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { prisma } = vi.hoisted(() => ({
  prisma: {
    userSiteAccess: { findUnique: vi.fn() },
    page: { findUnique: vi.fn(), findFirst: vi.fn(), update: vi.fn(), delete: vi.fn() },
    fieldValue: { findMany: vi.fn(), upsert: vi.fn() },
    $transaction: vi.fn(),
  },
}))

vi.mock('@/auth', () => ({ auth: vi.fn(async () => ({ user: { id: 'u1', activeSiteId: 's1' } })) }))
vi.mock('@/lib/prisma', () => ({ prisma }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }))

import { GET, PUT, DELETE } from './route'
import { GET as getFieldValues, PUT as putFieldValues } from './field-values/route'
import { POST as publish } from './publish/route'
import { POST as unpublish } from './unpublish/route'
import { POST as restore } from './restore/[version]/route'
import { GET as getRevisions } from './revisions/route'

const ctx = { params: Promise.resolve({ id: 'pg1' }) }
const vctx = { params: Promise.resolve({ id: 'pg1', version: '1' }) }
const req = (method = 'GET', body?: unknown) =>
  new NextRequest('http://localhost/api/pages/pg1', { method, body: body === undefined ? undefined : JSON.stringify(body) })

const pageRow = {
  id: 'pg1', siteId: 's1', title: 'T', slug: 't', status: 'DRAFT',
  contentJson: {}, contentHtml: '', metaTitle: null, metaDescription: null,
  revisions: [{ version: 1, title: 'Old', contentJson: {}, contentHtml: '', metaTitle: null, metaDescription: null }],
}

beforeEach(() => {
  vi.clearAllMocks()
  prisma.userSiteAccess.findUnique.mockResolvedValue({ id: 'a1' })
  prisma.page.findUnique.mockResolvedValue(pageRow)
  prisma.page.findFirst.mockResolvedValue(null)
  prisma.page.update.mockResolvedValue({ ...pageRow, author: null })
  prisma.fieldValue.findMany.mockResolvedValue([])
  prisma.fieldValue.upsert.mockReturnValue({})
  prisma.$transaction.mockResolvedValue([])
})

describe('/api/pages/[id] with access', () => {
  it('GET', async () => expect((await GET(req(), ctx)).status).toBe(200))
  it('PUT updates', async () => {
    expect((await PUT(req('PUT', { title: 'New' }), ctx)).status).toBe(200)
    expect(prisma.page.update).toHaveBeenCalled()
  })
  it('DELETE removes a draft', async () => {
    expect((await DELETE(req('DELETE'), ctx)).status).toBe(200)
    expect(prisma.page.delete).toHaveBeenCalledWith({ where: { id: 'pg1' } })
  })
  it('publish', async () => expect((await publish(req('POST'), ctx)).status).toBe(200))
})

describe('/api/pages/[id] page of an inaccessible site', () => {
  beforeEach(() => {
    prisma.userSiteAccess.findUnique.mockResolvedValue(null)
  })
  const cases: Array<[string, () => Promise<Response>]> = [
    ['GET', () => GET(req(), ctx)],
    ['PUT', () => PUT(req('PUT', { title: 'x' }), ctx)],
    ['DELETE', () => DELETE(req('DELETE'), ctx)],
    ['field-values GET', () => getFieldValues(req(), ctx)],
    ['field-values PUT', () => putFieldValues(req('PUT', [{ fieldDefinitionId: 'f', value: 'v' }]), ctx)],
    ['publish', () => publish(req('POST'), ctx)],
    ['unpublish', () => unpublish(req('POST'), ctx)],
    ['restore', () => restore(req('POST'), vctx)],
    ['revisions GET', () => getRevisions(req(), ctx)],
  ]
  it.each(cases)('404 and no side effects: %s', async (_name, call) => {
    expect((await call()).status).toBe(404)
    expect(prisma.page.update).not.toHaveBeenCalled()
    expect(prisma.page.delete).not.toHaveBeenCalled()
    expect(prisma.fieldValue.upsert).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})
